import { Column, Entity, Index } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';

@Entity('age_ratings')
@Index('uq_age_ratings_code', ['code'], { unique: true })
export class AgeRating extends BaseTimestampedEntity {
  @Column({ type: 'varchar', length: 10 })
  code!: string;

  @Column({ type: 'varchar', length: 60 })
  label!: string;

  @Column({ name: 'min_age', type: 'int' })
  minAge!: number;
}
