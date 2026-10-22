import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, In, Not } from 'typeorm';
import {
  BookingSeatStatus,
  BookingStatus,
  RefundStatus,
  ShowtimeSeatStatus,
} from '../../../common/enums/booking.enums';
import {
  PaymentFailureEvent,
  PaymentResultHandler,
  PaymentSuccessEvent,
} from '../../../common/contracts/payment.contract';
import { isSeatHoldableBy, isShowtimeOpen } from '../booking.rules';
import { ShowtimeSnapshot } from '../booking.types';
import { BookingSeat } from '../entities/booking-seat.entity';
import { Booking } from '../entities/booking.entity';
import { BookingLocker } from '../repositories/booking-locker';
import { SeatInventoryRepository } from '../repositories/seat-inventory.repository';
import { BookingRefundService } from './booking-refund.service';

/**
 * Applies gateway outcomes to bookings. Handlers are idempotent: duplicate webhooks are
 * serialised by the booking row lock and become no-ops once the booking is settled.
 */
@Injectable()
export class BookingPaymentService implements PaymentResultHandler {
  private readonly logger = new Logger(BookingPaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly inventory: SeatInventoryRepository,
    private readonly locker: BookingLocker,
    private readonly refunds: BookingRefundService,
  ) {}

  async onPaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    const refundDue = await this.dataSource.transaction((manager) =>
      this.applySuccess(manager, event),
    );
    if (refundDue) await this.refunds.processRefund(event.bookingId);
  }

  async onPaymentFailure(event: PaymentFailureEvent): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const locked = await this.locker.lockBooking(manager, event.bookingId);
      if (!locked || locked.booking.status !== BookingStatus.PENDING) return;
      this.logger.warn(`Payment failed for booking ${event.bookingId}: ${event.reason}`);
      await this.inventory.releaseBookingSeats(
        manager,
        [event.bookingId],
        ShowtimeSeatStatus.AVAILABLE,
      );
      await manager.update(Booking, event.bookingId, { status: BookingStatus.FAILED });
    });
  }

  /** Returns true when the customer has paid but must be refunded. */
  private async applySuccess(manager: EntityManager, event: PaymentSuccessEvent): Promise<boolean> {
    const locked = await this.locker.lockBooking(manager, event.bookingId);
    if (!locked) {
      this.logger.warn(`Payment received for unknown booking ${event.bookingId}`);
      return false;
    }
    const { booking, showtime } = locked;
    if (booking.status === BookingStatus.CONFIRMED || booking.refundStatus !== RefundStatus.NONE) {
      return false;
    }
    const confirmed = await this.tryConfirm(manager, booking, showtime, event);
    if (confirmed) return false;
    await this.markRefundDue(manager, booking, event);
    return true;
  }

  private async tryConfirm(
    manager: EntityManager,
    booking: Booking,
    showtime: ShowtimeSnapshot,
    event: PaymentSuccessEvent,
  ): Promise<boolean> {
    const revivable = [BookingStatus.PENDING, BookingStatus.EXPIRED].includes(booking.status);
    const valid = revivable && isShowtimeOpen(showtime) && event.amountPaid === booking.totalAmount;
    if (!valid || !(await this.claimSeats(manager, booking))) return false;
    await manager.update(Booking, booking.id, {
      status: BookingStatus.CONFIRMED,
      providerPaymentId: event.providerPaymentId,
      paidAmount: event.amountPaid,
    });
    return true;
  }

  /** Late payments may re-acquire seats only if nobody else has claimed them meanwhile. */
  private async claimSeats(manager: EntityManager, booking: Booking): Promise<boolean> {
    const rows = await manager.find(BookingSeat, { where: { bookingId: booking.id } });
    const seatIds = rows.map((row) => row.showtimeSeatId);
    const seats = await this.inventory.lockSeatsBlocking(manager, booking.showtimeId, seatIds);
    const rivals = await manager.count(BookingSeat, {
      where: {
        showtimeSeatId: In(seatIds),
        status: BookingSeatStatus.ACTIVE,
        bookingId: Not(booking.id),
      },
    });
    const free =
      seats.length === seatIds.length &&
      rivals === 0 &&
      seats.every((seat) => isSeatHoldableBy(seat, booking.userId));
    if (!free) return false;
    await this.inventory.markBooked(manager, seatIds);
    await this.inventory.activateBookingSeats(manager, booking.id);
    return true;
  }

  private async markRefundDue(
    manager: EntityManager,
    booking: Booking,
    event: PaymentSuccessEvent,
  ): Promise<void> {
    const wasPending = booking.status === BookingStatus.PENDING;
    if (wasPending) {
      await this.inventory.releaseBookingSeats(manager, [booking.id], ShowtimeSeatStatus.AVAILABLE);
    }
    await manager.update(Booking, booking.id, {
      status: wasPending ? BookingStatus.FAILED : booking.status,
      providerPaymentId: event.providerPaymentId,
      paidAmount: event.amountPaid,
      refundStatus: RefundStatus.PENDING,
    });
  }
}
