import { Column, Entity, Index } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';

@Entity('formats')
@Index('uq_formats_code', ['code'], { unique: true })
export class Format extends BaseTimestampedEntity {
  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({ type: 'varchar', length: 60 })
  name!: string;
}
