import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { LanguageType } from '../../../common/enums/language-type.enum';
import { Language } from './language.entity';
import { Movie } from './movie.entity';

@Entity('movie_languages')
@Index('uq_movie_languages_movie_lang_type', ['movieId', 'languageId', 'languageType'], { unique: true })
@Index('idx_movie_languages_language', ['languageId'])
export class MovieLanguage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @ManyToOne(() => Movie, (movie) => movie.languages, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'movie_id' })
  movie!: Relation<Movie>;

  @Column({ name: 'language_id', type: 'uuid' })
  languageId!: string;

  @ManyToOne(() => Language, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'language_type', type: 'varchar', length: 10 })
  languageType!: LanguageType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
