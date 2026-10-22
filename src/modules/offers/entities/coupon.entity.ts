import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CouponStatus } from '../../../common/enums/offer.enums';
import { Offer } from './offer.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ name: 'offer_id', type: 'uuid' }) offerId!: string;
  @ManyToOne(() => Offer, { onDelete: 'RESTRICT', nullable: false }) @JoinColumn({ name: 'offer_id' }) offer!: Offer;
  @Column({ type: 'varchar', length: 32, unique: true }) code!: string;
  @Column({ name: 'max_uses', type: 'int', nullable: true }) maxUses!: number | null;
  @Column({ name: 'per_customer_limit', type: 'int', nullable: true }) perCustomerLimit!: number | null;
  @Column({ type: 'enum', enum: CouponStatus, enumName: 'coupon_status', default: CouponStatus.ACTIVE }) status!: CouponStatus;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
