// src/modules/payments/payments.constants.ts
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
export const PAYMENT_MODE_STRATEGIES = Symbol('PAYMENT_MODE_STRATEGIES');

export const CURRENCY_INR = 'INR';
export const GATEWAY_TIMEOUT_MS = 10_000;
export const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

export const VPA_PATTERN = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/;
export const BANK_CODE_PATTERN = /^[A-Za-z]{4}$/;
export const SUPPORTED_WALLETS: readonly string[] = [
  'PAYTM', 'PHONEPE', 'AMAZONPAY', 'FREECHARGE', 'MOBIKWIK',
];
export const EMI_TENURES_MONTHS: readonly number[] = [3, 6, 9, 12, 18, 24];