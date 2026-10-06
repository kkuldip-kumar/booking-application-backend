// src/modules/payments/entities/payment.entity.ts
import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { PaymentMode } from '../../../common/enums/payment-mode.enum';
import { PaymentStatus } from '../../../common/enums/payment-status.enum';

@Entity('payments')
@Index('idx_payments_booking_created', ['bookingId', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 30 })
  gateway!: string;

  @Index('uq_payments_gateway_order_id', { unique: true })
  @Column({ name: 'gateway_order_id', type: 'varchar', length: 100 })
  gatewayOrderId!: string;

  @Index('uq_payments_gateway_payment_id', { unique: true })
  @Column({ name: 'gateway_payment_id', type: 'varchar', length: 100, nullable: true })
  gatewayPaymentId!: string | null;

  @Index('uq_payments_idempotency_key', { unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 64 })
  idempotencyKey!: string;

  /** Minor units (paise). */
  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'char', length: 3, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 20 })
  mode!: PaymentMode;

  @Column({ name: 'mode_details', type: 'jsonb', default: () => "'{}'" })
  modeDetails!: Record<string, string | number>;

  @Column({ type: 'varchar', length: 20, default: PaymentStatus.CREATED })
  status!: PaymentStatus;

  /** Money captured but booking could not be confirmed (expired hold, amount mismatch). */
  @Column({ name: 'refund_required', type: 'boolean', default: false })
  refundRequired!: boolean;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload!: Record<string, string | number> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}