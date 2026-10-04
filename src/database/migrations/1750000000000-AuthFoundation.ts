import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthFoundation1750000000000 implements MigrationInterface {
  name = 'AuthFoundation1750000000000';

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email varchar(255) NOT NULL UNIQUE,
      password_hash varchar(255) NOT NULL,
      name varchar(120) NOT NULL,
      phone varchar(20),
      status varchar(30) NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CHECK (status IN ('PENDING_VERIFICATION','ACTIVE','SUSPENDED')),
      email_verified_at timestamptz,
      failed_login_attempts int NOT NULL DEFAULT 0,
      locked_until timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE TABLE roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(50) NOT NULL UNIQUE,
      description varchar(255),
      is_system boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE TABLE permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code varchar(100) NOT NULL UNIQUE,
      module varchar(50) NOT NULL,
      action varchar(50) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE TABLE role_permissions (
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id))`);
    await q.query(`CREATE TABLE user_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      cinema_id uuid,
      created_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE UNIQUE INDEX uq_user_roles_scope
      ON user_roles (user_id, role_id, COALESCE(cinema_id, '00000000-0000-0000-0000-000000000000'))`);
    await q.query(`CREATE INDEX idx_user_roles_user ON user_roles (user_id)`);
    await q.query(`CREATE TABLE refresh_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      family_id uuid NOT NULL,
      token_hash varchar(64) NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz,
      ip varchar(45),
      user_agent varchar(255),
      created_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id)`);
    await q.query(`CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id)`);
    await q.query(`CREATE TABLE verification_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type varchar(30) NOT NULL CHECK (type IN ('EMAIL_VERIFICATION','PASSWORD_RESET')),
      token_hash varchar(64) NOT NULL UNIQUE,
      expires_at timestamptz NOT NULL,
      consumed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE INDEX idx_verification_tokens_user_type ON verification_tokens (user_id, type)`);
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['verification_tokens', 'refresh_tokens', 'user_roles', 'role_permissions', 'permissions', 'roles', 'users']) {
      await q.query(`DROP TABLE IF EXISTS ${table}`);
    }
  }
}
