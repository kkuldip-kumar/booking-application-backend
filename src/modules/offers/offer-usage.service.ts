import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RedemptionStatus } from '../../common/enums/offer.enums';
import { OfferRedemption } from './entities/offer-redemption.entity';
import { NO_USAGE, UsageCount } from './offer-engine';

export interface UsageSnapshot {
  offers: ReadonlyMap<string, UsageCount>;
  coupons: ReadonlyMap<string, UsageCount>;
}

const COUNTED_STATUSES = [RedemptionStatus.RESERVED, RedemptionStatus.CONFIRMED];

@Injectable()
export class OfferUsageService {
  async snapshot(manager: EntityManager, offerIds: readonly string[], couponIds: readonly string[], customerId: string): Promise<UsageSnapshot> {
    const [offers, coupons] = await Promise.all([
      this.countBy(manager, 'offer_id', offerIds, customerId),
      this.countBy(manager, 'coupon_id', couponIds, customerId),
    ]);
    return { offers, coupons };
  }

  async totalsByCoupon(manager: EntityManager, couponIds: readonly string[]): Promise<ReadonlyMap<string, UsageCount>> {
    return this.countBy(manager, 'coupon_id', couponIds, '00000000-0000-0000-0000-000000000000');
  }

  usageOf(map: ReadonlyMap<string, UsageCount>, id: string): UsageCount {
    return map.get(id) ?? NO_USAGE;
  }

  private async countBy(manager: EntityManager, column: 'offer_id' | 'coupon_id', ids: readonly string[], customerId: string): Promise<Map<string, UsageCount>> {
    if (ids.length === 0) return new Map();
    const rows = await manager.createQueryBuilder(OfferRedemption, 'r')
      .select(`r.${column}`, 'id').addSelect('COUNT(*)', 'total')
      .addSelect('COUNT(*) FILTER (WHERE r.customer_id = :customerId)', 'mine')
      .where(`r.${column} IN (:...ids)`, { ids }).andWhere('r.status IN (:...counted)', { counted: COUNTED_STATUSES })
      .setParameter('customerId', customerId).groupBy(`r.${column}`)
      .getRawMany<{ id: string; total: string; mine: string }>();
    return new Map(rows.map((row) => [row.id, { total: Number(row.total), byCustomer: Number(row.mine) }] as const));
  }
}
