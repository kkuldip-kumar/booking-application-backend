import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CouponStatus, IneligibilityReason, OfferStatus } from '../../common/enums/offer.enums';
import { Coupon } from './entities/coupon.entity';
import { Offer } from './entities/offer.entity';
import { QuoteDto, QuoteResponseDto } from './dto/quote.dto';
import { Candidate, OrderContext, applySequence, checkEligibility, computeDiscount, isPaymentReason, orderValue, resolveCombination } from './offer-engine';
import { toCouponTerms, toTerms } from './offer-terms.mapper';
import { OfferUsageService } from './offer-usage.service';
import { ShowtimeOrderLookupService } from '../showtimes/showtime-order-lookup.service';

export interface QuoteResult {
  orderValue: number;
  discountTotal: number;
  payable: number;
  applied: ReturnType<typeof applySequence>['applied'];
  unlockableWithPayment: { offerId: string; name: string; potentialDiscount: number }[];
}

const INVALID_COUPON = 'Invalid coupon code';

@Injectable()
export class OfferQuoteService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly usage: OfferUsageService,
    private readonly lookup: ShowtimeOrderLookupService,
  ) {}

  async quoteForShowtime(customerId: string, dto: QuoteDto): Promise<QuoteResponseDto> {
    const facts = await this.lookup.lookup(dto.showtimeId, dto.seatIds);
    const result = await this.quote({
      customerId, cinemaId: facts.cinemaId, movieId: facts.movieId, showStartAt: facts.startAt, timezone: facts.timezone,
      ticketPrices: facts.seatPrices, payment: dto.payment, now: new Date(),
    }, dto.couponCodes ?? []);
    return {
      showtimeId: dto.showtimeId, orderValue: result.orderValue, discountTotal: result.discountTotal, payable: result.payable,
      applied: result.applied.map((a) => ({ offerId: a.offerId, name: a.name, couponCode: a.couponCode, discountType: a.discountType, amount: a.amount })),
      unlockableWithPayment: result.unlockableWithPayment,
    };
  }

  /** Read-only evaluation. Redemption (limits re-checked under lock) is done by OfferRedemptionService. */
  async quote(order: OrderContext, couponCodes: readonly string[]): Promise<QuoteResult> {
    const manager = this.dataSource.manager;
    const coupons = await this.loadCoupons(couponCodes);
    const offers = await this.loadOffers(order.now, coupons.map((c) => c.offerId));
    const couponByOffer = this.indexCoupons(coupons, offers);
    const snapshot = await this.usage.snapshot(manager, offers.map((o) => o.id), coupons.map((c) => c.id), order.customerId);

    const candidates: Candidate[] = [];
    const unlockable: QuoteResult['unlockableWithPayment'] = [];
    const prices = order.ticketPrices;
    for (const offer of offers) {
      const terms = toTerms(offer);
      const coupon = couponByOffer.get(offer.id);
      const couponTerms = coupon ? toCouponTerms(coupon) : undefined;
      const reason = checkEligibility({
        terms, order, coupon: couponTerms, offerUsage: this.usage.usageOf(snapshot.offers, offer.id),
        couponUsage: coupon ? this.usage.usageOf(snapshot.coupons, coupon.id) : { total: 0, byCustomer: 0 },
      });
      const standalone = computeDiscount(terms, prices, orderValue(prices));
      if (!reason && standalone === 0 && couponTerms) throw this.rejected(couponTerms.code, IneligibilityReason.NO_DISCOUNT);
      if (!reason && standalone > 0) candidates.push({ terms, coupon: couponTerms, standalone });
      else if (couponTerms && reason) throw this.rejected(couponTerms.code, reason);
      else if (isPaymentReason(reason) && standalone > 0) unlockable.push({ offerId: offer.id, name: offer.name, potentialDiscount: standalone });
    }
    const forced = new Set(candidates.filter((c) => c.coupon).map((c) => c.terms.id));
    const { applied, total } = resolveCombination(candidates, forced, prices);
    const value = orderValue(prices);
    return { orderValue: value, discountTotal: total, payable: value - total, applied, unlockableWithPayment: unlockable };
  }

  private rejected(code: string, reason: IneligibilityReason): UnprocessableEntityException {
    return new UnprocessableEntityException({ message: 'Coupon not applicable to this order', coupon: code, reason });
  }

  private async loadCoupons(rawCodes: readonly string[]): Promise<Coupon[]> {
    const codes = [...new Set(rawCodes.map((code) => code.trim().toUpperCase()))];
    if (codes.length === 0) return [];
    const coupons = await this.dataSource.getRepository(Coupon).createQueryBuilder('c')
      .where('c.code IN (:...codes) AND c.status = :active', { codes, active: CouponStatus.ACTIVE }).getMany();
    // Same message for unknown / disabled / inactive-offer coupons so codes cannot be enumerated.
    if (coupons.length !== codes.length) throw new BadRequestException(INVALID_COUPON);
    if (new Set(coupons.map((c) => c.offerId)).size !== coupons.length) throw new BadRequestException('Only one coupon per offer can be used');
    return coupons;
  }

  private async loadOffers(now: Date, couponOfferIds: readonly string[]): Promise<Offer[]> {
    const qb = this.dataSource.getRepository(Offer).createQueryBuilder('o')
      .leftJoinAndSelect('o.cinemas', 'oc').leftJoinAndSelect('o.movies', 'om').leftJoinAndSelect('o.paymentRules', 'pr')
      .where('o.status = :active AND o.startsAt <= :now AND o.endsAt > :now', { active: OfferStatus.ACTIVE, now });
    if (couponOfferIds.length > 0) qb.andWhere('(o.requiresCoupon = false OR o.id IN (:...couponOfferIds))', { couponOfferIds });
    else qb.andWhere('o.requiresCoupon = false');
    const offers = await qb.getMany();
    const loaded = new Set(offers.map((o) => o.id));
    if (couponOfferIds.some((id) => !loaded.has(id))) throw new BadRequestException(INVALID_COUPON);
    return offers;
  }

  private indexCoupons(coupons: readonly Coupon[], offers: readonly Offer[]): Map<string, Coupon> {
    const known = new Set(offers.map((o) => o.id));
    return new Map(coupons.filter((c) => known.has(c.offerId)).map((c) => [c.offerId, c] as const));
  }
}
