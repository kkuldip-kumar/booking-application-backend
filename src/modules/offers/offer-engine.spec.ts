import { ConflictException } from '@nestjs/common';
import { IneligibilityReason as R, OfferCombineMode, OfferDiscountType as D, OfferStatus, PaymentMethod, CardNetwork } from '../../common/enums/offer.enums';
import {
  Candidate, EligibilityInput, NO_USAGE, OfferTerms, OrderContext, applySequence, checkEligibility, computeDiscount, paymentSatisfies, resolveCombination,
} from './offer-engine';

const terms = (over: Partial<OfferTerms> = {}): OfferTerms => ({
  id: 'o1', name: 'Offer', status: OfferStatus.ACTIVE, discountType: D.PERCENTAGE, discountValue: 1000, maxDiscountAmount: null,
  minOrderAmount: 0, bogoBuyQty: null, bogoGetQty: null, startsAt: new Date('2026-01-01T00:00:00Z'), endsAt: new Date('2027-01-01T00:00:00Z'),
  eligibleDays: null, windowStartMin: null, windowEndMin: null, combineMode: OfferCombineMode.EXCLUSIVE, stackGroup: null, priority: 100,
  requiresCoupon: false, cinemaIds: [], movieIds: [], paymentRules: [], totalUsageLimit: null, perCustomerLimit: null, ...over,
});
// Mon 2026-10-05 18:30 IST
const order = (over: Partial<OrderContext> = {}): OrderContext => ({
  customerId: 'u1', cinemaId: 'c1', movieId: 'm1', showStartAt: new Date('2026-10-05T13:00:00Z'), timezone: 'Asia/Kolkata',
  ticketPrices: [20000, 30000], now: new Date('2026-10-01T00:00:00Z'), ...over,
});
const input = (t: Partial<OfferTerms> = {}, o: Partial<OrderContext> = {}): EligibilityInput =>
  ({ terms: terms(t), order: order(o), offerUsage: NO_USAGE, couponUsage: NO_USAGE });
const cand = (t: Partial<OfferTerms>, prices = [20000, 30000]): Candidate => ({ terms: terms(t), standalone: computeDiscount(terms(t), prices, prices.reduce((a, b) => a + b, 0)) });

describe('computeDiscount', () => {
  it('percentage floors and honours max discount', () => {
    expect(computeDiscount(terms({ discountValue: 1500 }), [33333], 33333)).toBe(4999);
    expect(computeDiscount(terms({ discountValue: 5000, maxDiscountAmount: 1000 }), [20000], 20000)).toBe(1000);
  });
  it('fixed never exceeds remaining', () => {
    expect(computeDiscount(terms({ discountType: D.FIXED_AMOUNT, discountValue: 90000 }), [20000], 20000)).toBe(20000);
  });
  it('BOGO frees the cheapest ticket of each pair', () => {
    const t = terms({ discountType: D.BOGO, discountValue: 10000, bogoBuyQty: 1, bogoGetQty: 1 });
    expect(computeDiscount(t, [30000, 20000], 50000)).toBe(20000);
    expect(computeDiscount(t, [30000, 20000, 10000], 60000)).toBe(10000);
    expect(computeDiscount(t, [30000], 30000)).toBe(0);
    expect(computeDiscount({ ...t, discountValue: 5000 }, [30000, 20000], 50000)).toBe(10000);
  });
  it('buy 2 get 1', () => {
    const t = terms({ discountType: D.BOGO, discountValue: 10000, bogoBuyQty: 2, bogoGetQty: 1 });
    expect(computeDiscount(t, [10, 20, 30, 40, 50, 60], 210)).toBe(10 + 20);
  });
});

