import { clockToMinutes } from '../../common/utils/timezone.util';
import { Coupon } from './entities/coupon.entity';
import { Offer } from './entities/offer.entity';
import { CouponTerms, OfferTerms } from './offer-engine';

/** Expects `cinemas`, `movies` and `paymentRules` to be loaded. */
export function toTerms(offer: Offer): OfferTerms {
  return {
    id: offer.id, name: offer.name, status: offer.status, discountType: offer.discountType, discountValue: offer.discountValue,
    maxDiscountAmount: offer.maxDiscountAmount, minOrderAmount: offer.minOrderAmount,
    bogoBuyQty: offer.bogoBuyQty, bogoGetQty: offer.bogoGetQty, startsAt: offer.startsAt, endsAt: offer.endsAt,
    eligibleDays: offer.eligibleDays,
    windowStartMin: offer.eligibleStartTime ? clockToMinutes(offer.eligibleStartTime) : null,
    windowEndMin: offer.eligibleEndTime ? clockToMinutes(offer.eligibleEndTime) : null,
    combineMode: offer.combineMode, stackGroup: offer.stackGroup, priority: offer.priority, requiresCoupon: offer.requiresCoupon,
    totalUsageLimit: offer.totalUsageLimit, perCustomerLimit: offer.perCustomerLimit,
    cinemaIds: (offer.cinemas ?? []).map((row) => row.cinemaId),
    movieIds: (offer.movies ?? []).map((row) => row.movieId),
    paymentRules: (offer.paymentRules ?? []).map((rule) => ({
      method: rule.method, bankCode: rule.bankCode, cardNetwork: rule.cardNetwork, cardBins: rule.cardBins,
    })),
  };
}

export function toCouponTerms(coupon: Coupon): CouponTerms {
  return { id: coupon.id, code: coupon.code, maxUses: coupon.maxUses, perCustomerLimit: coupon.perCustomerLimit };
}
