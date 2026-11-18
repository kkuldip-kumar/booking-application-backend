---
paths:
  - "src/modules/auth/**"
---
# Security
- Hash passwords with `argon2` (or bcrypt cost ≥ 12); never log/return hashes.
- JWT access 15m, refresh 7d; refresh tokens stored hashed, rotated, revoked on logout.
- Global `JwtAuthGuard` default-deny; public routes use `@Public()`.
- RBAC via `@Roles()` (`USER`, `ADMIN`); enforce ownership on user data.
- Validate all input with DTOs; `ParseUUIDPipe` on id params.
- Secrets only via env; validate env at boot.
- Throttle `/auth/*`, booking and payment endpoints.
- Helmet + CORS allowlist; no stack traces in responses.
- Webhooks: verify signature, reject replays, idempotent; compute amounts server-side.
- Never log PII, tokens, card data, or full request bodies.
