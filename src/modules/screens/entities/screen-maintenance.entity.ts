import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Screen } from './screen.entity';

@Entity('screen_maintenance')
@Index('idx_screen_maintenance_window', ['screenId', 'startAt'])
export class ScreenMaintenance {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'screen_id', type: 'uuid' }) screenId!: string;
  @ManyToOne(() => Screen, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'screen_id' }) screen!: Screen;
  @Column({ name: 'start_at', type: 'timestamptz' }) startAt!: Date;
  @Column({ name: 'end_at', type: 'timestamptz' }) endAt!: Date;
  @Column({ type: 'varchar', length: 255 }) reason!: string;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
