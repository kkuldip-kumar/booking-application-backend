// src/modules/payments/payment-webhook.service.ts
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { DataSource, EntityManager } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { BookingPaymentBridgeRegistry } from '../../common/contracts/payment.contract';
import { AuditLogService } from '../audit/audit-log.service';
import { Payment } from './entities/payment.entity';
import { PaymentGateway, VerifiedWebhookEvent } from './gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY } from './payments.constants';

type AuditEntry = Parameters<AuditLogService['record']>[0];

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly bookings: BookingPaymentBridgeRegistry,
    private readonly audit: AuditLogService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async handle(rawBody: Buffer, headers: IncomingHttpHeaders): Promise<void> {
    const event = this.gateway.parseWebhook(rawBody, headers);
    if (event.type === 'IGNORED') return;

    const entry = await this.dataSource.transaction((manager) => this.apply(manager, event));
    if (entry) await this.audit.record(entry);
  }

  private async apply(
    manager: EntityManager,
    event: VerifiedWebhookEvent,
  ): Promise<AuditEntry | null> {
    const payment = await manager
      .getRepository(Payment)
      .createQueryBuilder('p')
      .setLock('pessimistic_write')
      .where('p.gatewayOrderId = :orderId', { orderId: event.gatewayOrderId })
      .getOne();

    if (!payment) {
      this.logger.warn(`Webhook for unknown order ${event.gatewayOrderId}`);
      return null;
    }
    if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.REFUNDED) {
      return null; // duplicate delivery: no-op
    }
    return event.type === 'PAYMENT_FAILED'
      ? this.markFailed(manager, payment, event)
      : this.markSucceeded(manager, payment, event);
  }

  private async markFailed(
    manager: EntityManager,
    payment: Payment,
    event: VerifiedWebhookEvent,
  ): Promise<AuditEntry> {
    // Booking stays PENDING so the user can retry; the expiry job releases seats otherwise.
    payment.status = PaymentStatus.FAILED;
    payment.rawPayload = event.summary;
    await manager.save(payment);
    return { actorId: null, action: 'PAYMENT_FAILED', entityType: 'payment', entityId: payment.id };
  }

  private async markSucceeded(
    manager: EntityManager,
    payment: Payment,
    event: VerifiedWebhookEvent,
  ): Promise<AuditEntry> {
    payment.gatewayPaymentId = event.gatewayPaymentId;
    payment.rawPayload = event.summary;
    payment.status = PaymentStatus.SUCCESS;
    payment.refundRequired = !(await this.tryConfirm(manager, payment, event));
    await manager.save(payment);
    return {
      actorId: null,
      action: 'PAYMENT_SUCCEEDED',
      entityType: 'payment',
      entityId: payment.id,
      metadata: { refundRequired: payment.refundRequired },
    };
  }

  /** Returns false when money was captured but the booking cannot be confirmed. */
  private async tryConfirm(
    manager: EntityManager,
    payment: Payment,
    event: VerifiedWebhookEvent,
  ): Promise<boolean> {
    if (event.amount !== payment.amount) {
      this.logger.error(`Amount mismatch on payment ${payment.id}`);
      return false;
    }
    try {
      await this.bookings.confirmFromPayment(manager, payment.bookingId);
      return true;
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        this.logger.warn(`Booking ${payment.bookingId} not confirmable; refund required`);
        return false;
      }
      throw error;
    }
  }
}