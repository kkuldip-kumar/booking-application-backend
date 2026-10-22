import { ConflictException } from '@nestjs/common';
import { Harness, createHarness, resetData } from './support/harness';
import {
  bookingRow,
  createUsers,
  forceHoldExpiry,
  holdAndBook,
  paySuccess,
  seatRows,
  seedShow,
} from './support/fixtures';

jest.setTimeout(60_000);

describe('Booking scenarios (real Postgres)', () => {
  let h: Harness;

  beforeAll(async () => {
    h = await createHarness();
  });
  beforeEach(async () => {
    await resetData(h.ds);
    h.fake.orders.length = 0;
    h.fake.refunds.length = 0;
    h.fake.failRefunds = false;
  });
  afterAll(async () => {
    await h.ds.destroy();
  });

  describe('1. two users selecting the same seat simultaneously', () => {
    it('lets exactly one of 20 racers hold the seat; the rest get 409', async () => {
      const users = await createUsers(h.ds, 20);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1);

      const results = await Promise.allSettled(
        users.map((u) => h.holds.holdSeats(u, showtimeId, [seatIds[0]])),
      );

      const winners = results.filter((r) => r.status === 'fulfilled');
      const losers = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      expect(winners).toHaveLength(1);
      expect(losers.every((r) => r.reason instanceof ConflictException)).toBe(true);
      const [seat] = await seatRows(h.ds, seatIds);
      expect(seat.status).toBe('HELD');
      expect(users).toContain(seat.held_by);
    });

    it('is all-or-nothing for overlapping seat sets (no partial holds)', async () => {
      const [a, b] = await createUsers(h.ds, 2);
      const { showtimeId, seatIds } = await seedShow(h.ds, 3);

      const results = await Promise.allSettled([
        h.holds.holdSeats(a, showtimeId, [seatIds[0], seatIds[1]]),
        h.holds.holdSeats(b, showtimeId, [seatIds[1], seatIds[2]]),
      ]);

      const successes = results.filter((r) => r.status === 'fulfilled').length;
      expect(successes).toBe(1);
      const held = (await seatRows(h.ds, seatIds)).filter((s) => s.status === 'HELD');
      expect(held).toHaveLength(2);
    });
  });

  describe('2. payment success webhook delivered more than once', () => {
    it('confirms once and treats every duplicate as a no-op', async () => {
      const [user] = await createUsers(h.ds, 1);
      const { showtimeId, seatIds } = await seedShow(h.ds, 2);
      const booking = await holdAndBook(h, user, showtimeId, seatIds);

      await Promise.all(Array.from({ length: 5 }, () => paySuccess(h, booking, 'pay_dup')));
      await paySuccess(h, booking, 'pay_dup');

      expect(await bookingRow(h.ds, booking.id)).toMatchObject({
        status: 'CONFIRMED',
        refund_status: 'NONE',
        paid_amount: booking.totalAmount,
      });
      expect((await seatRows(h.ds, seatIds)).every((s) => s.status === 'BOOKED')).toBe(true);
      expect(h.fake.refunds).toHaveLength(0);
      const active = await h.ds.query(
        `SELECT COUNT(*)::int AS c FROM booking_seats WHERE booking_id = $1 AND status = 'ACTIVE'`,
        [booking.id],
      );
      expect(active[0].c).toBe(2);
    });
  });

  describe('3. payment success after seat-hold expiration', () => {
    it('confirms when the hold lapsed but nobody else took the seats (job not yet run)', async () => {
      const [user] = await createUsers(h.ds, 1);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1);
      const booking = await holdAndBook(h, user, showtimeId, seatIds);
      await forceHoldExpiry(h.ds, showtimeId);

      await paySuccess(h, booking);

      expect((await bookingRow(h.ds, booking.id)).status).toBe('CONFIRMED');
      expect(h.fake.refunds).toHaveLength(0);
    });

    it('re-claims seats after the expiry job released them if still free', async () => {
      const [user] = await createUsers(h.ds, 1);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1);
      const booking = await holdAndBook(h, user, showtimeId, seatIds);
      await forceHoldExpiry(h.ds, showtimeId);

      const expired = await h.expiry.expireStale();
      expect(expired.expiredBookings).toBe(1);
      expect((await bookingRow(h.ds, booking.id)).status).toBe('EXPIRED');
      expect((await seatRows(h.ds, seatIds))[0].status).toBe('AVAILABLE');

      await paySuccess(h, booking);

      expect((await bookingRow(h.ds, booking.id)).status).toBe('CONFIRMED');
      expect((await seatRows(h.ds, seatIds))[0].status).toBe('BOOKED');
      expect(h.fake.refunds).toHaveLength(0);
    });

    it('refunds when another user has since booked the seat', async () => {
      const [late, other] = await createUsers(h.ds, 2);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1);
      const lateBooking = await holdAndBook(h, late, showtimeId, seatIds);
      await forceHoldExpiry(h.ds, showtimeId);
      await h.expiry.expireStale();

      const otherBooking = await holdAndBook(h, other, showtimeId, seatIds);
      await paySuccess(h, otherBooking);
      await paySuccess(h, lateBooking);

      expect(await bookingRow(h.ds, lateBooking.id)).toMatchObject({
        status: 'EXPIRED',
        refund_status: 'PROCESSED',
      });
      expect(h.fake.refunds).toEqual([
        expect.objectContaining({
          bookingId: lateBooking.id,
          amount: lateBooking.totalAmount,
          idempotencyKey: `refund:${lateBooking.id}`,
        }),
      ]);
      expect((await bookingRow(h.ds, otherBooking.id)).status).toBe('CONFIRMED');
      const [seat] = await seatRows(h.ds, seatIds);
      expect(seat).toMatchObject({ status: 'BOOKED' });
    });

    it('refunds when the paid amount does not match the booking total', async () => {
      const [user] = await createUsers(h.ds, 1);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1);
      const booking = await holdAndBook(h, user, showtimeId, seatIds);

      await h.payment.onPaymentSuccess({
        bookingId: booking.id,
        providerPaymentId: 'pay_short',
        amountPaid: booking.totalAmount - 1,
      });

      expect(await bookingRow(h.ds, booking.id)).toMatchObject({
        status: 'FAILED',
        refund_status: 'PROCESSED',
      });
      expect((await seatRows(h.ds, seatIds))[0].status).toBe('AVAILABLE');
    });
  });

  describe('4. showtime cancellation after bookings exist', () => {
    it('cancels all bookings, refunds the paid ones, blocks seats and rejects new holds', async () => {
      const [u1, u2, u3, u4] = await createUsers(h.ds, 4);
      const { showtimeId, seatIds } = await seedShow(h.ds, 4);
      const paid1 = await holdAndBook(h, u1, showtimeId, [seatIds[0]]);
      const paid2 = await holdAndBook(h, u2, showtimeId, [seatIds[1]]);
      const pending = await holdAndBook(h, u3, showtimeId, [seatIds[2]]);
      await paySuccess(h, paid1);
      await paySuccess(h, paid2);

      await h.ds.query(`UPDATE showtimes SET status = 'CANCELLED' WHERE id = $1`, [showtimeId]);
      const result = await h.cancellation.handleShowtimeCancelled(showtimeId);

      expect(result).toEqual({ cancelledBookings: 3, refundsQueued: 2 });
      expect(await bookingRow(h.ds, paid1.id)).toMatchObject({
        status: 'CANCELLED',
        refund_status: 'PROCESSED',
      });
      expect(await bookingRow(h.ds, paid2.id)).toMatchObject({ status: 'CANCELLED' });
      expect(await bookingRow(h.ds, pending.id)).toMatchObject({
        status: 'CANCELLED',
        refund_status: 'NONE',
      });
      expect(h.fake.refunds.map((r) => r.bookingId).sort()).toEqual([paid1.id, paid2.id].sort());
      expect((await seatRows(h.ds, seatIds)).every((s) => s.status === 'BLOCKED')).toBe(true);
      await expect(h.holds.holdSeats(u4, showtimeId, [seatIds[3]])).rejects.toBeInstanceOf(
        ConflictException,
      );

      await paySuccess(h, pending);
      expect(h.fake.refunds).toHaveLength(3);
    });
  });

  describe('5. refund processing', () => {
    it('cancel before cutoff frees seats and issues exactly one refund', async () => {
      const [user] = await createUsers(h.ds, 1);
      const { showtimeId, seatIds } = await seedShow(h.ds, 2, 600);
      const booking = await holdAndBook(h, user, showtimeId, seatIds);
      await paySuccess(h, booking);

      const cancelled = await h.cancellation.cancelByUser(user, booking.id);

      expect(cancelled).toMatchObject({ status: 'CANCELLED', refundStatus: 'PROCESSED' });
      expect((await seatRows(h.ds, seatIds)).every((s) => s.status === 'AVAILABLE')).toBe(true);
      expect(h.fake.refunds).toEqual([
        expect.objectContaining({ amount: booking.totalAmount, idempotencyKey: `refund:${booking.id}` }),
      ]);
      await expect(h.cancellation.cancelByUser(user, booking.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(h.fake.refunds).toHaveLength(1);
    });

    it('rejects cancellation inside the 2h cutoff and keeps the booking confirmed', async () => {
      const [user] = await createUsers(h.ds, 1);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1, 90);
      const booking = await holdAndBook(h, user, showtimeId, seatIds);
      await paySuccess(h, booking);

      await expect(h.cancellation.cancelByUser(user, booking.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect((await bookingRow(h.ds, booking.id)).status).toBe('CONFIRMED');
      expect(h.fake.refunds).toHaveLength(0);
    });

    it("hides other users' bookings (404) on cancel", async () => {
      const [owner, intruder] = await createUsers(h.ds, 2);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1);
      const booking = await holdAndBook(h, owner, showtimeId, seatIds);
      await expect(h.cancellation.cancelByUser(intruder, booking.id)).rejects.toMatchObject({
        status: 404,
      });
    });

    it('keeps the refund PENDING when the gateway fails and settles it on retry', async () => {
      const [user] = await createUsers(h.ds, 1);
      const { showtimeId, seatIds } = await seedShow(h.ds, 1);
      const booking = await holdAndBook(h, user, showtimeId, seatIds);
      await paySuccess(h, booking);

      h.fake.failRefunds = true;
      const cancelled = await h.cancellation.cancelByUser(user, booking.id);
      expect(cancelled).toMatchObject({ status: 'CANCELLED', refundStatus: 'PENDING' });

      h.fake.failRefunds = false;
      expect(await h.refunds.retryPendingRefunds()).toBe(1);
      expect((await bookingRow(h.ds, booking.id)).refund_status).toBe('PROCESSED');
      expect(h.fake.refunds).toHaveLength(1);
    });
  });

  describe('6. concurrent booking requests under load', () => {
    it('never double-books: 60 users fight over 12 seats through hold -> book -> pay', async () => {
      const users = await createUsers(h.ds, 60);
      const { showtimeId, seatIds } = await seedShow(h.ds, 12);
      let state = 42;
      const next = (): number => (state = (state * 1103515245 + 12345) % 2147483648);

      const outcomes = await Promise.allSettled(
        users.map(async (userId) => {
          const start = next() % seatIds.length;
          const size = 1 + (next() % 3);
          const picks = Array.from({ length: size }, (_, i) => seatIds[(start + i) % seatIds.length]);
          const booking = await holdAndBook(h, userId, showtimeId, picks);
          await paySuccess(h, booking);
          return booking;
        }),
      );

      const rejected = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected');
      expect(rejected.every((o) => o.reason instanceof ConflictException)).toBe(true);
      const confirmed = outcomes.filter((o) => o.status === 'fulfilled');
      expect(confirmed.length).toBeGreaterThan(0);

      const dupes = await h.ds.query(
        `SELECT showtime_seat_id FROM booking_seats WHERE status = 'ACTIVE'
         GROUP BY showtime_seat_id HAVING COUNT(*) > 1`,
      );
      expect(dupes).toHaveLength(0);

      const mismatch = await h.ds.query(
        `SELECT ss.id FROM showtime_seats ss
         WHERE (ss.status = 'BOOKED') <> EXISTS (
           SELECT 1 FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id
           WHERE bs.showtime_seat_id = ss.id AND bs.status = 'ACTIVE' AND b.status = 'CONFIRMED')`,
      );
      expect(mismatch).toHaveLength(0);

      const bookedSeats = (await seatRows(h.ds, seatIds)).filter((s) => s.status === 'BOOKED');
      const soldLines = await h.ds.query(
        `SELECT COUNT(*)::int AS c FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id
         WHERE b.status = 'CONFIRMED' AND bs.status = 'ACTIVE'`,
      );
      expect(soldLines[0].c).toBe(bookedSeats.length);
      expect(bookedSeats.length).toBeLessThanOrEqual(seatIds.length);
      expect(h.fake.refunds).toHaveLength(0);
    });
  });
});
