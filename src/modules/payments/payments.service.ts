// src/modules/payments/payments.service.ts
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  BookingPaymentBridgeRegistry,
  CreatePaymentOrderInput,
  PaymentOrder,
  PaymentPort,
  RefundInput,
} from '../../common/contracts/payment.contract';
import { PaymentMode } from '../../common/enums/payment-mode.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { isUniqueViolation } from '../../common/utils/db-errors';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentIntentResponseDto, PaymentStatusResponseDto } from './dto/payment-response.dto';
import { Payment } from './entities/payment.entity';
import { PaymentGateway } from './gateways/payment-gateway.interface';
import { PaymentModeRegistry } from './modes/payment-mode.registry';
import { CURRENCY_INR, PAYMENT_GATEWAY } from './payments.constants';

@Injectable()
export class PaymentsService implements PaymentPort {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    private readonly bookings: BookingPaymentBridgeRegistry,
    private readonly registry: PaymentModeRegistry,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async createIntent(
    userId: string,
    dto: CreatePaymentIntentDto,
    idempotencyKey: string,
  ): Promise<PaymentIntentResponseDto> {
    const replay = await this.findReplay(userId, dto, idempotencyKey);
    if (replay) return PaymentIntentResponseDto.from(replay, this.gateway.getPublicKey(), {});

    const booking = await this.bookings.getPayableBooking(userId, dto.bookingId);
    const resolved = this.registry.get(dto.mode).resolve(dto);
    const order = await this.gateway.createOrder({
      receipt: booking.reference,
      amount: booking.totalAmount,
      currency: CURRENCY_INR,
    });

    try {
      const payment = await this.payments.save(
        this.payments.create({
          bookingId: booking.id,
          userId,
          gateway: this.gateway.name,
          gatewayOrderId: order.gatewayOrderId,
          gatewayPaymentId: null,
          idempotencyKey,
          amount: booking.totalAmount,
          currency: CURRENCY_INR,
          mode: dto.mode,
          modeDetails: { method: resolved.method, ...resolved.details },
          status: PaymentStatus.CREATED,
          refundRequired: false,
          rawPayload: null,
        }),
      );
      return PaymentIntentResponseDto.from(payment, this.gateway.getPublicKey(), resolved.prefill);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) throw new ConflictException('Duplicate payment request');
      throw error;
    }
  }

  async getByBooking(userId: string, bookingId: string): Promise<PaymentStatusResponseDto[]> {
    const rows = await this.payments.find({
      where: { bookingId, userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(PaymentStatusResponseDto.from);
  }

  private async findReplay(
    userId: string,
    dto: CreatePaymentIntentDto,
    idempotencyKey: string,
  ): Promise<Payment | null> {
    const existing = await this.payments.findOne({ where: { idempotencyKey } });
    if (!existing) return null;
    const isSameRequest =
      existing.userId === userId &&
      existing.bookingId === dto.bookingId &&
      existing.mode === dto.mode;
    if (!isSameRequest) throw new ConflictException('Idempotency key already used');
    return existing;
  }

  async createOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder> {
    const existing = await this.payments.findOne({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return this.replayOrder(existing, input);
    const order = await this.gateway.createOrder({
      receipt: input.bookingId,
      amount: input.amount,
      currency: input.currency,
    });
    try {
      const payment = await this.payments.save(this.payments.create({
        bookingId: input.bookingId,
        userId: input.userId,
        gateway: this.gateway.name,
        gatewayOrderId: order.gatewayOrderId,
        gatewayPaymentId: null,
        idempotencyKey: input.idempotencyKey,
        amount: input.amount,
        currency: input.currency,
        // The booking opens the order before the customer picks a method.
        mode: PaymentMode.UPI,
        modeDetails: {},
        status: PaymentStatus.CREATED,
        refundRequired: false,
        rawPayload: null,
      }));
      return this.toOrder(payment);
    } catch (error: unknown) {
      if (!isUniqueViolation(error)) throw error;
      const replay = await this.payments.findOne({ where: { idempotencyKey: input.idempotencyKey } });
      if (!replay) throw error;
      return this.replayOrder(replay, input);
    }
  }

  async refund(input: RefundInput): Promise<void> {
    const payment = await this.payments.findOne({
      where: {
        bookingId: input.bookingId,
        status: In([PaymentStatus.SUCCESS, PaymentStatus.REFUNDED]),
      },
      order: { createdAt: 'DESC' },
    });
    if (!payment) throw new NotFoundException('No captured payment for this booking');
    if (payment.status === PaymentStatus.REFUNDED) return;
    if (payment.amount !== input.amount) throw new ConflictException('Refund amount does not match');
    payment.status = PaymentStatus.REFUNDED;
    payment.refundRequired = false;
    await this.payments.save(payment);
  }

  private replayOrder(existing: Payment, input: CreatePaymentOrderInput): PaymentOrder {
    const isSameRequest = existing.userId === input.userId && existing.bookingId === input.bookingId;
    if (!isSameRequest) throw new ConflictException('Idempotency key already used');
    return this.toOrder(existing);
  }

  private toOrder(payment: Payment): PaymentOrder {
    return {
      orderId: payment.id,
      providerOrderId: payment.gatewayOrderId,
      amount: payment.amount,
      currency: payment.currency,
    };
  }
}