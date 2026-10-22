import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookings1791158400000 implements MigrationInterface {
  name = 'CreateBookings1791158400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE bookings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reference varchar(20) NOT NULL UNIQUE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
        status varchar(20) NOT NULL,
        total_amount int NOT NULL,
        paid_amount int NULL,
        provider_payment_id varchar(100) NULL UNIQUE,
        refund_status varchar(20) NOT NULL DEFAULT 'NONE',
        expires_at timestamptz NOT NULL,
        cancelled_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','EXPIRED','FAILED')),
        CONSTRAINT chk_bookings_refund CHECK (refund_status IN ('NONE','PENDING','PROCESSED')),
        CONSTRAINT chk_bookings_amounts CHECK (total_amount >= 0 AND (paid_amount IS NULL OR paid_amount >= 0))
      )`);
    await queryRunner.query(`
      CREATE TABLE booking_seats (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
        showtime_seat_id uuid NOT NULL REFERENCES showtime_seats(id) ON DELETE RESTRICT,
        seat_label varchar(10) NOT NULL,
        unit_price int NOT NULL CHECK (unit_price >= 0),
        status varchar(20) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_booking_seats_status CHECK (status IN ('ACTIVE','RELEASED'))
      )`);
    await queryRunner.query(`CREATE INDEX idx_bookings_user_created ON bookings (user_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_bookings_status_expires ON bookings (status, expires_at)`);
    await queryRunner.query(`CREATE INDEX idx_bookings_showtime ON bookings (showtime_id)`);
    await queryRunner.query(`CREATE INDEX idx_bookings_refund_pending ON bookings (updated_at) WHERE refund_status = 'PENDING'`);
    await queryRunner.query(`CREATE INDEX idx_booking_seats_booking ON booking_seats (booking_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_booking_seats_active ON booking_seats (showtime_seat_id) WHERE status = 'ACTIVE'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE booking_seats`);
    await queryRunner.query(`DROP TABLE bookings`);
  }
}
