import { MigrationInterface, QueryRunner } from 'typeorm';

export class CinemaOperations1760000000000 implements MigrationInterface {
  name = 'CinemaOperations1760000000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
    await q.query(`
      CREATE TYPE cinema_status AS ENUM ('ACTIVE','INACTIVE','CLOSED');
      CREATE TYPE cinema_image_type AS ENUM ('LOGO','FACADE','GALLERY');
      CREATE TYPE screen_status AS ENUM ('ACTIVE','MAINTENANCE','INACTIVE');
      CREATE TYPE show_format AS ENUM ('2D','3D','IMAX','4DX','DBOX');
      CREATE TYPE seat_layout_status AS ENUM ('DRAFT','ACTIVE','ARCHIVED');
      CREATE TYPE seat_status AS ENUM ('ACTIVE','BLOCKED');
      CREATE TYPE showtime_status AS ENUM ('SCHEDULED','BLOCKED','CANCELLED','COMPLETED');
      CREATE TYPE showtime_seat_status AS ENUM ('AVAILABLE','HELD','BOOKED','BLOCKED');
      CREATE TYPE credit_type AS ENUM ('DIRECTOR','CAST','WRITER','PRODUCER','CINEMATOGRAPHER','COMPOSER');
    `);
    await q.query(`
      CREATE TABLE cinemas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(20) NOT NULL UNIQUE,
        name varchar(150) NOT NULL,
        address_line varchar(255) NOT NULL,
        city varchar(100) NOT NULL,
        state varchar(100) NOT NULL,
        country varchar(2) NOT NULL DEFAULT 'IN',
        postal_code varchar(12) NOT NULL,
        latitude double precision CHECK (latitude BETWEEN -90 AND 90),
        longitude double precision CHECK (longitude BETWEEN -180 AND 180),
        timezone varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
        phone varchar(20), email varchar(255),
        opening_time time NOT NULL, closing_time time NOT NULL,
        facilities text[] NOT NULL DEFAULT '{}',
        status cinema_status NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_cinemas_city_status ON cinemas (city, status);

      CREATE TABLE cinema_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cinema_id uuid NOT NULL REFERENCES cinemas(id) ON DELETE RESTRICT,
        url varchar(500) NOT NULL,
        type cinema_image_type NOT NULL DEFAULT 'GALLERY',
        sort_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_cinema_images_cinema_id" ON cinema_images (cinema_id);

      CREATE TABLE screens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cinema_id uuid NOT NULL REFERENCES cinemas(id) ON DELETE RESTRICT,
        name varchar(100) NOT NULL,
        screen_number int NOT NULL,
        capacity int NOT NULL DEFAULT 0 CHECK (capacity >= 0),
        supported_formats show_format[] NOT NULL DEFAULT '{}',
        status screen_status NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX uq_screens_cinema_number ON screens (cinema_id, screen_number);

      CREATE TABLE screen_maintenance (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        screen_id uuid NOT NULL REFERENCES screens(id) ON DELETE RESTRICT,
        start_at timestamptz NOT NULL, end_at timestamptz NOT NULL,
        reason varchar(255) NOT NULL,
        created_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (end_at > start_at)
      );
      CREATE INDEX idx_screen_maintenance_window ON screen_maintenance (screen_id, start_at);

      CREATE TABLE seat_types (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(30) NOT NULL UNIQUE,
        name varchar(100) NOT NULL,
        price_multiplier_bps int NOT NULL DEFAULT 10000 CHECK (price_multiplier_bps > 0),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      INSERT INTO seat_types (code, name, price_multiplier_bps) VALUES
        ('REGULAR','Regular',10000), ('PREMIUM','Premium',15000), ('RECLINER','Recliner',25000)
      ON CONFLICT (code) DO NOTHING;

      CREATE TABLE seat_layouts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        screen_id uuid NOT NULL REFERENCES screens(id) ON DELETE RESTRICT,
        version int NOT NULL,
        name varchar(100) NOT NULL,
        status seat_layout_status NOT NULL DEFAULT 'DRAFT',
        row_count int NOT NULL, column_count int NOT NULL,
        created_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX uq_seat_layouts_screen_version ON seat_layouts (screen_id, version);
      CREATE UNIQUE INDEX uq_seat_layouts_one_active ON seat_layouts (screen_id) WHERE status = 'ACTIVE';

      CREATE TABLE seats (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        layout_id uuid NOT NULL REFERENCES seat_layouts(id) ON DELETE RESTRICT,
        seat_type_id uuid NOT NULL REFERENCES seat_types(id) ON DELETE RESTRICT,
        row_label varchar(3) NOT NULL, seat_number int NOT NULL,
        grid_row int NOT NULL, grid_col int NOT NULL,
        is_accessible boolean NOT NULL DEFAULT false, is_companion boolean NOT NULL DEFAULT false,
        status seat_status NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX uq_seats_layout_label ON seats (layout_id, row_label, seat_number);
      CREATE UNIQUE INDEX uq_seats_layout_grid ON seats (layout_id, grid_row, grid_col);
    `);
    await q.query(`
      CREATE TABLE showtimes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE RESTRICT,
        screen_id uuid NOT NULL REFERENCES screens(id) ON DELETE RESTRICT,
        seat_layout_id uuid NOT NULL REFERENCES seat_layouts(id) ON DELETE RESTRICT,
        format show_format NOT NULL,
        language_code varchar(10) NOT NULL, subtitle_language_code varchar(10),
        start_at timestamptz NOT NULL, end_at timestamptz NOT NULL,
        base_price int NOT NULL CHECK (base_price >= 0),
        booking_opens_at timestamptz,
        booking_cutoff_minutes int NOT NULL DEFAULT 15 CHECK (booking_cutoff_minutes >= 0),
        status showtime_status NOT NULL DEFAULT 'SCHEDULED',
        status_reason varchar(255),
        created_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (end_at > start_at),
        CONSTRAINT ex_showtimes_no_overlap EXCLUDE USING gist
          (screen_id WITH =, tstzrange(start_at, end_at) WITH &&) WHERE (status IN ('SCHEDULED','BLOCKED'))
      );
      CREATE INDEX idx_showtimes_movie_start ON showtimes (movie_id, start_at);
      CREATE INDEX idx_showtimes_screen_start ON showtimes (screen_id, start_at);

      CREATE TABLE showtime_pricing (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
        seat_type_id uuid NOT NULL REFERENCES seat_types(id) ON DELETE RESTRICT,
        price int NOT NULL CHECK (price >= 0),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX uq_showtime_pricing ON showtime_pricing (showtime_id, seat_type_id);

      CREATE TABLE showtime_seats (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        showtime_id uuid NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
        seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
        price int NOT NULL CHECK (price >= 0),
        status showtime_seat_status NOT NULL DEFAULT 'AVAILABLE',
        held_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        held_until timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX uq_showtime_seat ON showtime_seats (showtime_id, seat_id);
      CREATE INDEX idx_showtime_seats_status ON showtime_seats (showtime_id, status);
      CREATE INDEX idx_showtime_seats_held_until ON showtime_seats (held_until) WHERE status = 'HELD';

      CREATE TABLE people (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(150) NOT NULL,
        slug varchar(160) NOT NULL UNIQUE,
        biography text, profile_image_url varchar(500), birth_date date,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_people_name" ON people (name);

      CREATE TABLE movie_credits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE RESTRICT,
        person_id uuid NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
        credit_type credit_type NOT NULL,
        character_name varchar(150),
        display_order int NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_movie_credits_movie_order ON movie_credits (movie_id, credit_type, display_order);
      CREATE INDEX "IDX_movie_credits_person_id" ON movie_credits (person_id);
      CREATE UNIQUE INDEX uq_movie_credits_identity
        ON movie_credits (movie_id, person_id, credit_type, COALESCE(character_name, ''));
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DROP TABLE movie_credits; DROP TABLE people;
      DROP TABLE showtime_seats; DROP TABLE showtime_pricing; DROP TABLE showtimes;
      DROP TABLE seats; DROP TABLE seat_layouts; DROP TABLE seat_types;
      DROP TABLE screen_maintenance; DROP TABLE screens; DROP TABLE cinema_images; DROP TABLE cinemas;
      DROP TYPE credit_type; DROP TYPE showtime_seat_status; DROP TYPE showtime_status; DROP TYPE seat_status;
      DROP TYPE seat_layout_status; DROP TYPE show_format; DROP TYPE screen_status;
      DROP TYPE cinema_image_type; DROP TYPE cinema_status;
    `);
  }
}
