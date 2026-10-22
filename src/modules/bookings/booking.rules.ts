import { randomBytes } from 'crypto';
import { ConflictException } from '@nestjs/common';
import { BOOKING_LIMITS } from '../../common/constants/booking.constants';
import { ShowtimeSeatStatus, ShowtimeStatus } from '../../common/enums/booking.enums';
import { LockedSeat, ShowtimeSnapshot } from './booking.types';

export function assertShowtimeBookable(showtime: ShowtimeSnapshot): void {
  if (showtime.status !== ShowtimeStatus.SCHEDULED) {
    throw new ConflictException('Showtime is not open for booking');
  }
  if (!isShowtimeOpen(showtime)) {
    throw new ConflictException('Booking is closed for this showtime');
  }
}

export function isShowtimeOpen(showtime: ShowtimeSnapshot): boolean {
  return (
    showtime.status === ShowtimeStatus.SCHEDULED &&
    showtime.minutesUntilStart > BOOKING_LIMITS.BOOKING_CLOSE_BEFORE_START_MINUTES
  );
}

export function canCancelAt(minutesUntilStart: number): boolean {
  return minutesUntilStart >= BOOKING_LIMITS.CANCEL_CUTOFF_MINUTES;
}

/** A seat can be (re)claimed if free, or held by the same user, or its hold lapsed. */
export function isSeatHoldableBy(seat: LockedSeat, userId: string): boolean {
  if (seat.status === ShowtimeSeatStatus.AVAILABLE) return true;
  if (seat.status !== ShowtimeSeatStatus.HELD) return false;
  return seat.holdExpired || seat.heldBy === userId;
}

export function isSeatHeldBy(seat: LockedSeat, userId: string): boolean {
  return seat.status === ShowtimeSeatStatus.HELD && seat.heldBy === userId && !seat.holdExpired;
}

export function sumPrices(seats: readonly LockedSeat[]): number {
  return seats.reduce((total, seat) => total + seat.price, 0);
}

export function earliestHoldEnd(seats: readonly LockedSeat[]): Date {
  const times = seats.flatMap((seat) => (seat.heldUntil ? [seat.heldUntil.getTime()] : []));
  return new Date(Math.min(...times));
}

export function generateBookingReference(): string {
  return `CH${randomBytes(6).toString('hex').toUpperCase()}`;
}
