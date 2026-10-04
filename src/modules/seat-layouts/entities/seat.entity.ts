import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SeatStatus } from '../../../common/enums/cinema.enums';
import { SeatLayout } from './seat-layout.entity';
import { SeatType } from './seat-type.entity';

@Entity('seats')
@Index('uq_seats_layout_label', ['layoutId', 'rowLabel', 'seatNumber'], { unique: true })
@Index('uq_seats_layout_grid', ['layoutId', 'gridRow', 'gridCol'], { unique: true })
export class Seat {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'layout_id', type: 'uuid' }) layoutId!: string;
  @ManyToOne(() => SeatLayout, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'layout_id' }) layout!: SeatLayout;
  @Column({ name: 'seat_type_id', type: 'uuid' }) seatTypeId!: string;
  @ManyToOne(() => SeatType, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'seat_type_id' }) seatType!: SeatType;
  @Column({ name: 'row_label', type: 'varchar', length: 3 }) rowLabel!: string;
  @Column({ name: 'seat_number', type: 'int' }) seatNumber!: number;
  @Column({ name: 'grid_row', type: 'int' }) gridRow!: number;
  @Column({ name: 'grid_col', type: 'int' }) gridCol!: number;
  @Column({ name: 'is_accessible', type: 'boolean', default: false }) isAccessible!: boolean;
  @Column({ name: 'is_companion', type: 'boolean', default: false }) isCompanion!: boolean;
  @Column({ type: 'enum', enum: SeatStatus, enumName: 'seat_status', default: SeatStatus.ACTIVE }) status!: SeatStatus;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
