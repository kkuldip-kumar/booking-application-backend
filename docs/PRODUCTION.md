# Production

## Low-Cost Deployment
- 1 VPS (2 vCPU/4GB) or a PaaS (Railway/Render/Fly) running: app container + managed Postgres + small Redis (or Upstash).
- Start with a single instance; scale vertically, then horizontally (stateless app; holds are in Postgres).
- Reverse proxy (Caddy/Nginx) for TLS.

## Docker
Multi-stage build, Node 20 alpine, non-root user, `NODE_ENV=production`, healthcheck on `/health`.

## Environment Variables
```
NODE_ENV, PORT
DATABASE_URL (or DB_HOST/PORT/USER/PASSWORD/NAME), DB_SSL
REDIS_URL
JWT_ACCESS_SECRET, JWT_ACCESS_TTL=15m
JWT_REFRESH_SECRET, JWT_REFRESH_TTL=7d
CORS_ORIGINS
PAYMENT_GATEWAY_KEY, PAYMENT_GATEWAY_SECRET, PAYMENT_WEBHOOK_SECRET
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
SEAT_HOLD_MINUTES=10
```
Validate at boot; fail fast.

## Release Steps
1. CI: lint, build, tests.
2. Build image, push.
3. Run `migration:run` (one-off job) BEFORE starting new version.
4. Deploy; check `/health`; smoke test booking flow.
5. Rollback: previous image; `migration:revert` only if migration is reversible and needed.

## Database
- Daily automated backups + PITR if available; test restore monthly.
- Connection pool max ~10 per instance; set `statement_timeout`/`idle_in_transaction_session_timeout`.
- Run `ANALYZE`; review slow queries (`pg_stat_statements`).

## Monitoring
- `/health` (DB + Redis), structured JSON logs, request ids.
- Error tracking: Sentry (free tier).
- Metrics/alerts: 5xx rate, p95 latency, DB connections, queue backlog, expired-hold job lag, payment webhook failures.

## Scaling Notes
- Cache catalog reads in Redis; never seat state.
- Read replica for catalog if needed.
- Partition/archive old `show_seats` and bookings after shows end.
- Queue worker can be split into its own process later.

## Runbook
- Stuck HELD seats: run expiry job manually / check BullMQ.
- Payment success but booking PENDING: replay webhook by `gateway_payment_id`.
