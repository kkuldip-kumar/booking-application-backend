import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MovieStatus } from '../../../common/enums/movie-status.enum';

@Entity('movie_status_history')
@Index('idx_movie_status_history_movie', ['movieId', 'createdAt'])
export class MovieStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @Column({ name: 'old_status', type: 'varchar', length: 20, nullable: true })
  oldStatus!: MovieStatus | null;

  @Column({ name: 'new_status', type: 'varchar', length: 20 })
  newStatus!: MovieStatus;

  // Null when the scheduler (not a person) made the change.
  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
