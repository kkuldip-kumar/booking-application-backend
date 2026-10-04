import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLog1770000000000 implements MigrationInterface {
  name = 'AuditLog1770000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        action varchar(100) NOT NULL,
        entity_type varchar(50) NOT NULL,
        entity_id uuid NOT NULL,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at DESC)`);
    await q.query(`CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id, created_at DESC)`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE IF EXISTS audit_logs`);
  }
}
