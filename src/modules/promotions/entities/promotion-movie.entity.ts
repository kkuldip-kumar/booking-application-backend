import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';
import { Promotion } from './promotion.entity';

@Entity('promotion_movies')
@Index('uq_promotion_movies', ['promotionId', 'movieId'], { unique: true })
export class PromotionMovie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'promotion_id', type: 'uuid' })
  promotionId!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @ManyToOne(() => Promotion, (promotion) => promotion.movies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'promotion_id' })
  promotion!: Promotion;

  @ManyToOne(() => Movie, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'movie_id' })
  movie!: Movie;
}
