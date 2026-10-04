import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShowtimeSeatStatus } from '../../../common/enums/cinema.enums';

// Per-session seat inventory. Postgres is the source of truth for seat state (ADR-0001).
@Entity('showtime_seats')
@Index('uq_showtime_seat', ['showtimeId', 'seatId'], { unique: true })
@Index('idx_showtime_seats_status', ['showtimeId', 'status'])
export class ShowtimeSeat {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'showtime_id', type: 'uuid' }) showtimeId!: string;
  @Column({ name: 'seat_id', type: 'uuid' }) seatId!: string;
  @Column({ type: 'int' }) price!: number;
  @Column({ type: 'enum', enum: ShowtimeSeatStatus, enumName: 'showtime_seat_status', default: ShowtimeSeatStatus.AVAILABLE }) status!: ShowtimeSeatStatus;
  @Column({ name: 'held_by', type: 'uuid', nullable: true }) heldBy!: string | null;
  @Column({ name: 'held_until', type: 'timestamptz', nullable: true }) heldUntil!: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
