import { ConflictException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RedemptionStatus } from '../../common/enums/offer.enums';
import { isUniqueViolation } from '../../common/utils/db-errors.util';
import { Coupon } from './entities/coupon.entity';
import { OfferRedemption } from './entities/offer-redemption.entity';
import { Offer } from './entities/offer.entity';
import { OrderContext, PaymentContext, exceedsUsage, paymentSatisfies } from './offer-engine';
import { OfferQuoteService, QuoteResult } from './offer-quote.service';
import { OfferUsageService } from './offer-usage.service';

export interface RedeemInput {
  order: OrderContext;
  couponCodes: readonly string[];
  bookingId: string;
}

/**
 * Called by the bookings module inside its booking transaction:
 *   redeem (booking PENDING) -> confirm (payment webhook) | release (expiry, failure, cancellation).
 * Pass the transaction's EntityManager so the usage-limit locks live and die with the booking transaction.
 */
@Injectable()
export class OfferRedemptionService {
  constructor(private readonly quotes: OfferQuoteService, private readonly usage: OfferUsageService) {}

  async redeem(manager: EntityManager, input: RedeemInput): Promise<QuoteResult> {
    const quote = await this.quotes.quote(input.order, input.couponCodes);
    if (quote.applied.length === 0) return quote;
    const offerIds = quote.applied.map((a) => a.offerId);
    const couponIds = quote.applied.map((a) => a.couponId).filter((id): id is string => id !== null);
    // Locks are taken in id order so two bookings redeeming the same offers cannot deadlock.
    const offers = await manager.createQueryBuilder(Offer, 'o').setLock('pessimistic_write').where('o.id IN (:...offerIds)', { offerIds }).orderBy('o.id').getMany();
    const coupons = couponIds.length === 0 ? [] :
      await manager.createQueryBuilder(Coupon, 'c').setLock('pessimistic_write').where('c.id IN (:...couponIds)', { couponIds }).orderBy('c.id').getMany();
    await this.assertStillWithinLimits({ manager, offers, coupons, customerId: input.order.customerId, quote });
    await this.insertRows(manager, input, quote);
    return quote;
  }

  async confirm(manager: EntityManager, bookingId: string): Promise<void> {
    await manager.update(OfferRedemption, { bookingId, status: RedemptionStatus.RESERVED }, { status: RedemptionStatus.CONFIRMED });
  }

  /** Frees the usage (expired hold, failed payment, cancellation/refund). Idempotent. */
  async release(manager: EntityManager, bookingId: string): Promise<void> {
    await manager.createQueryBuilder().update(OfferRedemption).set({ status: RedemptionStatus.RELEASED })
      .where('bookingId = :bookingId AND status IN (:...live)', { bookingId, live: [RedemptionStatus.RESERVED, RedemptionStatus.CONFIRMED] }).execute();
  }

  /** Re-check at payment time using gateway-verified payment data; a mismatch means the booking must not be confirmed. */
  async assertPaymentMatches(manager: EntityManager, bookingId: string, payment: PaymentContext): Promise<void> {
    const rows = await manager.createQueryBuilder(OfferRedemption, 'r')
      .innerJoinAndSelect('r.offer', 'o').leftJoinAndSelect('o.paymentRules', 'pr')
      .where('r.bookingId = :bookingId AND r.status <> :released', { bookingId, released: RedemptionStatus.RELEASED }).getMany();
    for (const row of rows) {
      const rules = (row.offer.paymentRules ?? []).map((r) => ({ method: r.method, bankCode: r.bankCode, cardNetwork: r.cardNetwork, cardBins: r.cardBins }));
      if (paymentSatisfies(rules, payment)) throw new UnprocessableEntityException('Payment method is not eligible for an applied offer');
    }
  }

  private async assertStillWithinLimits(args: { manager: EntityManager; offers: Offer[]; coupons: Coupon[]; customerId: string; quote: QuoteResult }): Promise<void> {
    const { manager, offers, coupons, customerId, quote } = args;
    const snapshot = await this.usage.snapshot(manager, offers.map((o) => o.id), coupons.map((c) => c.id), customerId);
    for (const applied of quote.applied) {
      const offer = offers.find((o) => o.id === applied.offerId);
      const coupon = coupons.find((c) => c.id === applied.couponId);
      if (!offer) throw new ConflictException('Offer is no longer available');
      const reason = exceedsUsage({
        terms: { totalUsageLimit: offer.totalUsageLimit, perCustomerLimit: offer.perCustomerLimit },
        coupon: coupon ? { id: coupon.id, code: coupon.code, maxUses: coupon.maxUses, perCustomerLimit: coupon.perCustomerLimit } : undefined,
        offerUsage: this.usage.usageOf(snapshot.offers, offer.id),
        couponUsage: coupon ? this.usage.usageOf(snapshot.coupons, coupon.id) : { total: 0, byCustomer: 0 },
      });
      if (reason) throw new ConflictException('Offer is no longer available');
    }
  }

  private async insertRows(manager: EntityManager, input: RedeemInput, quote: QuoteResult): Promise<void> {
    try {
      await manager.insert(OfferRedemption, quote.applied.map((a) => ({
        offerId: a.offerId, couponId: a.couponId, customerId: input.order.customerId, bookingId: input.bookingId,
        discountAmount: a.amount, status: RedemptionStatus.RESERVED,
      })));
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException('Offers are already applied to this booking');
      throw error;
    }
  }
}
