import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import {
  BookingStatus,
  RefundStatus,
  ShowtimeSeatStatus,
} from '../../../common/enums/booking.enums';
import { toBookingResponse } from '../booking.mapper';
import { canCancelAt } from '../booking.rules';
import { ShowtimeCancellationResult } from '../booking.types';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { Booking } from '../entities/booking.entity';
import { BookingLocker } from '../repositories/booking-locker';
import { SeatInventoryRepository } from '../repositories/seat-inventory.repository';
import { BookingRefundService } from './booking-refund.service';

interface ShowtimeCancelOutcome {
  readonly cancelled: number;
  readonly refundIds: string[];
}

@Injectable()
export class BookingCancellationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventory: SeatInventoryRepository,
    private readonly locker: BookingLocker,
    private readonly refunds: BookingRefundService,
  ) {}

  async cancelByUser(userId: string, bookingId: string): Promise<BookingResponseDto> {
    await this.dataSource.transaction((manager) => this.cancelInTransaction(manager, userId, bookingId));
    await this.refunds.processRefund(bookingId);
    const booking = await this.dataSource.getRepository(Booking).findOneOrFail({
      where: { id: bookingId, userId },
      relations: { seats: true },
    });
    return toBookingResponse(booking);
  }

  /** Call after the showtime row has been set to CANCELLED. Refunds every confirmed booking. */
  async handleShowtimeCancelled(showtimeId: string): Promise<ShowtimeCancellationResult> {
    const outcome = await this.dataSource.transaction((manager) =>
      this.cancelShowtimeInTransaction(manager, showtimeId),
    );
    for (const bookingId of outcome.refundIds) {
      await this.refunds.processRefund(bookingId);
    }
    return { cancelledBookings: outcome.cancelled, refundsQueued: outcome.refundIds.length };
  }

  private async cancelInTransaction(
    manager: EntityManager,
    userId: string,
    bookingId: string,
  ): Promise<void> {
    const locked = await this.locker.lockBooking(manager, bookingId, userId);
    if (!locked) throw new NotFoundException('Booking not found');
    const { booking, showtime } = locked;

    const cancellable = [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status);
    if (!cancellable) throw new ConflictException('Booking cannot be cancelled');
    if (booking.status === BookingStatus.CONFIRMED && !canCancelAt(showtime.minutesUntilStart)) {
      throw new ConflictException('Cancellation window has closed');
    }
    await this.cancelBooking(manager, booking, ShowtimeSeatStatus.AVAILABLE);
  }

  private async cancelShowtimeInTransaction(
    manager: EntityManager,
    showtimeId: string,
  ): Promise<ShowtimeCancelOutcome> {
    await this.inventory.lockShowtime(manager, showtimeId, 'UPDATE');
    const active = await manager.find(Booking, {
      where: { showtimeId, status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]) },
      lock: { mode: 'pessimistic_write' },
    });
    const refundIds = active.filter((b) => b.status === BookingStatus.CONFIRMED).map((b) => b.id);
    for (const booking of active) {
      await this.cancelBooking(manager, booking, ShowtimeSeatStatus.BLOCKED);
    }
    await this.inventory.blockShowtimeSeats(manager, showtimeId);
    return { cancelled: active.length, refundIds };
  }

  private async cancelBooking(
    manager: EntityManager,
    booking: Booking,
    seatTarget: ShowtimeSeatStatus.AVAILABLE | ShowtimeSeatStatus.BLOCKED,
  ): Promise<void> {
    const wasConfirmed = booking.status === BookingStatus.CONFIRMED;
    await this.inventory.releaseBookingSeats(manager, [booking.id], seatTarget);
    await manager.update(Booking, booking.id, {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
      refundStatus: wasConfirmed ? RefundStatus.PENDING : RefundStatus.NONE,
    });
  }
}
