import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeatLayoutStatus } from '../../../common/enums/cinema.enums';
import { Screen } from '../../screens/entities/screen.entity';

@Entity('seat_layouts')
@Index('uq_seat_layouts_screen_version', ['screenId', 'version'], { unique: true })
export class SeatLayout {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'screen_id', type: 'uuid' }) screenId!: string;
  @ManyToOne(() => Screen, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'screen_id' }) screen!: Screen;
  @Column({ type: 'int' }) version!: number;
  @Column({ type: 'varchar', length: 100 }) name!: string;
  @Column({ type: 'enum', enum: SeatLayoutStatus, enumName: 'seat_layout_status', default: SeatLayoutStatus.DRAFT }) status!: SeatLayoutStatus;
  @Column({ name: 'row_count', type: 'int' }) rowCount!: number;
  @Column({ name: 'column_count', type: 'int' }) columnCount!: number;
  @Column({ name: 'created_by', type: 'uuid' }) createdBy!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
