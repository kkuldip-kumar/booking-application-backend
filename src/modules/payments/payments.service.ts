// src/modules/payments/payments.service.ts
import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { isUniqueViolation } from '../../common/utils/db-errors';
import { BookingsService } from '../bookings/bookings.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentIntentResponseDto, PaymentStatusResponseDto } from './dto/payment-response.dto';
import { Payment } from './entities/payment.entity';
import { PaymentGateway } from './gateways/payment-gateway.interface';
import { PaymentModeRegistry } from './modes/payment-mode.registry';
import { CURRENCY_INR, PAYMENT_GATEWAY } from './payments.constants';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    private readonly bookings: BookingsService,
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
}