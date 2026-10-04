# Database (PostgreSQL + TypeORM)

All tables: `id uuid PK`, `created_at`, `updated_at` (`timestamptz`). Money in paise (`integer`).

## ERD
```
cities 1─* theatres 1─* screens 1─* seats
movies 1─* shows *─1 screens
shows 1─* show_seats *─1 seats
users 1─* bookings *─1 shows
bookings 1─* booking_seats *─1 show_seats
bookings 1─* payments
bookings 1─1 tickets
users 1─* refresh_tokens
```

## Tables
**users**: email (unique), password_hash, name, phone, role (`USER|ADMIN`), is_active
**refresh_tokens**: user_id FK, token_hash, expires_at, revoked_at
**cities**: name (unique), state
**movies**: title, description, duration_min, language, genre[], certificate, release_date, poster_url, is_active
**theatres**: city_id FK, name, address
**screens**: theatre_id FK, name, total_seats
**seats**: screen_id FK, row_label, seat_number, category (`REGULAR|PREMIUM|RECLINER`); unique `(screen_id,row_label,seat_number)`
**shows**: movie_id FK, screen_id FK, start_time, end_time, base_price, status (`SCHEDULED|CANCELLED`)
**show_seats**: show_id FK, seat_id FK, price, status (`AVAILABLE|HELD|BOOKED`), held_by FK users null, held_until null; unique `(show_id,seat_id)`
**bookings**: reference (unique), user_id FK, show_id FK, status (`PENDING|CONFIRMED|CANCELLED|EXPIRED|FAILED`), total_amount, expires_at, cancelled_at
**booking_seats**: booking_id FK, show_seat_id FK (unique while booking active), price
**payments**: booking_id FK, gateway, gateway_order_id, gateway_payment_id (unique null), idempotency_key (unique), amount, status (`CREATED|SUCCESS|FAILED|REFUNDED`), raw_payload jsonb
**tickets**: booking_id FK unique, qr_payload, issued_at

## Indexes
- `shows (movie_id, start_time)`, `shows (screen_id, start_time)`
- `show_seats (show_id, status)`; partial `(held_until) WHERE status='HELD'`
- `bookings (user_id, created_at DESC)`, `bookings (status, expires_at)`
- `movies (is_active, release_date)`; trigram/GIN on title for search (optional)
- `theatres (city_id)`

## Constraints
- CHECK `end_time > start_time`; CHECK `total_amount >= 0`.
- Partial unique: one active `booking_seats` row per `show_seat_id`.
- No overlapping shows per screen (enforce in service; optional exclusion constraint with `tstzrange`).
- FKs `ON DELETE RESTRICT` by default.

## Migration Notes
Use TypeORM migrations only. One migration per logical change. Seed via `scripts/seed.ts` (idempotent).
