import { ConflictException } from '@nestjs/common';
import { BPS_DENOMINATOR } from '../../common/constants/offer.constants';
import {
  CardNetwork, IneligibilityReason, OfferCombineMode, OfferDiscountType, OfferStatus, PaymentMethod,
} from '../../common/enums/offer.enums';
import { localDayAndMinutes } from '../../common/utils/timezone.util';

export interface PaymentRuleTerms {
  method: PaymentMethod | null;
  bankCode: string | null;
  cardNetwork: CardNetwork | null;
  cardBins: readonly string[];
}

export interface UsageLimits {
  totalUsageLimit: number | null;
  perCustomerLimit: number | null;
}

export interface OfferTerms extends UsageLimits {
  id: string;
  name: string;
  status: OfferStatus;
  discountType: OfferDiscountType;
  /** Basis points for PERCENTAGE and BOGO (share of the free tickets' price), paise for FIXED_AMOUNT. */
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  bogoBuyQty: number | null;
  bogoGetQty: number | null;
  startsAt: Date;
  endsAt: Date;
  eligibleDays: readonly number[] | null;
  windowStartMin: number | null;
  windowEndMin: number | null;
  combineMode: OfferCombineMode;
  stackGroup: string | null;
  priority: number;
  requiresCoupon: boolean;
  cinemaIds: readonly string[];
  movieIds: readonly string[];
  paymentRules: readonly PaymentRuleTerms[];
}

export interface CouponTerms {
  id: string;
  code: string;
  maxUses: number | null;
  perCustomerLimit: number | null;
}

/** Payment details MUST come from the gateway (not the browser) when an order is actually charged. */
export interface PaymentContext {
  method: PaymentMethod;
  bankCode?: string;
  cardNetwork?: CardNetwork;
  cardBin?: string;
}

export interface OrderContext {
  customerId: string;
  cinemaId: string;
  movieId: string;
  showStartAt: Date;
  timezone: string;
  ticketPrices: readonly number[];
  payment?: PaymentContext;
  now: Date;
}

export interface UsageCount {
  total: number;
  byCustomer: number;
}

export const NO_USAGE: UsageCount = { total: 0, byCustomer: 0 };

export interface EligibilityInput {
  terms: OfferTerms;
  order: OrderContext;
  coupon?: CouponTerms;
  offerUsage: UsageCount;
  couponUsage: UsageCount;
}

export interface Candidate {
  terms: OfferTerms;
  coupon?: CouponTerms;
  standalone: number;
}

export interface AppliedOffer {
  offerId: string;
  name: string;
  couponId: string | null;
  couponCode: string | null;
  discountType: OfferDiscountType;
  amount: number;
}

export interface AppliedSequence {
  applied: AppliedOffer[];
  total: number;
}

type Check = (input: EligibilityInput) => IneligibilityReason | null;

export const orderValue = (prices: readonly number[]): number => prices.reduce((sum, price) => sum + price, 0);

function checkValidity({ terms, order }: EligibilityInput): IneligibilityReason | null {
  if (terms.status !== OfferStatus.ACTIVE) return IneligibilityReason.NOT_ACTIVE;
  if (order.now < terms.startsAt) return IneligibilityReason.NOT_STARTED;
  if (order.now >= terms.endsAt) return IneligibilityReason.EXPIRED;
  return null;
}

function checkCoupon({ terms, coupon }: EligibilityInput): IneligibilityReason | null {
  return terms.requiresCoupon && !coupon ? IneligibilityReason.COUPON_REQUIRED : null;
}

function checkTargeting({ terms, order }: EligibilityInput): IneligibilityReason | null {
  if (terms.cinemaIds.length > 0 && !terms.cinemaIds.includes(order.cinemaId)) return IneligibilityReason.CINEMA_NOT_ELIGIBLE;
  if (terms.movieIds.length > 0 && !terms.movieIds.includes(order.movieId)) return IneligibilityReason.MOVIE_NOT_ELIGIBLE;
  return null;
}

