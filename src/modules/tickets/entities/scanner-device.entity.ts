import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('scanner_devices')
@Index('idx_scanner_devices_cinema', ['cinemaId'])
export class ScannerDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'key_hash', type: 'char', length: 64 })
  keyHash!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
