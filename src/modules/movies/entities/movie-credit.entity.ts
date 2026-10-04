import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { CreditType } from '../../../common/enums/credit-type.enum';
import { Movie } from './movie.entity';
import { Person } from './person.entity';

@Entity('movie_credits')
@Index('uq_movie_credits_movie_person_type', ['movieId', 'personId', 'creditType'], { unique: true })
@Index('idx_movie_credits_movie_order', ['movieId', 'displayOrder'])
@Index('idx_movie_credits_person', ['personId'])
export class MovieCredit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @ManyToOne(() => Movie, (movie) => movie.credits, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'movie_id' })
  movie!: Relation<Movie>;

  @Column({ name: 'person_id', type: 'uuid' })
  personId!: string;

  @ManyToOne(() => Person, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'person_id' })
  person!: Person;

  @Column({ name: 'credit_type', type: 'varchar', length: 20 })
  creditType!: CreditType;

  @Column({ name: 'character_name', type: 'varchar', length: 150, nullable: true })
  characterName!: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
