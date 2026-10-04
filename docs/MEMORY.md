# Memory — Decisions, Gotchas, Lessons
Append newest at top. Format: `YYYY-MM-DD — <topic>: <decision/gotcha> — <why>`.

## Decisions
- Seat state lives in Postgres (`show_seats`), not Redis — single source of truth, simpler, cheaper. See ADR-0001.
- Money stored as integer paise — avoids float errors.
- Modular monolith, no microservices — low cost, faster to build.
- `synchronize: false`; migrations only.
- Hold TTL = 10 minutes; max 6 seats per booking.

## Gotchas
- (add) Always pass the transaction `EntityManager` into nested service calls, or locks won't apply.
- (add) `SKIP LOCKED` returns fewer rows; compare count to requested seats, else 409.
- (add) Webhooks can arrive twice or before the client returns; make handler idempotent.

## Don't Do Again
- (add mistakes here so the AI doesn't repeat them)

## Open Questions
- Payment gateway choice (Razorpay/Stripe)?
- Refund policy specifics?
