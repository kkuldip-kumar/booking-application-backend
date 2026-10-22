import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { BOOKING_LIMITS } from '../../../common/constants/booking.constants';
import {
  BookingSeatStatus,
  ShowtimeSeatStatus,
  ShowtimeStatus,
} from '../../../common/enums/booking.enums';
import {
  HoldSeatsInput,
  LockedSeat,
  ShowtimeLockMode,
  ShowtimeSnapshot,
} from '../booking.types';

interface ShowtimeRow {
  id: string;
  status: ShowtimeStatus;
  minutes_until_start: number;
}

interface SeatRow {
  id: string;
  status: ShowtimeSeatStatus;
  held_by: string | null;
  held_until: Date | null;
  hold_expired: boolean;
  price: number;
  label: string;
}

const SHOWTIME_SQL = `SELECT id, status,
  (EXTRACT(EPOCH FROM (start_at - now())) / 60)::float8 AS minutes_until_start
  FROM showtimes WHERE id = $1`;

const SEATS_SQL = `SELECT ss.id, ss.status, ss.held_by, ss.held_until, ss.price,
  (ss.held_until IS NOT NULL AND ss.held_until < now()) AS hold_expired,
  CONCAT(s.row_label, s.seat_number) AS label
  FROM showtime_seats ss JOIN seats s ON s.id = ss.seat_id
  WHERE ss.showtime_id = $1 AND ss.id = ANY($2::uuid[])
  ORDER BY ss.id`;

/**
 * Raw, parameterised SQL over showtime_seats / booking_seats. Every method takes the
 * transaction EntityManager so row locks always apply.
 * Lock order everywhere: showtime -> booking -> seats.
 */
@Injectable()
export class SeatInventoryRepository {
  async lockShowtime(
    manager: EntityManager,
    showtimeId: string,
    mode: ShowtimeLockMode,
  ): Promise<ShowtimeSnapshot> {
    const lock = mode === 'UPDATE' ? ' FOR UPDATE' : ' FOR SHARE';
    const rows: ShowtimeRow[] = await manager.query(SHOWTIME_SQL + lock, [showtimeId]);
    const row = rows[0];
    if (!row) throw new NotFoundException('Showtime not found');
    return { id: row.id, status: row.status, minutesUntilStart: Number(row.minutes_until_start) };
  }

  /** Non-blocking: rows locked by another tx are skipped, so callers must compare counts. */
  lockSeats(manager: EntityManager, showtimeId: string, seatIds: string[]): Promise<LockedSeat[]> {
    return this.querySeats(manager, SEATS_SQL + ' FOR UPDATE OF ss SKIP LOCKED', showtimeId, seatIds);
  }

  /** Blocking: used when a verdict (e.g. refund vs confirm) must not depend on lock contention. */
  lockSeatsBlocking(
    manager: EntityManager,
    showtimeId: string,
    seatIds: string[],
  ): Promise<LockedSeat[]> {
    return this.querySeats(manager, SEATS_SQL + ' FOR UPDATE OF ss', showtimeId, seatIds);
  }

  async countOtherHeldShowtimes(
    manager: EntityManager,
    userId: string,
    showtimeId: string,
  ): Promise<number> {
    const rows: { count: number }[] = await manager.query(
      `SELECT COUNT(DISTINCT showtime_id)::int AS count FROM showtime_seats
       WHERE held_by = $1 AND status = $2 AND held_until > now() AND showtime_id <> $3`,
      [userId, ShowtimeSeatStatus.HELD, showtimeId],
    );
    return rows[0]?.count ?? 0;
  }

  async markHeld(manager: EntityManager, input: HoldSeatsInput): Promise<Date> {
    const rows: { held_until: Date }[] = await manager.query(
      `WITH u AS (
         UPDATE showtime_seats SET status = $2, held_by = $3,
           held_until = now() + make_interval(mins => $4::int), updated_at = now()
         WHERE id = ANY($1::uuid[]) RETURNING held_until)
       SELECT MIN(held_until) AS held_until FROM u`,
      [input.seatIds, ShowtimeSeatStatus.HELD, input.userId, input.holdMinutes],
    );
    return rows[0].held_until;
  }

  async markBooked(manager: EntityManager, seatIds: string[]): Promise<void> {
    await manager.query(
      `UPDATE showtime_seats SET status = $2, held_by = NULL, held_until = NULL, updated_at = now()
       WHERE id = ANY($1::uuid[])`,
      [seatIds, ShowtimeSeatStatus.BOOKED],
    );
  }

