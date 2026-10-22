# Booking module wiring

1. app.module: import `BookingsModule`; ensure `BullModule.forRoot` (bullmq >= 5.16 for `upsertJobScheduler`).
2. PaymentsModule must: provide + export `PaymentResultRegistry` (from common/contracts/payment.contract.ts)
   and `{ provide: PAYMENT_PORT, useExisting: PaymentsService }`; it must NOT import BookingsModule.
3. PaymentsService implements `PaymentPort` (createOrder / refund, idempotent per key).
4. Webhook handler (after signature verify + dedupe on provider event id):
   `await registry.publishSuccess({ bookingId, providerPaymentId, amountPaid })` or `publishFailure(...)`.
   Let errors propagate (5xx) so the gateway retries; handlers are idempotent.
5. ShowtimesService.cancel(): after setting status CANCELLED and committing, call
   `BookingCancellationService.handleShowtimeCancelled(showtimeId)` (exported by BookingsModule).
6. Run migration `1791158400000-CreateBookings` (needs users, showtimes, seats, showtime_seats tables;
   showtime_seats columns: id, showtime_id, seat_id, price, status, held_by, held_until, updated_at).
7. Adjust import paths for Role / CurrentUser / Roles / JwtUser to your common/ files.
8. Tests: `TEST_DATABASE_URL=postgres://.../bookmyshow_test npm run test:e2e -- booking-scenarios`
   (use a dedicated DB; the suite TRUNCATEs users/showtimes/seats/showtime_seats/bookings).
