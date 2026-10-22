import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';
import {
  CardNetwork,
  CombinabilityRule,
  PaymentMethod,
  PromotionStatus,
  PromotionType,
} from '../../../common/enums/promotion.enums';
import { PromotionCinema } from './promotion-cinema.entity';
import { PromotionMovie } from './promotion-movie.entity';
import { PromotionTimeWindow } from './promotion-time-window.entity';

@Entity('promotions')
@Index('uq_promotions_code', ['code'], { unique: true, where: 'code IS NOT NULL' })
@Index('idx_promotions_status_validity', ['status', 'validFrom', 'validUntil'])
export class Promotion extends BaseTimestampedEntity {
  @Column({ type: 'varchar', length: 32, nullable: true })
  code!: string | null;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'promotion_type', type: 'enum', enum: PromotionType, enumName: 'promotion_type' })
  promotionType!: PromotionType;

  /** Basis points for PERCENTAGE (1000 = 10%). */
  @Column({ name: 'discount_percent_bps', type: 'int', nullable: true })
  discountPercentBps!: number | null;

  /** Paise for FIXED_AMOUNT or cap reference. */
  @Column({ name: 'discount_amount_paise', type: 'int', nullable: true })
  discountAmountPaise!: number | null;

  @Column({ name: 'bogo_buy_quantity', type: 'int', default: 1 })
  bogoBuyQuantity!: number;

  @Column({ name: 'bogo_get_quantity', type: 'int', default: 1 })
  bogoGetQuantity!: number;

  @Column({ name: 'min_order_value_paise', type: 'int', default: 0 })
  minOrderValuePaise!: number;

  @Column({ name: 'max_discount_paise', type: 'int', nullable: true })
  maxDiscountPaise!: number | null;

  @Column({ name: 'global_usage_limit', type: 'int', nullable: true })
  globalUsageLimit!: number | null;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount!: number;

  @Column({ name: 'per_customer_usage_limit', type: 'int', nullable: true })
  perCustomerUsageLimit!: number | null;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom!: Date;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil!: Date;

  @Column({ type: 'enum', enum: PromotionStatus, enumName: 'promotion_status', default: PromotionStatus.DRAFT })
  status!: PromotionStatus;

  @Column({ name: 'combinability_rule', type: 'enum', enum: CombinabilityRule, enumName: 'combinability_rule' })
  combinabilityRule!: CombinabilityRule;

  /** When EXCLUSIVE, only one promotion per group may apply. */
  @Column({ name: 'exclusive_group', type: 'varchar', length: 64, nullable: true })
  exclusiveGroup!: string | null;

  @Column({ name: 'requires_coupon_code', type: 'boolean', default: true })
  requiresCouponCode!: boolean;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, enumName: 'payment_method', nullable: true })
  paymentMethod!: PaymentMethod | null;

  @Column({ name: 'bank_code', type: 'varchar', length: 32, nullable: true })
  bankCode!: string | null;

  @Column({ name: 'card_network', type: 'enum', enum: CardNetwork, enumName: 'card_network', nullable: true })
  cardNetwork!: CardNetwork | null;

  @Column({ name: 'card_issuer', type: 'varchar', length: 64, nullable: true })
  cardIssuer!: string | null;

  @Column({ name: 'card_bin_prefixes', type: 'text', array: true, default: () => "'{}'" })
  cardBinPrefixes!: string[];

  @Column({ name: 'applies_to_all_cinemas', type: 'boolean', default: true })
  appliesToAllCinemas!: boolean;

  @Column({ name: 'applies_to_all_movies', type: 'boolean', default: true })
  appliesToAllMovies!: boolean;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @OneToMany(() => PromotionCinema, (row) => row.promotion, { cascade: true })
  cinemas?: PromotionCinema[];

  @OneToMany(() => PromotionMovie, (row) => row.promotion, { cascade: true })
  movies?: PromotionMovie[];

  @OneToMany(() => PromotionTimeWindow, (row) => row.promotion, { cascade: true })
  timeWindows?: PromotionTimeWindow[];
}