describe('checkEligibility', () => {
  it.each<[string, Partial<OfferTerms>, Partial<OrderContext>, R | null]>([
    ['ok', {}, {}, null],
    ['not active', { status: OfferStatus.PAUSED }, {}, R.NOT_ACTIVE],
    ['not started', {}, { now: new Date('2025-01-01') }, R.NOT_STARTED],
    ['expired', {}, { now: new Date('2027-06-01') }, R.EXPIRED],
    ['coupon required', { requiresCoupon: true }, {}, R.COUPON_REQUIRED],
    ['other cinema', { cinemaIds: ['c2'] }, {}, R.CINEMA_NOT_ELIGIBLE],
    ['right cinema', { cinemaIds: ['c1'] }, {}, null],
    ['other movie', { movieIds: ['m2'] }, {}, R.MOVIE_NOT_ELIGIBLE],
    ['monday ok', { eligibleDays: [1] }, {}, null],
    ['tuesday only', { eligibleDays: [2] }, {}, R.DAY_NOT_ELIGIBLE],
    ['18:30 in 18:00-22:00', { windowStartMin: 1080, windowEndMin: 1320 }, {}, null],
    ['18:30 not in 10:00-12:00', { windowStartMin: 600, windowEndMin: 720 }, {}, R.TIME_NOT_ELIGIBLE],
    ['wrap window 22:00-02:00 excludes 18:30', { windowStartMin: 1320, windowEndMin: 120 }, {}, R.TIME_NOT_ELIGIBLE],
    ['min order not met', { minOrderAmount: 60000 }, {}, R.MIN_ORDER_NOT_MET],
    ['min order met', { minOrderAmount: 50000 }, {}, null],
  ])('%s', (_n, t, o, expected) => {
    expect(checkEligibility(input(t, o))).toBe(expected);
  });

  it('applies the schedule in the cinema timezone', () => {
    // 13:00Z is Monday 18:30 IST but Monday 09:00 in New York
    expect(checkEligibility(input({ windowStartMin: 1080, windowEndMin: 1320 }, { timezone: 'America/New_York' }))).toBe(R.TIME_NOT_ELIGIBLE);
  });

  it('enforces offer and per-customer usage', () => {
    const base = input({ totalUsageLimit: 10, perCustomerLimit: 1 });
    expect(checkEligibility({ ...base, offerUsage: { total: 10, byCustomer: 0 } })).toBe(R.USAGE_LIMIT_REACHED);
    expect(checkEligibility({ ...base, offerUsage: { total: 3, byCustomer: 1 } })).toBe(R.CUSTOMER_LIMIT_REACHED);
  });

  it('enforces coupon limits', () => {
    const coupon = { id: 'k', code: 'ABCD', maxUses: 2, perCustomerLimit: 1 };
    expect(checkEligibility({ ...input(), coupon, couponUsage: { total: 2, byCustomer: 0 } })).toBe(R.USAGE_LIMIT_REACHED);
    expect(checkEligibility({ ...input(), coupon, couponUsage: { total: 1, byCustomer: 1 } })).toBe(R.CUSTOMER_LIMIT_REACHED);
  });
});

