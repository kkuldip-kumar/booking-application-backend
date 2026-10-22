import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTicketsTables1791244800000 implements MigrationInterface {
  name = 'CreateTicketsTables1791244800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE scanner_devices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cinema_id uuid NOT NULL REFERENCES cinemas(id) ON DELETE RESTRICT,
        name varchar(80) NOT NULL,
        key_hash char(64) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        last_seen_at timestamptz,
        created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(
      `CREATE INDEX idx_scanner_devices_cinema ON scanner_devices (cinema_id)`,
    );
    await queryRunner.query(`
      CREATE TABLE tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number varchar(32) NOT NULL,
        qr_token_id varchar(32) NOT NULL,
        qr_token_hash char(64) NOT NULL,
        booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
        booking_seat_id uuid NOT NULL REFERENCES booking_seats(id) ON DELETE RESTRICT,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        cinema_id uuid NOT NULL REFERENCES cinemas(id) ON DELETE RESTRICT,
        showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
        booking_reference varchar(32) NOT NULL,
        seat_label varchar(16) NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'ISSUED',
        checked_in_at timestamptz,
        checked_in_device_id uuid REFERENCES scanner_devices(id) ON DELETE RESTRICT,
        checked_in_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_tickets_status CHECK (status IN ('ISSUED','CHECKED_IN','CANCELLED','REFUNDED')),
        CONSTRAINT chk_tickets_checkin CHECK (status <> 'CHECKED_IN' OR checked_in_at IS NOT NULL)
      )`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_tickets_ticket_number ON tickets (ticket_number)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_tickets_qr_token_id ON tickets (qr_token_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_tickets_qr_token_hash ON tickets (qr_token_hash)`);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_tickets_booking_seat ON tickets (booking_seat_id)`);
    await queryRunner.query(`CREATE INDEX idx_tickets_booking ON tickets (booking_id)`);
    await queryRunner.query(`CREATE INDEX idx_tickets_showtime_status ON tickets (showtime_id, status)`);
    await queryRunner.query(`
      CREATE TABLE ticket_scan_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_id uuid NOT NULL,
        device_id uuid REFERENCES scanner_devices(id) ON DELETE RESTRICT,
        actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
        ticket_id uuid REFERENCES tickets(id) ON DELETE RESTRICT,
        cinema_id uuid NOT NULL REFERENCES cinemas(id) ON DELETE RESTRICT,
        showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
        method varchar(20) NOT NULL,
        result varchar(20) NOT NULL,
        presented_token_hash char(64),
        reason text,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_scan_logs_method CHECK (method IN ('DEVICE_SCAN','MANUAL_OVERRIDE')),
        CONSTRAINT chk_scan_logs_result CHECK (
          result IN ('VALID','ALREADY_USED','CANCELLED','REFUNDED','WRONG_SESSION','UNKNOWN')),
        CONSTRAINT chk_scan_logs_actor CHECK (
          (method = 'DEVICE_SCAN' AND device_id IS NOT NULL) OR
          (method = 'MANUAL_OVERRIDE' AND actor_user_id IS NOT NULL AND reason IS NOT NULL))
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_scan_logs_device_scan ON ticket_scan_logs (device_id, scan_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_scan_logs_ticket ON ticket_scan_logs (ticket_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_scan_logs_cinema_created ON ticket_scan_logs (cinema_id, created_at)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ticket_scan_logs`);
    await queryRunner.query(`DROP TABLE tickets`);
    await queryRunner.query(`DROP TABLE scanner_devices`);
  }
}