function isInWindow(minutes: number, start: number, end: number): boolean {
  return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

// Day and time refer to the showtime's start in the cinema's local timezone, not to purchase time.
function checkSchedule({ terms, order }: EligibilityInput): IneligibilityReason | null {
  const { dayOfWeek, minutesOfDay } = localDayAndMinutes(order.showStartAt, order.timezone);
  if (terms.eligibleDays && !terms.eligibleDays.includes(dayOfWeek)) return IneligibilityReason.DAY_NOT_ELIGIBLE;
  if (terms.windowStartMin !== null && terms.windowEndMin !== null && !isInWindow(minutesOfDay, terms.windowStartMin, terms.windowEndMin)) {
    return IneligibilityReason.TIME_NOT_ELIGIBLE;
  }
  return null;
}

function checkMinOrder({ terms, order }: EligibilityInput): IneligibilityReason | null {
  return orderValue(order.ticketPrices) < terms.minOrderAmount ? IneligibilityReason.MIN_ORDER_NOT_MET : null;
}

export interface UsageCheckInput {
  terms: UsageLimits;
  coupon?: CouponTerms;
  offerUsage: UsageCount;
  couponUsage: UsageCount;
}

export function exceedsUsage(input: UsageCheckInput): IneligibilityReason | null {
  const { terms, coupon, offerUsage, couponUsage } = input;
  if (terms.totalUsageLimit !== null && offerUsage.total >= terms.totalUsageLimit) return IneligibilityReason.USAGE_LIMIT_REACHED;
  if (terms.perCustomerLimit !== null && offerUsage.byCustomer >= terms.perCustomerLimit) return IneligibilityReason.CUSTOMER_LIMIT_REACHED;
  if (coupon?.maxUses != null && couponUsage.total >= coupon.maxUses) return IneligibilityReason.USAGE_LIMIT_REACHED;
  if (coupon?.perCustomerLimit != null && couponUsage.byCustomer >= coupon.perCustomerLimit) return IneligibilityReason.CUSTOMER_LIMIT_REACHED;
  return null;
}

function ruleMatches(rule: PaymentRuleTerms, payment: PaymentContext): boolean {
  if (rule.method && rule.method !== payment.method) return false;
  if (rule.bankCode && rule.bankCode !== payment.bankCode) return false;
  if (rule.cardNetwork && rule.cardNetwork !== payment.cardNetwork) return false;
  if (rule.cardBins.length > 0) {
    const bin = payment.cardBin;
    return bin !== undefined && rule.cardBins.some((prefix) => bin.startsWith(prefix));
  }
  return true;
}

/** Rules are OR-ed; the fields inside one rule are AND-ed. No rules means any payment is fine. */
export function paymentSatisfies(rules: readonly PaymentRuleTerms[], payment: PaymentContext | undefined): IneligibilityReason | null {
  if (rules.length === 0) return null;
  if (!payment) return IneligibilityReason.PAYMENT_REQUIRED;
  return rules.some((rule) => ruleMatches(rule, payment)) ? null : IneligibilityReason.PAYMENT_NOT_ELIGIBLE;
}

const checkPayment: Check = ({ terms, order }) => paymentSatisfies(terms.paymentRules, order.payment);

// Payment is checked last so "only the payment is missing" can be reported as an unlockable offer.
const CHECKS: readonly Check[] = [checkValidity, checkCoupon, checkTargeting, checkSchedule, checkMinOrder, (i) => exceedsUsage(i), checkPayment];

export function checkEligibility(input: EligibilityInput): IneligibilityReason | null {
  for (const check of CHECKS) {
    const reason = check(input);
    if (reason) return reason;
  }
  return null;
}

export const isPaymentReason = (reason: IneligibilityReason | null): boolean =>
  reason === IneligibilityReason.PAYMENT_REQUIRED || reason === IneligibilityReason.PAYMENT_NOT_ELIGIBLE;

function bogoDiscount(terms: OfferTerms, prices: readonly number[]): number {
  const group = (terms.bogoBuyQty ?? 1) + (terms.bogoGetQty ?? 1);
  const freeCount = Math.floor(prices.length / group) * (terms.bogoGetQty ?? 1);
  const freeTotal = [...prices].sort((a, b) => a - b).slice(0, freeCount).reduce((sum, price) => sum + price, 0);
  return Math.floor((freeTotal * terms.discountValue) / BPS_DENOMINATOR);
}

/** Integer paise, rounded down (never over-discounts). `remaining` is what is still payable after earlier offers. */
export function computeDiscount(terms: OfferTerms, prices: readonly number[], remaining: number): number {
  let amount: number;
  if (terms.discountType === OfferDiscountType.PERCENTAGE) amount = Math.floor((remaining * terms.discountValue) / BPS_DENOMINATOR);
  else if (terms.discountType === OfferDiscountType.FIXED_AMOUNT) amount = terms.discountValue;
  else amount = bogoDiscount(terms, prices);
  if (terms.maxDiscountAmount !== null) amount = Math.min(amount, terms.maxDiscountAmount);
  return Math.max(0, Math.min(amount, remaining));
}

export function applySequence(chosen: readonly Candidate[], prices: readonly number[]): AppliedSequence {
  const ordered = [...chosen].sort((a, b) => a.terms.priority - b.terms.priority || b.standalone - a.standalone);
  let remaining = orderValue(prices);
  const applied: AppliedOffer[] = [];
  for (const { terms, coupon } of ordered) {
    const amount = computeDiscount(terms, prices, remaining);
    if (amount === 0) continue;
    remaining -= amount;
    applied.push({
      offerId: terms.id, name: terms.name, couponId: coupon?.id ?? null, couponCode: coupon?.code ?? null,
      discountType: terms.discountType, amount,
    });
  }
  return { applied, total: orderValue(prices) - remaining };
}

function assertForcedCompatible(forced: readonly Candidate[]): void {
  if (forced.length < 2) return;
  const groups = forced.map((c) => c.terms.stackGroup).filter((g): g is string => g !== null);
  const hasExclusive = forced.some((c) => c.terms.combineMode === OfferCombineMode.EXCLUSIVE);
  if (hasExclusive || new Set(groups).size !== groups.length) throw new ConflictException('These coupons cannot be combined');
}

function stackAutoOffers(forced: readonly Candidate[], auto: readonly Candidate[]): Candidate[] {
  const chosen = [...forced];
  const usedGroups = new Set(forced.map((c) => c.terms.stackGroup).filter((g): g is string => g !== null));
  const stackable = auto.filter((c) => c.terms.combineMode === OfferCombineMode.STACKABLE)
    .sort((a, b) => a.terms.priority - b.terms.priority || b.standalone - a.standalone);
  for (const candidate of stackable) {
    const group = candidate.terms.stackGroup;
    if (group !== null && usedGroups.has(group)) continue;
    if (group !== null) usedGroups.add(group);
    chosen.push(candidate);
  }
  return chosen;
}

function bestExclusive(auto: readonly Candidate[], prices: readonly number[]): AppliedSequence | null {
  const exclusive = auto.filter((c) => c.terms.combineMode === OfferCombineMode.EXCLUSIVE);
  const results = exclusive.map((candidate) => applySequence([candidate], prices));
  return results.length === 0 ? null : results.reduce((best, current) => (current.total > best.total ? current : best));
}

/**
 * Coupons the customer typed (`forcedIds`) are always honoured. Auto-apply offers fill in around them:
 * stackable ones are combined (at most one per stack group); without coupons, a single exclusive offer
 * competes with that stack and the larger total wins.
 */
export function resolveCombination(candidates: readonly Candidate[], forcedIds: ReadonlySet<string>, prices: readonly number[]): AppliedSequence {
  const forced = candidates.filter((c) => forcedIds.has(c.terms.id));
  const auto = candidates.filter((c) => !forcedIds.has(c.terms.id));
  assertForcedCompatible(forced);
  if (forced.length === 1 && forced[0].terms.combineMode === OfferCombineMode.EXCLUSIVE) return applySequence(forced, prices);
  const stacked = applySequence(stackAutoOffers(forced, auto), prices);
  if (forced.length > 0) return stacked;
  const exclusive = bestExclusive(auto, prices);
  return exclusive && exclusive.total > stacked.total ? exclusive : stacked;
}
