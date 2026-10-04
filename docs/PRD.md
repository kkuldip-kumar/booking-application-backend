# PRD — BookMyShow Backend

## Goal
Backend API for browsing movies and booking seats for shows, with payment and e-tickets.

## Roles
- **Guest**: browse cities, movies, shows, seat map.
- **User**: register/login, hold seats, book, pay, view/cancel bookings, get ticket.
- **Admin**: manage cities, movies, theatres, screens, shows, pricing; view bookings and reports.

## MVP Features
1. Auth: register, login, refresh, logout, profile.
2. Catalog: cities, movies (search/filter by city, language, genre), theatres, screens.
3. Shows: list by movie + city + date; seat map with live availability and price.
4. Seat hold: select 1–6 seats, held for 10 minutes.
5. Booking: create booking from held seats; status lifecycle.
6. Payment: create payment intent, webhook confirmation, failure/expiry handling.
7. Ticket: booking reference + QR payload after payment; email confirmation.
8. Cancellation: user cancels before show cutoff (2h); refund record created.
9. Admin CRUD for catalog and shows.

## Booking Flow
1. User views seat map → 2. holds seats (10 min) → 3. creates booking (PENDING) → 4. pays → 5. webhook → booking CONFIRMED + ticket → 6. email.
Timeout or failure → seats released, booking EXPIRED/FAILED.

## Business Rules
- A seat can be booked by only one user per show.
- Max 6 seats per booking.
- Price is server-computed (base price × seat category multiplier).
- No booking for shows that started or within 15 minutes of start.
- Cancellation allowed until 2 hours before show.

## Non-Functional
- Correctness under concurrency (no double booking).
- p95 < 300ms for read endpoints.
- Low infra cost: single Postgres + single Redis, one app container.

## Out of Scope (MVP)
Food & beverages, loyalty/coupons, dynamic pricing, multi-currency, reviews, recommendations, mobile push, microservices.

## Success Criteria
- 0 double bookings in concurrency tests.
- Full booking flow works end-to-end in e2e tests.
