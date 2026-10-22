import { DataSource } from 'typeorm';
import { BookingResponseDto } from '../../../src/modules/bookings/dto/booking-response.dto';
import { Harness } from './harness';

export interface SeededShow {
  showtimeId: string;
  seatIds: string[];
}

export async function createUsers(ds: DataSource, count: number): Promise<string[]> {
  const rows: { id: string }[] = await ds.query(
    `INSERT INTO users (id) SELECT gen_random_uuid() FROM generate_series(1, $1::int) RETURNING id`,
    [count],
  );
  return rows.map((row) => row.id);
}

export async function seedShow(
  ds: DataSource,
  seatCount: number,
  startsInMinutes = 600,
  price = 25000,
): Promise<SeededShow> {
  const shows: { id: string }[] = await ds.query(
    `INSERT INTO showtimes (start_at) VALUES (now() + make_interval(mins => $1::int)) RETURNING id`,
    [startsInMinutes],
  );
  const showtimeId = shows[0].id;
  const seats: { id: string }[] = await ds.query(
    `WITH s AS (
       INSERT INTO seats (row_label, seat_number)
       SELECT 'A', g FROM generate_series(1, $1::int) g RETURNING id, seat_number)
     INSERT INTO showtime_seats (showtime_id, seat_id, price)
     SELECT $2, id, $3::int FROM s ORDER BY seat_number RETURNING id`,
    [seatCount, showtimeId, price],
  );
  return { showtimeId, seatIds: seats.map((seat) => seat.id) };
}

export async function holdAndBook(
  h: Harness,
  userId: string,
  showtimeId: string,
  seatIds: string[],
): Promise<BookingResponseDto> {
  await h.holds.holdSeats(userId, showtimeId, seatIds);
  const { booking } = await h.bookings.create(userId, { showtimeId, showtimeSeatIds: seatIds });
  return booking;
}

export function paySuccess(h: Harness, booking: BookingResponseDto, paymentId = `pay_${booking.id}`) {
  return h.payment.onPaymentSuccess({
    bookingId: booking.id,
    providerPaymentId: paymentId,
    amountPaid: booking.totalAmount,
  });
}

/** Simulates the 10-minute TTL elapsing for a user's holds and pending bookings. */
export async function forceHoldExpiry(ds: DataSource, showtimeId: string): Promise<void> {
  await ds.query(
    `UPDATE showtime_seats SET held_until = now() - interval '1 minute'
     WHERE showtime_id = $1 AND status = 'HELD'`,
    [showtimeId],
  );
  await ds.query(
    `UPDATE bookings SET expires_at = now() - interval '1 minute'
     WHERE showtime_id = $1 AND status = 'PENDING'`,
    [showtimeId],
  );
}

export async function seatRows(
  ds: DataSource,
  ids: string[],
): Promise<{ id: string; status: string; held_by: string | null }[]> {
  return ds.query(
    `SELECT id, status, held_by FROM showtime_seats WHERE id = ANY($1::uuid[]) ORDER BY id`,
    [ids],
  );
}

export async function bookingRow(
  ds: DataSource,
  id: string,
): Promise<{ status: string; refund_status: string; paid_amount: number | null }> {
  const rows = await ds.query(
    `SELECT status, refund_status, paid_amount FROM bookings WHERE id = $1`,
    [id],
  );
  return rows[0];
}
