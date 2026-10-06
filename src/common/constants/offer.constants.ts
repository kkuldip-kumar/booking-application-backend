export const BPS_DENOMINATOR = 10_000;
export const MAX_SEATS_PER_ORDER = 6;
export const MAX_COUPONS_PER_ORDER = 3;
export const MAX_COUPONS_PER_BULK = 500;
export const COUPON_CODE_REGEX = /^[A-Z0-9-]{4,32}$/;
export const COUPON_PREFIX_REGEX = /^[A-Z0-9]{0,12}$/;
export const COUPON_RANDOM_LENGTH = 10;
// No 0/O/1/I so codes survive being read aloud or typed from a screenshot.
export const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const COUPON_GENERATION_ATTEMPTS = 3;
export const DEFAULT_OFFER_PRIORITY = 100;
export const MAX_BOGO_QTY = 5;
export const MAX_OFFER_TARGETS = 200;
export const MAX_PAYMENT_RULES = 20;
export const QUOTE_THROTTLE_LIMIT = 15;
export const QUOTE_THROTTLE_TTL_MS = 60_000;
