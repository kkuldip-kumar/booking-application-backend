import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('showtime_pricing')
@Index('uq_showtime_pricing', ['showtimeId', 'seatTypeId'], { unique: true })
export class ShowtimePricing {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'showtime_id', type: 'uuid' }) showtimeId!: string;
  @Column({ name: 'seat_type_id', type: 'uuid' }) seatTypeId!: string;
  @Column({ type: 'int' }) price!: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
