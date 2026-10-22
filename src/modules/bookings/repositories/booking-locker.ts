import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { ShowtimeSnapshot } from '../booking.types';
import { SeatInventoryRepository } from './seat-inventory.repository';

export interface LockedBooking {
  readonly booking: Booking;
  readonly showtime: ShowtimeSnapshot;
}

/** Enforces the global lock order showtime -> booking, preventing webhook/cancel deadlocks. */
@Injectable()
export class BookingLocker {
  constructor(private readonly inventory: SeatInventoryRepository) {}

  async lockBooking(
    manager: EntityManager,
    bookingId: string,
    userId?: string,
  ): Promise<LockedBooking | null> {
    const where = userId ? { id: bookingId, userId } : { id: bookingId };
    const head = await manager.findOne(Booking, { where, select: { id: true, showtimeId: true } });
    if (!head) return null;
    const showtime = await this.inventory.lockShowtime(manager, head.showtimeId, 'SHARE');
    const booking = await manager.findOne(Booking, { where, lock: { mode: 'pessimistic_write' } });
    return booking ? { booking, showtime } : null;
  }
}
