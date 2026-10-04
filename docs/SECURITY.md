# Security

## Authentication
- Argon2 password hashing. Email + password; lockout/throttle on repeated failures.
- JWT access (15m) + refresh (7d). Refresh tokens stored hashed, rotated on use, reuse detection revokes the family.

## Authorization (RBAC)
- Roles: `USER`, `ADMIN`. Global `JwtAuthGuard`; `@Public()` opt-out; `@Roles()` for admin routes.
- Ownership checks in services: bookings/tickets/payments scoped by `user_id`.

## Input & Output
- DTO validation with whitelist + forbidNonWhitelisted. `ParseUUIDPipe` on ids.
- Response DTOs only; never leak `password_hash`, tokens, internal ids not meant public.

## Rate Limiting
`@nestjs/throttler`: default 100/min/IP; `/auth/*` 5–10/min; hold/booking/payment 20/min/user.

## HTTP Hardening
Helmet, CORS allowlist from env, body size limit (100kb), disable `x-powered-by`, HTTPS at proxy.

## Payment Safety
- Amount computed server-side from `show_seats.price`.
- Webhook: verify HMAC signature, check timestamp, idempotency via `gateway_payment_id`/`idempotency_key`.
- Confirm only when gateway amount == booking total.
- Never store card data. Store minimal raw payload; redact secrets.

## Booking Abuse
Max 6 seats/hold, max 3 active holds per user, hold TTL 10 min, cleanup job.

## Secrets & Config
Env only; validated at boot; `.env` git-ignored; rotate JWT/webhook secrets; different secrets per environment.

## Logging & Privacy
No passwords/tokens/PII in logs. Request id on each log line. Audit log for admin actions.

## Dependencies
`npm audit` in CI; Dependabot/Renovate; pin Node LTS; run container as non-root.

## Checklist (before release)
- [ ] All routes guarded or explicitly public
- [ ] Ownership checks tested
- [ ] Webhook replay test
- [ ] Rate limits verified
- [ ] No secrets in repo/logs