  /** Releases only holds that do not back an active booking (explicit user release). */
  async releaseUserHolds(manager: EntityManager, showtimeId: string, userId: string): Promise<void> {
    await manager.query(
      `UPDATE showtime_seats ss SET status = $3, held_by = NULL, held_until = NULL, updated_at = now()
       WHERE ss.showtime_id = $1 AND ss.held_by = $2 AND ss.status = $4
         AND NOT EXISTS (SELECT 1 FROM booking_seats bs
                         WHERE bs.showtime_seat_id = ss.id AND bs.status = $5)`,
      [
        showtimeId,
        userId,
        ShowtimeSeatStatus.AVAILABLE,
        ShowtimeSeatStatus.HELD,
        BookingSeatStatus.ACTIVE,
      ],
    );
  }

  /**
   * Frees (or blocks) the seats of the given bookings and marks their booking_seats RELEASED.
   * A seat still HELD is touched only if held by the booking's owner, so a lapsed booking can
   * never release a hold that another user has since taken.
   */
  async releaseBookingSeats(
    manager: EntityManager,
    bookingIds: string[],
    target: ShowtimeSeatStatus.AVAILABLE | ShowtimeSeatStatus.BLOCKED,
  ): Promise<void> {
    await manager.query(
      `UPDATE showtime_seats ss SET status = $2, held_by = NULL, held_until = NULL, updated_at = now()
       FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id
       WHERE bs.showtime_seat_id = ss.id AND bs.booking_id = ANY($1::uuid[]) AND bs.status = $3
         AND (ss.status = $4 OR (ss.status = $5 AND ss.held_by = b.user_id))`,
      [bookingIds, target, BookingSeatStatus.ACTIVE, ShowtimeSeatStatus.BOOKED, ShowtimeSeatStatus.HELD],
    );
    await manager.query(
      `UPDATE booking_seats SET status = $2, updated_at = now()
       WHERE booking_id = ANY($1::uuid[]) AND status = $3`,
      [bookingIds, BookingSeatStatus.RELEASED, BookingSeatStatus.ACTIVE],
    );
  }

  async activateBookingSeats(manager: EntityManager, bookingId: string): Promise<void> {
    await manager.query(
      `UPDATE booking_seats SET status = $2, updated_at = now() WHERE booking_id = $1`,
      [bookingId, BookingSeatStatus.ACTIVE],
    );
  }

  async blockShowtimeSeats(manager: EntityManager, showtimeId: string): Promise<void> {
    await manager.query(
      `UPDATE showtime_seats SET status = $2, held_by = NULL, held_until = NULL, updated_at = now()
       WHERE showtime_id = $1 AND status <> $2`,
      [showtimeId, ShowtimeSeatStatus.BLOCKED],
    );
  }

  async releaseExpiredHolds(manager: EntityManager): Promise<number> {
    const rows: { count: number }[] = await manager.query(
      `WITH u AS (
         UPDATE showtime_seats SET status = $1, held_by = NULL, held_until = NULL, updated_at = now()
         WHERE id IN (
           SELECT ss.id FROM showtime_seats ss
           WHERE ss.status = $2 AND ss.held_until < now()
             AND NOT EXISTS (SELECT 1 FROM booking_seats bs
                             WHERE bs.showtime_seat_id = ss.id AND bs.status = $3)
           ORDER BY ss.id LIMIT $4 FOR UPDATE SKIP LOCKED)
         RETURNING 1)
       SELECT COUNT(*)::int AS count FROM u`,
      [
        ShowtimeSeatStatus.AVAILABLE,
        ShowtimeSeatStatus.HELD,
        BookingSeatStatus.ACTIVE,
        BOOKING_LIMITS.EXPIRED_HOLD_BATCH,
      ],
    );
    return rows[0]?.count ?? 0;
  }

  private async querySeats(
    manager: EntityManager,
    sql: string,
    showtimeId: string,
    seatIds: string[],
  ): Promise<LockedSeat[]> {
    const rows: SeatRow[] = await manager.query(sql, [showtimeId, seatIds]);
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      heldBy: row.held_by,
      heldUntil: row.held_until,
      holdExpired: row.hold_expired,
      price: row.price,
      label: row.label,
    }));
  }
  async getCinemaId(manager: EntityManager, showtimeId: string): Promise<string> {
  const rows: { cinema_id: string }[] = await manager.query(
    `SELECT sc.cinema_id FROM showtimes st JOIN screens sc ON sc.id = st.screen_id WHERE st.id = $1`,
    [showtimeId],
  );
  if (!rows[0]) throw new NotFoundException('Showtime not found');
  return rows[0].cinema_id;
}
}
