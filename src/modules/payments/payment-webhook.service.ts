// src/modules/payments/payment-webhook.service.ts
import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { IncomingHttpHeaders } from 'http';
import { DataSource, EntityManager } from 'typeorm';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BookingsService } from '../bookings/bookings.service';
import { Payment } from './entities/payment.entity';
import { PaymentGateway, VerifiedWebhookEvent } from './gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY } from './payments.constants';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly bookings: BookingsService,
    private readonly audit: AuditLogsService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async handle(rawBody: Buffer, headers: IncomingHttpHeaders): Promise<void> {
    const event = this.gateway.parseWebhook(rawBody, headers);
    if (event.type === 'IGNORED') return;

    await this.dataSource.transaction(async (manager) => {
      const payment = await manager
        .getRepository(Payment)
        .createQueryBuilder('p')
        .setLock('pessimistic_write')
        .where('p.gatewayOrderId = :orderId', { orderId: event.gatewayOrderId })
        .getOne();

      if (!payment) {
        this.logger.warn(`Webhook for unknown order ${event.gatewayOrderId}`);
        return;
      }
      if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.REFUNDED) {
        return; // duplicate delivery: no-op
      }
      if (event.type === 'PAYMENT_FAILED') {
        await this.markFailed(manager, payment, event);
        return;
      }
      await this.markSucceeded(manager, payment, event);
    });
  }

  private async markFailed(
    manager: EntityManager,
    payment: Payment,
    event: VerifiedWebhookEvent,
  ): Promise<void> {
    // Booking stays PENDING: the user may retry within the hold window;
    // the expiry job releases the seats otherwise.
    payment.status = PaymentStatus.FAILED;
    payment.rawPayload = event.summary;
    await manager.save(payment);
    await this.audit.record(
      { actorId: null, action: 'PAYMENT_FAILED', entityType: 'payment', entityId: payment.id },
      manager,
    );
  }

  private async markSucceeded(
    manager: EntityManager,
    payment: Payment,
    event: VerifiedWebhookEvent,
  ): Promise<void> {
    payment.gatewayPaymentId = event.gatewayPaymentId;
    payment.rawPayload = event.summary;
    payment.status = PaymentStatus.SUCCESS;
    payment.refundRequired = !(await this.tryConfirm(manager, payment, event));
    await manager.save(payment);
    await this.audit.record(
      {
        actorId: null,
        action: 'PAYMENT_SUCCEEDED',
        entityType: 'payment',
        entityId: payment.id,
        metadata: { refundRequired: payment.refundRequired },
      },
      manager,
    );
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