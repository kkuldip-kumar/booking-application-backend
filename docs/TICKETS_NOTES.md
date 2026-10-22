# Tickets module — wiring, docs updates, offline notes

## Wiring (other modules)
- Payments webhook, inside the confirm transaction:
  `await this.ticketsService.issueForBooking(manager, { bookingId, bookingReference, userId, cinemaId, showtimeId, seats })`
  (idempotent: a replayed webhook returns the existing tickets).
- Booking cancel: `ticketsService.markCancelled(manager, bookingId)`; refund success: `markRefunded(manager, bookingId)`.
- Env: `TICKET_QR_SECRET` (>= 32 chars, per environment). Add to `env.validation.ts`, `.env.example`, PRODUCTION.md.
  Rotating it invalidates every issued QR, so rotate only with a re-issue plan.
- Extend the VAPT rule's `@Public()` list: scanner routes use `@DeviceOnly()` (Public + device-key guard).

## API.md additions
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | /bookings/:bookingId/tickets | user | own tickets, one per seat; QR payload only while ISSUED |
| POST | /scanner/scan | device key (`x-device-key`) | `{ token, showtimeId, scanId }` -> VALID/ALREADY_USED/CANCELLED/REFUNDED/WRONG_SESSION/UNKNOWN |
| POST | /admin/tickets/:ticketId/override-check-in | SUPER_ADMIN, CINEMA_ADMIN | `{ reason }`, audited in ticket_scan_logs |
| POST | /admin/scanner-devices | SUPER_ADMIN, CINEMA_ADMIN | returns device key once |
| PATCH | /admin/scanner-devices/:id/deactivate | SUPER_ADMIN, CINEMA_ADMIN | revoke |

## THREAT_MODEL.md rows
| # | Threat | Type | Mitigation | Test |
|---|---|---|---|---|
| T17 | Forged / guessed QR token | Spoofing | HMAC-bound opaque token, hash lookup, 128-bit id | forged token test |
| T18 | Screenshot replay / double entry | Tampering | Atomic conditional UPDATE, ALREADY_USED, scan log | 20-parallel scan test |
| T19 | Stolen or rogue scanner key | Spoofing / EoP | Hashed key, cinema-bound, revocable, rate limited, last_seen audit | revoked-device test |
| T20 | Abuse of manual override | Repudiation / EoP | Role + cinema scope, mandatory reason, scan-log audit, throttle | override authz test |

## MEMORY.md gotchas
- Scan idempotency key is (device_id, scan_id); same scanId with a different token returns 409.
- Check-in correctness relies on `UPDATE ... WHERE status='ISSUED'` affected rows, never on a prior SELECT.
- Other cinemas' tickets are reported UNKNOWN to scanners (no cross-cinema probing).

## Offline strategy (not implemented; only if required)
Gate downloads a per-showtime manifest of qr_token_hash values for its own cinema, accepts only manifest members,
stores scans locally with their scanId, and syncs via a batch endpoint that replays each scan through the same
atomic check-in. Earliest scanned_at wins; later duplicates are logged as ALREADY_USED conflicts. Manifest TTL is
short and tickets cancelled/refunded after download are caught at sync, which is the accepted risk window.
