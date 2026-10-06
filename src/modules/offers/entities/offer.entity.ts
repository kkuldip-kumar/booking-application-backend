import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DEFAULT_OFFER_PRIORITY } from '../../../common/constants/offer.constants';
import { OfferCombineMode, OfferDiscountType, OfferStatus } from '../../../common/enums/offer.enums';
import { OfferCinema } from './offer-cinema.entity';
import { OfferMovie } from './offer-movie.entity';
import { OfferPaymentRule } from './offer-payment-rule.entity';

@Entity('offers')
@Index('idx_offers_status_window', ['status', 'startsAt', 'endsAt'])
export class Offer {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 150 }) name!: string;
  @Column({ type: 'text', nullable: true }) description!: string | null;
  @Column({ name: 'discount_type', type: 'enum', enum: OfferDiscountType, enumName: 'offer_discount_type' }) discountType!: OfferDiscountType;
  // Basis points for PERCENTAGE and BOGO, paise for FIXED_AMOUNT.
  @Column({ name: 'discount_value', type: 'int' }) discountValue!: number;
  @Column({ name: 'max_discount_amount', type: 'int', nullable: true }) maxDiscountAmount!: number | null;
  @Column({ name: 'min_order_amount', type: 'int', default: 0 }) minOrderAmount!: number;
  @Column({ name: 'bogo_buy_qty', type: 'int', nullable: true }) bogoBuyQty!: number | null;
  @Column({ name: 'bogo_get_qty', type: 'int', nullable: true }) bogoGetQty!: number | null;
  @Column({ name: 'starts_at', type: 'timestamptz' }) startsAt!: Date;
  @Column({ name: 'ends_at', type: 'timestamptz' }) endsAt!: Date;
  @Column({ name: 'eligible_days', type: 'int', array: true, nullable: true }) eligibleDays!: number[] | null;
  @Column({ name: 'eligible_start_time', type: 'time', nullable: true }) eligibleStartTime!: string | null;
  @Column({ name: 'eligible_end_time', type: 'time', nullable: true }) eligibleEndTime!: string | null;
  @Column({ name: 'combine_mode', type: 'enum', enum: OfferCombineMode, enumName: 'offer_combine_mode', default: OfferCombineMode.EXCLUSIVE }) combineMode!: OfferCombineMode;
  @Column({ name: 'stack_group', type: 'varchar', length: 50, nullable: true }) stackGroup!: string | null;
  @Column({ type: 'int', default: DEFAULT_OFFER_PRIORITY }) priority!: number;
  @Column({ name: 'requires_coupon', type: 'boolean', default: false }) requiresCoupon!: boolean;
  @Column({ name: 'is_public', type: 'boolean', default: true }) isPublic!: boolean;
  @Column({ name: 'total_usage_limit', type: 'int', nullable: true }) totalUsageLimit!: number | null;
  @Column({ name: 'per_customer_limit', type: 'int', nullable: true }) perCustomerLimit!: number | null;
  @Column({ type: 'enum', enum: OfferStatus, enumName: 'offer_status', default: OfferStatus.DRAFT }) status!: OfferStatus;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @OneToMany(() => OfferCinema, (row) => row.offer) cinemas?: OfferCinema[];
  @OneToMany(() => OfferMovie, (row) => row.offer) movies?: OfferMovie[];
  @OneToMany(() => OfferPaymentRule, (row) => row.offer) paymentRules?: OfferPaymentRule[];
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
