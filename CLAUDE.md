# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ticket-booking backend (package `cinemahub-backend`): browse movies/showtimes, hold seats, book, pay, get ticket. Scoped rules are in `.claude/rules/`; `AGENTS.md` has the working agreement (one `docs/TASKS.md` item at a time; ask before adding dependencies or altering existing table schemas).

## Stack
NestJS 10 (TypeScript strict, Node 20), PostgreSQL 16 + TypeORM (migrations only, `synchronize: false`), Redis + BullMQ (jobs only, never seat state), JWT auth, class-validator, Swagger, Jest + Supertest.

## Commands
```bash
docker compose up -d                    # postgres + redis
npm run start:dev                       # http://localhost:3000/api/v1, Swagger at /docs
npm run lint && npm run build && npm run test   # must pass before marking done
npx jest path/to/file.spec.ts           # single test file
npx jest -t "test name"                 # single test by name
npm run migration:run                   # also migration:revert
npm run seed                            # also seed:cities
```
- `test:e2e` and `migration:generate` appear in docs but are NOT in `package.json`.
- `npm test` only matches `*.spec.ts`; `test/**/*.e2e-spec.ts` is not run by it.
- Booking e2e needs `TEST_DATABASE_URL` pointing at a dedicated DB (suite TRUNCATEs tables).

## Layout
- `src/modules/<domain>/`: auth, rbac, users, cities, cinemas, screens, seat-layouts, movies, people, showtimes, bookings, payments, tickets, offers, promotions, notifications, audit.
- `src/common/`: decorators, guards, filters, interceptors, enums, contracts, dto, utils.
- `src/config/`: validated env/config. `src/database/`: `data-source.ts`, `migrations/`.
- `test/`: e2e and security specs. `scripts/`: seed scripts.
- Code uses `showtimes`/`cinemas`/`showtime_seats`; older docs say `shows`/`theatres`/`show_seats`. Code wins.
- Bookings and Payments are decoupled via `src/common/contracts/payment.contract.ts`; `PaymentsModule` must not import `BookingsModule` (see `WIRING.md`).

## Git workflow
- Branch off `main` per task; commit small, focused changes.
- Open a PR to `main`; never edit applied migrations or force-push shared branches.
- Run lint, build and tests before committing.

## Docs index
Read only what the task needs.
- `docs/PRD.md`: read when you need requirements, roles, or business rules.
- `docs/ARCHITECTURE.md`: read when changing module boundaries or cross-cutting design.
- `docs/DATABASE.md`: read when touching schema, entities, or migrations.
- `docs/API.md`: read when adding or changing endpoints (update it too).
- `docs/SECURITY.md`: read when working on auth, validation, or secrets.
- `docs/VAPT.md`: read when you need the full secure-coding checklist.
- `docs/THREAT_MODEL.md`: read when assessing abuse cases or adding security tests.
- `docs/TESTING.md`: read when writing or structuring tests.
- `docs/PRODUCTION.md`: read when working on deployment, env vars, or monitoring.
- `docs/TASKS.md`: read when choosing the next task or checking progress.
- `docs/MEMORY.md`: read for past decisions and gotchas; append new ones.
- `docs/OFFERS.md`: read when working on offers or promotions.
- `docs/TICKETS_NOTES.md`: read when working on tickets, QR, or scanning.
- `docs/adr/`: read for architecture decisions (e.g. `0001-seat-locking-strategy.md`).
