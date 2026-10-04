# Tasks
Rule: one task per chat. Check off only after lint + build + tests pass.

## Phase 0 — Setup
- [ ] Init NestJS project, TS strict, ESLint/Prettier
- [ ] docker-compose (postgres, redis), `.env.example`
- [ ] Config module + env validation
- [ ] TypeORM data source + migration scripts
- [ ] Global pipes, filters, response interceptor, Swagger, Helmet, throttler
- [ ] `/health` endpoint

## Phase 1 — Auth & Users
- [ ] User entity + migration
- [ ] Register/login (argon2)
- [ ] JWT guard, `@Public`, `@Roles`, `@CurrentUser`
- [ ] Refresh token rotation + logout
- [ ] `GET/PATCH /users/me`
- [ ] Tests

## Phase 2 — Catalog
- [ ] Cities
- [ ] Movies (+ filters)
- [ ] Theatres, screens, seats
- [ ] Admin CRUD for the above
- [ ] Seed script
- [ ] Tests

## Phase 3 — Shows
- [ ] Show entity, overlap validation
- [ ] Generate `show_seats` on show creation
- [ ] List/filter shows, seat map endpoint
- [ ] Tests

## Phase 4 — Seat Hold & Booking
- [ ] Hold/release seats (FOR UPDATE SKIP LOCKED)
- [ ] Hold expiry job (BullMQ)
- [ ] Create booking (PENDING), server-side pricing
- [ ] Booking list/detail/cancel
- [ ] Concurrency tests

## Phase 5 — Payments & Tickets
- [ ] Payment intent
- [ ] Webhook (signature, idempotency)
- [ ] Confirm booking + issue ticket + QR payload
- [ ] Failure/expiry handling, refund record
- [ ] Email notification via BullMQ
- [ ] Tests

## Phase 6 — Hardening & Release
- [ ] Rate limit tuning
- [ ] Security checklist (docs/SECURITY.md)
- [ ] Dockerfile + CI pipeline
- [ ] Load test booking endpoint
- [ ] Production checklist (docs/PRODUCTION.md)
