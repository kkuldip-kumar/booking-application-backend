import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Promotion } from './promotion.entity';

@Entity('promotion_redemptions')
@Index('idx_promotion_redemptions_user', ['promotionId', 'userId'])
@Index('idx_promotion_redemptions_booking', ['bookingId'], { unique: true, where: 'booking_id IS NOT NULL' })
export class PromotionRedemption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'promotion_id', type: 'uuid' })
  promotionId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId!: string | null;

  @Column({ name: 'discount_paise', type: 'int' })
  discountPaise!: number;

  @CreateDateColumn({ name: 'redeemed_at', type: 'timestamptz' })
  redeemedAt!: Date;

  @ManyToOne(() => Promotion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'promotion_id' })
  promotion!: Promotion;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