describe('paymentSatisfies (bank / credit card offers)', () => {
  const hdfcCredit = { method: PaymentMethod.CREDIT_CARD, bankCode: 'HDFC', cardNetwork: null, cardBins: [] };
  it('no rules = any payment', () => expect(paymentSatisfies([], undefined)).toBeNull());
  it('rules need a payment', () => expect(paymentSatisfies([hdfcCredit], undefined)).toBe(R.PAYMENT_REQUIRED));
  it('matches bank + method', () => {
    expect(paymentSatisfies([hdfcCredit], { method: PaymentMethod.CREDIT_CARD, bankCode: 'HDFC' })).toBeNull();
    expect(paymentSatisfies([hdfcCredit], { method: PaymentMethod.DEBIT_CARD, bankCode: 'HDFC' })).toBe(R.PAYMENT_NOT_ELIGIBLE);
    expect(paymentSatisfies([hdfcCredit], { method: PaymentMethod.CREDIT_CARD, bankCode: 'ICICI' })).toBe(R.PAYMENT_NOT_ELIGIBLE);
  });
  it('matches card network and BIN prefixes', () => {
    const rule = { method: PaymentMethod.CREDIT_CARD, bankCode: null, cardNetwork: CardNetwork.VISA, cardBins: ['411111', '4012'] };
    expect(paymentSatisfies([rule], { method: PaymentMethod.CREDIT_CARD, cardNetwork: CardNetwork.VISA, cardBin: '41111122' })).toBeNull();
    expect(paymentSatisfies([rule], { method: PaymentMethod.CREDIT_CARD, cardNetwork: CardNetwork.VISA, cardBin: '555555' })).toBe(R.PAYMENT_NOT_ELIGIBLE);
    expect(paymentSatisfies([rule], { method: PaymentMethod.CREDIT_CARD, cardNetwork: CardNetwork.VISA })).toBe(R.PAYMENT_NOT_ELIGIBLE);
  });
  it('rules are OR-ed', () => {
    const upi = { method: PaymentMethod.UPI, bankCode: null, cardNetwork: null, cardBins: [] };
    expect(paymentSatisfies([hdfcCredit, upi], { method: PaymentMethod.UPI })).toBeNull();
  });
});

describe('resolveCombination', () => {
  const prices = [20000, 30000];
  const pct = (id: string, bps: number, over: Partial<OfferTerms> = {}) => cand({ id, name: id, discountValue: bps, ...over });

  it('picks the best exclusive offer when it beats the stack', () => {
    const result = resolveCombination([pct('a', 1000), pct('b', 2000)], new Set(), prices);
    expect(result.applied.map((x) => x.offerId)).toEqual(['b']);
    expect(result.total).toBe(10000);
  });

  it('stacks stackable offers sequentially on the remaining amount', () => {
    const s = (id: string, bps: number, group: string | null) => pct(id, bps, { combineMode: OfferCombineMode.STACKABLE, stackGroup: group });
    const result = resolveCombination([s('a', 1000, null), s('b', 1000, null)], new Set(), prices);
    expect(result.total).toBe(5000 + 4500);
  });

  it('allows only one offer per stack group', () => {
    const s = (id: string, bps: number) => pct(id, bps, { combineMode: OfferCombineMode.STACKABLE, stackGroup: 'BANK' });
    const result = resolveCombination([s('a', 500), s('b', 1500)], new Set(), prices);
    expect(result.applied.map((x) => x.offerId)).toEqual(['b']);
  });

  it('exclusive wins over a smaller stack, stack wins over a smaller exclusive', () => {
    const stack = pct('s', 1000, { combineMode: OfferCombineMode.STACKABLE });
    expect(resolveCombination([stack, pct('x', 5000)], new Set(), prices).applied[0].offerId).toBe('x');
    expect(resolveCombination([stack, pct('x', 500)], new Set(), prices).applied[0].offerId).toBe('s');
  });

  it('a forced exclusive coupon applies alone', () => {
    const stack = pct('s', 1000, { combineMode: OfferCombineMode.STACKABLE });
    const result = resolveCombination([stack, pct('x', 100)], new Set(['x']), prices);
    expect(result.applied.map((x) => x.offerId)).toEqual(['x']);
  });

  it('a forced stackable coupon combines with auto stackable offers', () => {
    const s = (id: string) => pct(id, 1000, { combineMode: OfferCombineMode.STACKABLE });
    expect(resolveCombination([s('a'), s('b')], new Set(['a']), prices).applied).toHaveLength(2);
  });

  it('rejects incompatible forced coupons', () => {
    expect(() => resolveCombination([pct('a', 1000), pct('b', 1000)], new Set(['a', 'b']), prices)).toThrow(ConflictException);
  });

  it('never discounts below zero payable', () => {
    const big = (id: string) => cand({ id, discountType: D.FIXED_AMOUNT, discountValue: 40000, combineMode: OfferCombineMode.STACKABLE });
    expect(applySequence([big('a'), big('b')], prices).total).toBe(50000);
  });
});
