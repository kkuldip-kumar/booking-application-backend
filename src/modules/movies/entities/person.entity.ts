import { Column, Entity, Index } from 'typeorm';
import { BaseTimestampedEntity } from '../../../common/entities/base-timestamped.entity';

@Entity('people')
@Index('idx_people_name', ['name'])
export class Person extends BaseTimestampedEntity {
  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  biography!: string | null;

  @Column({ name: 'profile_image_url', type: 'varchar', length: 500, nullable: true })
  profileImageUrl!: string | null;
}
