import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ScanMethod, ScanResult } from '../../../common/enums/ticket.enums';

@Entity('ticket_scan_logs')
@Index('uq_scan_logs_device_scan', ['deviceId', 'scanId'], { unique: true })
@Index('idx_scan_logs_ticket', ['ticketId', 'createdAt'])
@Index('idx_scan_logs_cinema_created', ['cinemaId', 'createdAt'])
export class TicketScanLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'scan_id', type: 'uuid' })
  scanId!: string;

  @Column({ name: 'device_id', type: 'uuid', nullable: true })
  deviceId!: string | null;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId!: string | null;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId!: string | null;

  @Column({ name: 'cinema_id', type: 'uuid' })
  cinemaId!: string;

  @Column({ name: 'showtime_id', type: 'uuid' })
  showtimeId!: string;

  @Column({ type: 'varchar', length: 20 })
  method!: ScanMethod;

  @Column({ type: 'varchar', length: 20 })
  result!: ScanResult;

  @Column({ name: 'presented_token_hash', type: 'char', length: 64, nullable: true })
  presentedTokenHash!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
