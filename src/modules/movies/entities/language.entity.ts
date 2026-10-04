import { Column, Entity, Index } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';

@Entity('languages')
@Index('uq_languages_code', ['code'], { unique: true })
export class Language extends BaseTimestampedEntity {
  @Column({ type: 'varchar', length: 10 })
  code!: string;

  @Column({ type: 'varchar', length: 60 })
  name!: string;
}
