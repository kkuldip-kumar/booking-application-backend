# Testing Strategy

## Pyramid
- **Unit** (Jest): services with mocked repos. Fast, most tests.
- **E2E** (Supertest + real Postgres via docker): full flows.
- **Concurrency**: parallel requests on same seats.

## Setup
- `docker-compose.test.yml` or separate `bookmyshow_test` DB.
- Run migrations before suite; truncate tables (`TRUNCATE ... CASCADE`) between tests.
- Fixtures in `test/fixtures/` (users, movie, theatre, screen, seats, show).
- Mock: payment gateway, email/BullMQ.

## Must-Have Cases
- Auth: register, duplicate email, login wrong password, refresh rotation, reuse detection.
- RBAC: user cannot hit admin routes; user cannot read others' bookings.
- Seat map: correct status after hold/book.
- Hold: success, >6 seats, already held/booked (409), TTL expiry releases.
- Booking: amount computed server-side, cannot book unheld seats, show-started rejection.
- Payment: webhook success → CONFIRMED + ticket; duplicate webhook is no-op; bad signature 401; failure → seats released.
- Cancel: before cutoff OK, after cutoff rejected, seats freed, refund record created.
- Expiry job: releases expired holds, expires pending bookings.

## Concurrency Tests
```ts
const results = await Promise.allSettled(
  Array.from({ length: 20 }, () => holdSeat(token(i), showId, [seatId]))
);
expect(results.filter(r => r.status === 'fulfilled' && r.value.status === 200)).toHaveLength(1);
```
Also: two users booking overlapping seat sets → no partial holds (all-or-nothing).

## Targets
Services ≥ 80% lines; booking/payments/seats ≥ 90%; 0 flaky tests.

## Commands
`npm run test` · `npm run test:cov` · `npm run test:e2e`

## Definition of Done
Lint + build + unit + e2e green; output pasted in PR/chat.
