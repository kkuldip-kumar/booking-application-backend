import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../../../common/enums/ticket.enums';

@Entity('tickets')
@Index('uq_tickets_ticket_number', ['ticketNumber'], { unique: true })
@Index('uq_tickets_qr_token_id', ['qrTokenId'], { unique: true })
@Index('uq_tickets_qr_token_hash', ['qrTokenHash'], { unique: true })
@Index('uq_tickets_booking_seat', ['bookingSeatId'], { unique: true })
@Index('idx_tickets_booking', ['bookingId'])
@Index('idx_tickets_showtime_status', ['showtimeId', 'status'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'ticket_number', type: 'varchar', length: 32 })
  ticketNumber!: string;

  @Column({ name: 'qr_token_id', type: 'varchar', length: 32 })
  qrTokenId!: string;

  @Column({ name: 'qr_token_hash', type: 'char', length: 64 })
  qrTokenHash!: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'booking_seat_id', type: 'uuid' })
  bookingSeatId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @Column({ name: 'showtime_id', type: 'uuid' })
  showtimeId!: string;

  @Column({ name: 'booking_reference', type: 'varchar', length: 32 })
  bookingReference!: string;

  @Column({ name: 'seat_label', type: 'varchar', length: 16 })
  seatLabel!: string;

  @Column({ type: 'varchar', length: 16 })
  status!: TicketStatus;

  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt!: Date | null;

  @Column({ name: 'checked_in_device_id', type: 'uuid', nullable: true })
  checkedInDeviceId!: string | null;

  @Column({ name: 'checked_in_by_user_id', type: 'uuid', nullable: true })
  checkedInByUserId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
