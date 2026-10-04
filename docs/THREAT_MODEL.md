# Threat Model (STRIDE, abuse-focused)

Assets: user accounts, seat inventory integrity, payments, tickets/QR, PII.
Trust boundaries: Internet→API, API→DB/Redis, Gateway→Webhook.

| # | Threat | Type | Mitigation | Test |
|---|---|---|---|---|
| T1 | Read/cancel another user's booking/ticket | Info disclosure / EoP | Ownership scoping, 404 not 403 | IDOR test |
| T2 | Credential stuffing / brute force | Spoofing | Throttle, argon2, generic errors, lockout | rate-limit test |
| T3 | Refresh token theft/replay | Spoofing | Rotation + reuse detection revokes family | reuse test |
| T4 | Client sets price/role/status | Tampering | Server-side compute, whitelist DTO | mass-assign test |
| T5 | Forged payment webhook | Spoofing/Tampering | HMAC + timestamp + amount check | forged sig test |
| T6 | Replayed webhook (double confirm) | Tampering | Idempotency on gateway_payment_id | replay test |
| T7 | Double booking via race | Tampering | `FOR UPDATE SKIP LOCKED` + unique(show_id,seat_id) | 20-parallel test |
| T8 | Seat hoarding (hold and never pay) | DoS / business abuse | ≤6 seats, ≤3 active holds, 10m TTL, throttle | hold-abuse test |
| T9 | Enumeration of bookings/users | Info disclosure | UUIDs, generic errors, throttle | scan |
| T10 | QR ticket forgery/reuse | Spoofing | Signed QR payload (HMAC), single-use at entry | QR tamper test |
| T11 | Privilege escalation to admin | EoP | Default-deny, `@Roles`, no role in JWT from client | RBAC test |
| T12 | Resource exhaustion (big body, huge limit) | DoS | Body 100kb, limit ≤100, timeouts | fuzz |
| T13 | Injection (SQL/NoSQL/header) | Tampering | DTO validation, parameterized queries | semgrep + ZAP |
| T14 | Secret leakage (repo/logs) | Info disclosure | gitleaks, log redaction, env only | CI |
| T15 | Vulnerable dependency | Supply chain | audit, Trivy, lockfile, approval for new deps | CI |
| T16 | Insider/admin misuse | Repudiation | Audit log for admin + payment changes | log check |

Update this table whenever a new endpoint or flow is added.