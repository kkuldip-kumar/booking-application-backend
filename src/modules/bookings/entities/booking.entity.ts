import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStatus, RefundStatus } from '../../../common/enums/booking.enums';
import { BookingSeat } from './booking-seat.entity';

@Entity('bookings')
@Index('idx_bookings_user_created', ['userId', 'createdAt'])
@Index('idx_bookings_status_expires', ['status', 'expiresAt'])
@Index('idx_bookings_showtime', ['showtimeId'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  reference!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'showtime_id', type: 'uuid' })
  showtimeId!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: BookingStatus;

  @Column({ name: 'total_amount', type: 'int' })
  totalAmount!: number;

  @Column({ name: 'paid_amount', type: 'int', nullable: true })
  paidAmount!: number | null;

  @Column({ name: 'provider_payment_id', type: 'varchar', length: 100, nullable: true, unique: true })
  providerPaymentId!: string | null;

  @Column({ name: 'refund_status', type: 'varchar', length: 20, default: RefundStatus.NONE })
  refundStatus!: RefundStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => BookingSeat, (seat) => seat.booking)
  seats?: BookingSeat[];
}
