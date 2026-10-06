# CinemaHub — Offers & Promotions module

Drop `src/` into the repo (merge; it also touches `cinemas.service.ts` [+`assertAllExist`], `showtimes.module.ts` [+`ShowtimeOrderLookupService`], `common/utils/timezone.util.ts` [+`localDayAndMinutes`, `clockToMinutes`]).

```ts
// app.module.ts
OffersModule
// data-source migrations: 1760000100000-OffersPromotions.ts (after 1760000000000-CinemaOperations.ts)
```
Needs `@nestjs/throttler` (already in your stack) with `ThrottlerModule` registered globally. `Role.SUPER_ADMIN | CINEMA_ADMIN | USER`, `JwtUser.cinemaIds` as in the cinema-ops notes.

## Feature → where
| Feature | Implementation |
|---|---|
| Percentage / fixed / BOGO | `offers.discount_type`; `discount_value` = basis points (PERCENTAGE, BOGO) or paise (FIXED). BOGO = `bogo_buy_qty`/`bogo_get_qty`; cheapest tickets are the free ones; `discount_value` = % off those free tickets (10000 = free) |
| Max discount / min order | `max_discount_amount`, `min_order_amount` (paise) |
| Cinema / movie specific | `offer_cinemas`, `offer_movies` (no rows = applies everywhere) |
| Bank / payment-method / credit-card | `offer_payment_rules`: method + bank_code + card_network + card_bins (BIN prefixes only). Rules OR-ed, fields in a rule AND-ed |
| Validity dates | `starts_at`, `ends_at`, `status` (DRAFT→ACTIVE⇄PAUSED→ARCHIVED) |
| Days / time windows | `eligible_days` (0=Sun), `eligible_start_time/end_time` (wrap past midnight supported), judged on the **showtime start in the cinema's timezone** |
| Coupon + usage limits | `coupons` (offer-level `total_usage_limit`/`per_customer_limit` + coupon-level `max_uses`/`per_customer_limit`) |
| Combinability | `combine_mode` EXCLUSIVE/STACKABLE, `stack_group` (one stackable offer per group, e.g. BANK), `priority` (application order) |
| Applied discount history | `offer_redemptions.discount_amount` snapshot per booking+offer |

## Combination rule
Coupons the customer typed are always honoured (incompatible ones → 409). Auto offers: all STACKABLE ones combine (≤1 per stack group, applied sequentially by priority on the remaining amount); with no coupon, the best single EXCLUSIVE offer competes with that stack and the larger discount wins. Percent discounts round down.

## Booking / payment integration (for the bookings + payments modules)
```ts
// bookings: inside the booking transaction, after seats are held
await offerRedemption.redeem(manager, { order, couponCodes, bookingId });   // returns QuoteResult; store discountTotal on the booking
// payments webhook, with GATEWAY-verified method/bank/network/BIN:
await offerRedemption.assertPaymentMatches(manager, bookingId, payment);     // 422 => don't confirm; refund/fail
await offerRedemption.confirm(manager, bookingId);
// expiry job / failure / cancellation:
await offerRedemption.release(manager, bookingId);
```
`order.ticketPrices` must come from `showtime_seats.price` (see `ShowtimeOrderLookupService`), never from the client.

## Routes (`/api/v1`)
Public: `GET /offers`, `GET /offers/:id` · User: `POST /offers/quote` (15/min throttle)
Admin (SUPER_ADMIN, CINEMA_ADMIN): `POST/GET /admin/offers`, `GET/PATCH /admin/offers/:id`, `POST /admin/offers/:id/(activate|pause|archive)`, `GET /admin/offers/:id/redemptions`, `POST/GET /admin/offers/:id/coupons`, `PATCH /admin/coupons/:couponId/status`
Cinema admins: only offers whose cinemas are all theirs; global offers are SUPER_ADMIN-only; everything else 404.

## Add to docs
TASKS: `Bookings: call redeem/confirm/release` · `Payments: verify method/bank/BIN from gateway then assertPaymentMatches` · `Bookings migration: FK offer_redemptions.booking_id -> bookings(id)` · `Replace OfferAuditService with the platform audit log`
THREAT_MODEL: T21 coupon guessing (throttle + identical error for unknown/disabled) · T22 client-claimed card/bank to get a bank offer (gateway re-verification) · T23 coupon over-redemption race (row locks + recount in tx) · T24 cinema admin touching global/other offers (404) · T25 changing discount terms after sales (locked).
`test/security/`: IDOR on offers/coupons for CINEMA_ADMIN; parallel-redeem test; forged-payment test.
