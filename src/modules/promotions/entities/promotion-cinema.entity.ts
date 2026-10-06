import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cinema } from '../../cinemas/entities/cinema.entity';
import { Promotion } from './promotion.entity';

@Entity('promotion_cinemas')
@Index('uq_promotion_cinemas', ['promotionId', 'cinemaId'], { unique: true })
export class PromotionCinema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'promotion_id', type: 'uuid' })
  promotionId!: string;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @ManyToOne(() => Promotion, (promotion) => promotion.cinemas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotion_id' })
  promotion!: Promotion;

  @ManyToOne(() => Cinema, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cinema_id' })
  cinema!: Cinema;
}
