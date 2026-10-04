import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';
import { MovieStatus } from '../../../common/enums/movie-status.enum';
import { AgeRating } from './age-rating.entity';
import { Format } from './format.entity';
import { Genre } from './genre.entity';
import { MovieAsset } from './movie-asset.entity';
import { MovieCredit } from './movie-credit.entity';
import { MovieLanguage } from './movie-language.entity';

// A movie is catalog-level only: cinemas, screens, formats and languages are bound to it by showtimes, never here.
@Entity('movies')
@Index('uq_movies_slug', ['slug'], { unique: true })
@Index('idx_movies_status_release', ['status', 'releaseDate'])
@Index('idx_movies_featured', ['featuredOrder'], { where: 'is_featured = true' })
@Index('idx_movies_publish_at', ['publishAt'], { where: "publish_at IS NOT NULL AND status = 'DRAFT'" })
@Index('idx_movies_unpublish_at', ['unpublishAt'], { where: 'unpublish_at IS NOT NULL' })
export class Movie extends BaseTimestampedEntity {
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text' })
  synopsis!: string;

  @Column({ name: 'runtime_min', type: 'int' })
  runtimeMin!: number;

  @Column({ name: 'release_date', type: 'date' })
  releaseDate!: string;

  @Column({ name: 'age_rating_id', type: 'uuid' })
  ageRatingId!: string;

  @ManyToOne(() => AgeRating, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'age_rating_id' })
  ageRating!: AgeRating;

  @Column({ name: 'trailer_url', type: 'varchar', length: 500, nullable: true })
  trailerUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: MovieStatus.DRAFT })
  status!: MovieStatus;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ name: 'featured_order', type: 'int', nullable: true })
  featuredOrder!: number | null;

  @Column({ name: 'publish_at', type: 'timestamptz', nullable: true })
  publishAt!: Date | null;

  @Column({ name: 'unpublish_at', type: 'timestamptz', nullable: true })
  unpublishAt!: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @ManyToMany(() => Genre)
  @JoinTable({
    name: 'movie_genres',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres!: Genre[];

  @ManyToMany(() => Format)
  @JoinTable({
    name: 'movie_formats',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'format_id', referencedColumnName: 'id' },
  })
  formats!: Format[];

  @OneToMany(() => MovieLanguage, (language) => language.movie)
  languages!: MovieLanguage[];

  @OneToMany(() => MovieCredit, (credit) => credit.movie)
  credits!: MovieCredit[];

  @OneToMany(() => MovieAsset, (asset) => asset.movie)
  assets!: MovieAsset[];
}
