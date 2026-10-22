import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingSeatStatus } from '../../../common/enums/booking.enums';
import { Booking } from './booking.entity';

@Entity('booking_seats')
@Index('idx_booking_seats_booking', ['bookingId'])
@Index('uq_booking_seats_active', ['showtimeSeatId'], { unique: true, where: `"status" = 'ACTIVE'` })
export class BookingSeat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'showtime_seat_id', type: 'uuid' })
  showtimeSeatId!: string;

  @Column({ name: 'seat_label', type: 'varchar', length: 10 })
  seatLabel!: string;

  @Column({ name: 'unit_price', type: 'int' })
  unitPrice!: number;

  @Column({ type: 'varchar', length: 20 })
  status!: BookingSeatStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Booking, (booking) => booking.seats, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;
}
