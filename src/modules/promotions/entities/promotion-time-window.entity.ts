import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Promotion } from './promotion.entity';

@Entity('promotion_time_windows')
@Index('idx_promotion_time_windows_promotion', ['promotionId'])
export class PromotionTimeWindow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'promotion_id', type: 'uuid' })
  promotionId!: string;

  /** 0 = Sunday … 6 = Saturday (UTC calendar day of evaluation instant). */
  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek!: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @ManyToOne(() => Promotion, (promotion) => promotion.timeWindows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotion_id' })
  promotion!: Promotion;
}
