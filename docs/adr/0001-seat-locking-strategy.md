# ADR-0001: Seat Locking Strategy

- Status: Accepted
- Date: 2026-09-30

## Context
Must prevent double booking under concurrent requests, with a temporary hold while the user pays. Budget is low; minimize infrastructure.

## Options
1. **Redis locks (SETNX + TTL)** — fast, but second source of truth; risk of Redis/DB divergence, extra failure mode.
2. **Optimistic locking (version column)** — retries under contention; poor UX on popular shows.
3. **Postgres pessimistic locking with hold columns** — `SELECT ... FOR UPDATE SKIP LOCKED` on `show_seats`, status `HELD` + `held_until`.

## Decision
Option 3. `show_seats` rows carry `status`, `held_by`, `held_until`. Hold and booking confirmation run inside DB transactions. A BullMQ repeatable job releases expired holds every minute; queries also treat `HELD` with `held_until < now()` as available.

## Consequences
- (+) Single source of truth, ACID, no extra infra.
- (+) DB constraints (`unique(show_id, seat_id)`) are the last line of defense.
- (−) Higher DB load on very hot shows; mitigate with short transactions and indexes.
- (−) Expiry relies on the job + lazy check.
- Revisit Redis-based holds only if DB contention is proven by load tests.
