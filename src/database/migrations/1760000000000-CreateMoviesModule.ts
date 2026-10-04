import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMoviesModule1760000000000 implements MigrationInterface {
  name = 'CreateMoviesModule1760000000000';

  public async up(q: QueryRunner): Promise<void> {
    const ts = `created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()`;
    const id = `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`;

    await q.query(`CREATE TABLE age_ratings (${id}, code varchar(10) NOT NULL, label varchar(60) NOT NULL,
      min_age int NOT NULL, ${ts}, CONSTRAINT uq_age_ratings_code UNIQUE (code), CONSTRAINT chk_age_ratings_min_age CHECK (min_age >= 0))`);
    await q.query(`CREATE TABLE genres (${id}, name varchar(60) NOT NULL, slug varchar(80) NOT NULL, ${ts},
      CONSTRAINT uq_genres_name UNIQUE (name), CONSTRAINT uq_genres_slug UNIQUE (slug))`);
    await q.query(`CREATE TABLE languages (${id}, code varchar(10) NOT NULL, name varchar(60) NOT NULL, ${ts},
      CONSTRAINT uq_languages_code UNIQUE (code))`);
    await q.query(`CREATE TABLE formats (${id}, code varchar(20) NOT NULL, name varchar(60) NOT NULL, ${ts},
      CONSTRAINT uq_formats_code UNIQUE (code))`);
    await q.query(`CREATE TABLE people (${id}, name varchar(200) NOT NULL, biography text,
      profile_image_url varchar(500), ${ts})`);
    await q.query(`CREATE INDEX idx_people_name ON people (name)`);

    await q.query(`CREATE TABLE movies (${id},
      title varchar(200) NOT NULL, slug varchar(255) NOT NULL, synopsis text NOT NULL,
      runtime_min int NOT NULL, release_date date NOT NULL,
      age_rating_id uuid NOT NULL REFERENCES age_ratings (id) ON DELETE RESTRICT,
      trailer_url varchar(500), status varchar(20) NOT NULL DEFAULT 'DRAFT',
      is_featured boolean NOT NULL DEFAULT false, featured_order int,
      publish_at timestamptz, unpublish_at timestamptz, published_at timestamptz, archived_at timestamptz,
      created_by uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT, ${ts},
      CONSTRAINT uq_movies_slug UNIQUE (slug),
      CONSTRAINT chk_movies_runtime CHECK (runtime_min BETWEEN 1 AND 600),
      CONSTRAINT chk_movies_status CHECK (status IN ('DRAFT','PUBLISHED','NOW_SHOWING','COMING_SOON','ARCHIVED')),
      CONSTRAINT chk_movies_featured_visible CHECK (NOT is_featured OR status IN ('PUBLISHED','NOW_SHOWING','COMING_SOON')),
      CONSTRAINT chk_movies_schedule_order CHECK (publish_at IS NULL OR unpublish_at IS NULL OR unpublish_at > publish_at))`);
    await q.query(`CREATE INDEX idx_movies_status_release ON movies (status, release_date)`);
    await q.query(`CREATE INDEX idx_movies_featured ON movies (featured_order) WHERE is_featured = true`);
    await q.query(`CREATE INDEX idx_movies_publish_at ON movies (publish_at) WHERE publish_at IS NOT NULL AND status = 'DRAFT'`);
    await q.query(`CREATE INDEX idx_movies_unpublish_at ON movies (unpublish_at) WHERE unpublish_at IS NOT NULL`);

    await q.query(`CREATE TABLE movie_genres (
      movie_id uuid NOT NULL REFERENCES movies (id) ON DELETE RESTRICT,
      genre_id uuid NOT NULL REFERENCES genres (id) ON DELETE RESTRICT, PRIMARY KEY (movie_id, genre_id))`);
    await q.query(`CREATE INDEX idx_movie_genres_genre ON movie_genres (genre_id)`);
    await q.query(`CREATE TABLE movie_formats (
      movie_id uuid NOT NULL REFERENCES movies (id) ON DELETE RESTRICT,
      format_id uuid NOT NULL REFERENCES formats (id) ON DELETE RESTRICT, PRIMARY KEY (movie_id, format_id))`);
    await q.query(`CREATE INDEX idx_movie_formats_format ON movie_formats (format_id)`);

    await q.query(`CREATE TABLE movie_languages (${id},
      movie_id uuid NOT NULL REFERENCES movies (id) ON DELETE RESTRICT,
      language_id uuid NOT NULL REFERENCES languages (id) ON DELETE RESTRICT,
      language_type varchar(10) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT chk_movie_languages_type CHECK (language_type IN ('AUDIO','SUBTITLE')),
      CONSTRAINT uq_movie_languages_movie_lang_type UNIQUE (movie_id, language_id, language_type))`);
    await q.query(`CREATE INDEX idx_movie_languages_language ON movie_languages (language_id)`);

    await q.query(`CREATE TABLE movie_credits (${id},
      movie_id uuid NOT NULL REFERENCES movies (id) ON DELETE RESTRICT,
      person_id uuid NOT NULL REFERENCES people (id) ON DELETE RESTRICT,
      credit_type varchar(20) NOT NULL, character_name varchar(150),
      display_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT chk_movie_credits_type CHECK (credit_type IN ('DIRECTOR','CAST','WRITER','PRODUCER','CINEMATOGRAPHER')),
      CONSTRAINT uq_movie_credits_movie_person_type UNIQUE (movie_id, person_id, credit_type))`);
    await q.query(`CREATE INDEX idx_movie_credits_movie_order ON movie_credits (movie_id, display_order)`);
    await q.query(`CREATE INDEX idx_movie_credits_person ON movie_credits (person_id)`);

    await q.query(`CREATE TABLE movie_assets (${id},
      movie_id uuid NOT NULL REFERENCES movies (id) ON DELETE RESTRICT,
      asset_type varchar(10) NOT NULL, url varchar(500) NOT NULL, storage_key varchar(300) NOT NULL,
      mime_type varchar(50) NOT NULL, size_bytes int NOT NULL, ${ts},
      CONSTRAINT chk_movie_assets_type CHECK (asset_type IN ('POSTER','BANNER','HEADER')),
      CONSTRAINT uq_movie_assets_movie_type UNIQUE (movie_id, asset_type))`);

    await q.query(`CREATE TABLE movie_status_history (${id},
      movie_id uuid NOT NULL REFERENCES movies (id) ON DELETE RESTRICT,
      old_status varchar(20), new_status varchar(20) NOT NULL,
      changed_by uuid REFERENCES users (id) ON DELETE RESTRICT, reason varchar(255),
      created_at timestamptz NOT NULL DEFAULT now())`);
    await q.query(`CREATE INDEX idx_movie_status_history_movie ON movie_status_history (movie_id, created_at)`);

    await this.seed(q);
  }

  public async down(q: QueryRunner): Promise<void> {
    const tables = [
      'movie_status_history', 'movie_assets', 'movie_credits', 'movie_languages',
      'movie_formats', 'movie_genres', 'movies', 'people', 'formats', 'languages', 'genres', 'age_ratings',
    ];
    for (const table of tables) await q.query(`DROP TABLE IF EXISTS ${table}`);
  }

  private async seed(q: QueryRunner): Promise<void> {
    await q.query(`INSERT INTO age_ratings (code, label, min_age) VALUES
      ('U','Universal',0),('UA7','Parental guidance 7+',7),('UA13','Parental guidance 13+',13),
      ('UA16','Parental guidance 16+',16),('A','Adults only',18),('S','Special audiences',18)`);
    await q.query(`INSERT INTO formats (code, name) VALUES
      ('2D','2D'),('3D','3D'),('IMAX','IMAX'),('IMAX_3D','IMAX 3D'),('4DX','4DX'),('DBOX','D-BOX')`);
    await q.query(`INSERT INTO languages (code, name) VALUES
      ('en','English'),('hi','Hindi'),('ta','Tamil'),('te','Telugu'),('ml','Malayalam'),
      ('kn','Kannada'),('bn','Bengali'),('mr','Marathi'),('pa','Punjabi'),('gu','Gujarati')`);
  }
}
