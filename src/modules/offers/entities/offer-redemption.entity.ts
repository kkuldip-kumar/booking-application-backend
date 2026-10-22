import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RedemptionStatus } from '../../../common/enums/offer.enums';
import { Coupon } from './coupon.entity';
import { Offer } from './offer.entity';

// Snapshot of the discount actually granted on a booking; later edits to the offer never rewrite history.
@Entity('offer_redemptions')
@Index('uq_redemptions_booking_offer', ['bookingId', 'offerId'], { unique: true })
@Index('idx_redemptions_offer_customer', ['offerId', 'customerId', 'status'])
@Index('idx_redemptions_offer_status', ['offerId', 'status'])
export class OfferRedemption {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'offer_id', type: 'uuid' }) offerId!: string;
  @ManyToOne(() => Offer, { onDelete: 'RESTRICT', nullable: false }) @JoinColumn({ name: 'offer_id' }) offer!: Offer;
  @Index() @Column({ name: 'coupon_id', type: 'uuid', nullable: true }) couponId!: string | null;
  @ManyToOne(() => Coupon, { onDelete: 'RESTRICT', nullable: true }) @JoinColumn({ name: 'coupon_id' }) coupon!: Coupon | null;
  @Column({ name: 'customer_id', type: 'uuid' }) customerId!: string;
  // FK to bookings is added by the bookings migration.
  @Column({ name: 'booking_id', type: 'uuid' }) bookingId!: string;
  @Column({ name: 'discount_amount', type: 'int' }) discountAmount!: number;
  @Column({ type: 'enum', enum: RedemptionStatus, enumName: 'redemption_status', default: RedemptionStatus.RESERVED }) status!: RedemptionStatus;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
