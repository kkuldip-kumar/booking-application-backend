import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CreditType } from '../../../common/enums/cinema.enums';
import { Movie } from '../../movies/entities/movie.entity';
import { Person } from './person.entity';

// Uniqueness (movie, person, credit_type, COALESCE(character_name,'')) is enforced by a DB index in the migration.
@Entity('movie_credits')
@Index('idx_movie_credits_movie_order', ['movieId', 'creditType', 'displayOrder'])
export class MovieCredit {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'movie_id', type: 'uuid' }) movieId!: string;
  @ManyToOne(() => Movie, { onDelete: 'RESTRICT', nullable: false }) @JoinColumn({ name: 'movie_id' }) movie!: Movie;
  @Index() @Column({ name: 'person_id', type: 'uuid' }) personId!: string;
  @ManyToOne(() => Person, { onDelete: 'RESTRICT', nullable: false }) @JoinColumn({ name: 'person_id' }) person!: Person;
  @Column({ name: 'credit_type', type: 'enum', enum: CreditType, enumName: 'credit_type' }) creditType!: CreditType;
  @Column({ name: 'character_name', type: 'varchar', length: 150, nullable: true }) characterName!: string | null;
  @Column({ name: 'display_order', type: 'int', default: 0 }) displayOrder!: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
