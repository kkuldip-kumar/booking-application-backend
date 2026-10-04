# API (base `/api/v1`)

Response envelope: `{ "success": true, "data": ..., "message": "" }`
Errors: `{ "success": false, "statusCode": 409, "message": "...", "error": "Conflict" }`
Auth: `Authorization: Bearer <accessToken>`. Paginated: `?page&limit` → `{ items, meta:{page,limit,total} }`.

## Auth
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /auth/register | public | email, password, name |
| POST | /auth/login | public | returns access + refresh |
| POST | /auth/refresh | public | rotates refresh token |
| POST | /auth/logout | user | revokes refresh token |
| GET | /users/me | user | profile |
| PATCH | /users/me | user | update profile |

## Catalog (public)
| Method | Path | Notes |
|---|---|---|
| GET | /cities | |
| GET | /movies | filters: cityId, language, genre, q |
| GET | /movies/:id | |
| GET | /theatres | filter: cityId |
| GET | /theatres/:id | includes screens |
| GET | /shows | filters: movieId, cityId, date |
| GET | /shows/:id | |
| GET | /shows/:id/seats | seat map + status + price |

## Booking
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /shows/:id/seats/hold | user | `{ seatIds: [] }` (≤6) → holdUntil |
| DELETE | /shows/:id/seats/hold | user | release own holds |
| POST | /bookings | user | `{ showId, seatIds }` → PENDING booking |
| GET | /bookings | user | own bookings |
| GET | /bookings/:id | user | own only |
| POST | /bookings/:id/cancel | user | before cutoff |
| GET | /bookings/:id/ticket | user | QR payload |

## Payments
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /payments/intent | user | `{ bookingId }` → gateway order |
| POST | /payments/webhook | signature | idempotent |
| GET | /payments/:bookingId | user | status |

## Admin (role ADMIN)
| Method | Path |
|---|---|
| POST/PATCH/DELETE | /admin/cities, /admin/movies, /admin/theatres, /admin/screens |
| POST/PATCH/DELETE | /admin/shows |
| GET | /admin/bookings, /admin/reports/revenue |

## Example
```json
POST /shows/{id}/seats/hold
{ "seatIds": ["uuid1","uuid2"] }
→ 200 { "success": true, "data": { "heldUntil": "2026-01-01T10:10:00Z", "seatIds": ["uuid1","uuid2"] } }
→ 409 when any seat is unavailable
```

## Status Codes
400 validation · 401 unauthenticated · 403 forbidden · 404 not found · 409 seat conflict/state conflict · 429 rate limit.
