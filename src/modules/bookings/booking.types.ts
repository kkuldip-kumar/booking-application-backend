import { ShowtimeSeatStatus, ShowtimeStatus } from '../../common/enums/booking.enums';

export type ShowtimeLockMode = 'SHARE' | 'UPDATE';

export interface ShowtimeSnapshot {
  readonly id: string;
  readonly status: ShowtimeStatus;
  readonly minutesUntilStart: number;
}

export interface LockedSeat {
  readonly id: string;
  readonly status: ShowtimeSeatStatus;
  readonly heldBy: string | null;
  readonly heldUntil: Date | null;
  readonly holdExpired: boolean;
  readonly price: number;
  readonly label: string;
}

export interface HoldSeatsInput {
  readonly seatIds: string[];
  readonly userId: string;
  readonly holdMinutes: number;
}

export interface HoldResult {
  readonly heldUntil: Date;
  readonly showtimeSeatIds: string[];
}

export interface ExpiryResult {
  readonly expiredBookings: number;
  readonly releasedHolds: number;
}

export interface ShowtimeCancellationResult {
  readonly cancelledBookings: number;
  readonly refundsQueued: number;
}

export interface PaginatedResult<T> {
  readonly items: T[];
  readonly meta: { page: number; limit: number; total: number };
}
