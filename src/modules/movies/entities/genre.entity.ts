import { Column, Entity, Index } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';

@Entity('genres')
@Index('uq_genres_name', ['name'], { unique: true })
@Index('uq_genres_slug', ['slug'], { unique: true })
export class Genre extends BaseTimestampedEntity {
  @Column({ type: 'varchar', length: 60 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  slug!: string;
}
