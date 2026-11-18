---
paths:
  - "src/modules/auth/**"
---
# VAPT Gate (OWASP API Top 10:2023 / ASVS L2)

## Never
- Add endpoints without guards or ownership checks (`where: { id, userId }`).
- Fetch user-owned data by id alone (IDOR/BOLA).
- `repo.save(body)`; map DTO fields explicitly. Role/status/price/userId never come from the client.
- Build SQL by string; use `eval`, dynamic `require`, or `child_process` with user input.
- Use `Math.random()` for tokens; use `crypto.randomUUID()`/`randomBytes()`.
- Compare secrets/hashes with `===`; use `crypto.timingSafeEqual`.
- Log passwords, tokens, PII; return stack traces, SQL errors, or entity internals.
- Use wildcard CORS, `synchronize: true`, or Swagger in production.
- Add dependencies without asking.

## Always
- `@Public()` only for register, login, refresh, catalog GETs, signature-verified payment webhook.
- Generic auth errors with the same shape/timing for unknown user and wrong password.
- Webhook: raw body, HMAC via `timingSafeEqual`, timestamp ±5 min, idempotent on `gateway_payment_id`.
- Compute price, total, seat status server-side.
- Throttle auth, hold, booking, payment, webhook.
- Cap `limit` at 100; reject unknown query params.
- Use response DTOs (no `password_hash`, tokens, internals).
- Audit-log admin actions and payment state changes (who, what, when, requestId).

## Before "done", print yes/no for
1. Each new route: guard, role, ownership scoped?
2. Client-controlled field affecting money/role/status/ownership?
3. New input reaching SQL/shell/URL/file path?
4. Sensitive data in logs/responses?
5. Abuse case in `docs/THREAT_MODEL.md`; test in `test/security/`?
6. Ran `npm run lint && npm run build && npm run test && npm audit --omit=dev` (paste output)?
