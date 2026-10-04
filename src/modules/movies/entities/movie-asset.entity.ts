import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';
import { MovieAssetType } from '../../../common/enums/movie-asset-type.enum';
import { Movie } from './movie.entity';

@Entity('movie_assets')
@Index('uq_movie_assets_movie_type', ['movieId', 'assetType'], { unique: true })
export class MovieAsset extends BaseTimestampedEntity {
  @Column({ name: 'movie_id', type: 'uuid' })
  movieId!: string;

  @ManyToOne(() => Movie, (movie) => movie.assets, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'movie_id' })
  movie!: Relation<Movie>;

  @Column({ name: 'asset_type', type: 'varchar', length: 10 })
  assetType!: MovieAssetType;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 300 })
  storageKey!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 50 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;
}
