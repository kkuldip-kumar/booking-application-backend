import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BOOKING_LIMITS } from '../../../common/constants/booking.constants';
import { RefundStatus } from '../../../common/enums/booking.enums';
import { PAYMENT_PORT, PaymentPort } from '../../../common/contracts/payment.contract';
import { Booking } from '../entities/booking.entity';

@Injectable()
export class BookingRefundService {
  private readonly logger = new Logger(BookingRefundService.name);

  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
    @Inject(PAYMENT_PORT) private readonly payments: PaymentPort,
  ) {}

  /** Never throws: a failed refund stays PENDING and is retried by the expiry job. */
  async processRefund(bookingId: string): Promise<void> {
    const booking = await this.bookings.findOne({
      where: { id: bookingId, refundStatus: RefundStatus.PENDING },
    });
    if (!booking || booking.paidAmount === null) return;
    try {
      await this.payments.refund({
        bookingId,
        amount: booking.paidAmount,
        reason: `booking_${booking.status.toLowerCase()}`,
        idempotencyKey: `refund:${bookingId}`,
      });
    } catch (error) {
      this.logger.error(
        `Refund failed for booking ${bookingId}`,
        error instanceof Error ? error.stack : undefined,
      );
      return;
    }
    await this.bookings.update(
      { id: bookingId, refundStatus: RefundStatus.PENDING },
      { refundStatus: RefundStatus.PROCESSED },
    );
  }

  async retryPendingRefunds(): Promise<number> {
    const due = await this.bookings.find({
      where: { refundStatus: RefundStatus.PENDING },
      select: { id: true },
      order: { updatedAt: 'ASC' },
      take: BOOKING_LIMITS.REFUND_RETRY_BATCH,
    });
    for (const booking of due) {
      await this.processRefund(booking.id);
    }
    return due.length;
  }
}
