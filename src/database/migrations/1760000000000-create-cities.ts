// src/database/migrations/1760000000000-create-cities.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCities1760000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL,
        slug varchar(120) NOT NULL,
        state varchar(100) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_cities_name UNIQUE (name),
        CONSTRAINT uq_cities_slug UNIQUE (slug)
      )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE cities');
  }
}