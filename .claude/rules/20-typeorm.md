---
paths:
  - "src/**/entities/**/*.ts"
  - "src/**/repositories/**/*.ts"
  - "src/database/**"
---
# TypeORM
- `synchronize: false` always; schema changes via migrations only.
- Never edit an applied migration; add a new one with a working `down()`.
- Entities: `@Entity('snake_case_plural')`, UUID PK, `created_at`/`updated_at` `timestamptz`, explicit column types, explicit `@Index`/unique.
- Enums: Postgres enum or `varchar` + CHECK; TS enum in `common/enums`.
- No lazy relations; load via `relations`/QueryBuilder; avoid N+1; select only needed columns in lists.
- Money as integer minor units.
- Multi-table writes in `DataSource.transaction()`/`QueryRunner`; pass the `EntityManager` down, never mix repositories outside the tx.
- Seat hold: `FOR UPDATE SKIP LOCKED` (or `pessimistic_write`) in one transaction; see `docs/adr/0001-seat-locking-strategy.md`.
- Enforce invariants in DB (unique, FK, CHECK), not only in app code.
- Payments/webhooks idempotent via unique `idempotency_key`/`gateway_payment_id`.
- Raw SQL parameterized (`$1`) only.
