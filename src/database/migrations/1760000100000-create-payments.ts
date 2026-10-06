// src/database/migrations/1760000100000-create-payments.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayments1760000100000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        gateway varchar(30) NOT NULL,
        gateway_order_id varchar(100) NOT NULL,
        gateway_payment_id varchar(100),
        idempotency_key varchar(64) NOT NULL,
        amount integer NOT NULL CHECK (amount > 0),
        currency char(3) NOT NULL DEFAULT 'INR',
        mode varchar(20) NOT NULL
          CHECK (mode IN ('UPI','CREDIT_CARD','DEBIT_CARD','NET_BANKING','WALLET','EMI')),
        mode_details jsonb NOT NULL DEFAULT '{}',
        status varchar(20) NOT NULL DEFAULT 'CREATED'
          CHECK (status IN ('CREATED','SUCCESS','FAILED','REFUNDED')),
        refund_required boolean NOT NULL DEFAULT false,
        raw_payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_payments_gateway_order_id UNIQUE (gateway_order_id),
        CONSTRAINT uq_payments_gateway_payment_id UNIQUE (gateway_payment_id),
        CONSTRAINT uq_payments_idempotency_key UNIQUE (idempotency_key)
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_payments_booking_success ON payments (booking_id) WHERE status = 'SUCCESS'`,
    );
    await queryRunner.query(
      'CREATE INDEX idx_payments_booking_created ON payments (booking_id, created_at DESC)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE payments');
  }
}