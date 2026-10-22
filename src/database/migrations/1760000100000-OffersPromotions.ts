import { MigrationInterface, QueryRunner } from 'typeorm';

export class OffersPromotions1760000100000 implements MigrationInterface {
  name = 'OffersPromotions1760000100000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TYPE offer_discount_type AS ENUM ('PERCENTAGE','FIXED_AMOUNT','BOGO');
      CREATE TYPE offer_status AS ENUM ('DRAFT','ACTIVE','PAUSED','ARCHIVED');
      CREATE TYPE offer_combine_mode AS ENUM ('EXCLUSIVE','STACKABLE');
      CREATE TYPE payment_method AS ENUM ('CREDIT_CARD','DEBIT_CARD','UPI','NET_BANKING','WALLET');
      CREATE TYPE card_network AS ENUM ('VISA','MASTERCARD','RUPAY','AMEX','DINERS');
      CREATE TYPE coupon_status AS ENUM ('ACTIVE','DISABLED');
      CREATE TYPE redemption_status AS ENUM ('RESERVED','CONFIRMED','RELEASED');

      CREATE TABLE offers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(150) NOT NULL,
        description text,
        discount_type offer_discount_type NOT NULL,
        discount_value int NOT NULL CHECK (discount_value > 0),
        max_discount_amount int CHECK (max_discount_amount > 0),
        min_order_amount int NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
        bogo_buy_qty int CHECK (bogo_buy_qty > 0),
        bogo_get_qty int CHECK (bogo_get_qty > 0),
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        eligible_days int[],
        eligible_start_time time,
        eligible_end_time time,
        combine_mode offer_combine_mode NOT NULL DEFAULT 'EXCLUSIVE',
        stack_group varchar(50),
        priority int NOT NULL DEFAULT 100,
        requires_coupon boolean NOT NULL DEFAULT false,
        is_public boolean NOT NULL DEFAULT true,
        total_usage_limit int CHECK (total_usage_limit > 0),
        per_customer_limit int CHECK (per_customer_limit > 0),
        status offer_status NOT NULL DEFAULT 'DRAFT',
        created_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (ends_at > starts_at),
        CHECK (discount_type = 'FIXED_AMOUNT' OR discount_value <= 10000),
        CHECK ((discount_type = 'BOGO') = (bogo_buy_qty IS NOT NULL AND bogo_get_qty IS NOT NULL)),
        CHECK ((eligible_start_time IS NULL) = (eligible_end_time IS NULL)),
        CHECK (eligible_days IS NULL OR eligible_days <@ ARRAY[0,1,2,3,4,5,6])
      );
      CREATE INDEX idx_offers_status_window ON offers (status, starts_at, ends_at);

      CREATE TABLE offer_cinemas (
        offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
        cinema_id uuid NOT NULL REFERENCES cinemas(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (offer_id, cinema_id)
      );
      CREATE INDEX "IDX_offer_cinemas_cinema_id" ON offer_cinemas (cinema_id);

      CREATE TABLE offer_movies (
        offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
        movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (offer_id, movie_id)
      );
      CREATE INDEX "IDX_offer_movies_movie_id" ON offer_movies (movie_id);

      CREATE TABLE offer_payment_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
        method payment_method,
        bank_code varchar(20),
        card_network card_network,
        card_bins text[] NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (method IS NOT NULL OR bank_code IS NOT NULL OR card_network IS NOT NULL OR cardinality(card_bins) > 0)
      );
      CREATE INDEX "IDX_offer_payment_rules_offer_id" ON offer_payment_rules (offer_id);

      CREATE TABLE coupons (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
        code varchar(32) NOT NULL UNIQUE,
        max_uses int CHECK (max_uses > 0),
        per_customer_limit int CHECK (per_customer_limit > 0),
        status coupon_status NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_coupons_offer_id" ON coupons (offer_id);

      CREATE TABLE offer_redemptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
        coupon_id uuid REFERENCES coupons(id) ON DELETE RESTRICT,
        customer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        booking_id uuid NOT NULL,
        discount_amount int NOT NULL CHECK (discount_amount >= 0),
        status redemption_status NOT NULL DEFAULT 'RESERVED',
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX uq_redemptions_booking_offer ON offer_redemptions (booking_id, offer_id);
      CREATE INDEX idx_redemptions_offer_customer ON offer_redemptions (offer_id, customer_id, status);
      CREATE INDEX idx_redemptions_offer_status ON offer_redemptions (offer_id, status);
      CREATE INDEX "IDX_offer_redemptions_coupon_id" ON offer_redemptions (coupon_id);
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      DROP TABLE offer_redemptions; DROP TABLE coupons; DROP TABLE offer_payment_rules;
      DROP TABLE offer_movies; DROP TABLE offer_cinemas; DROP TABLE offers;
      DROP TYPE redemption_status; DROP TYPE coupon_status; DROP TYPE card_network; DROP TYPE payment_method;
      DROP TYPE offer_combine_mode; DROP TYPE offer_status; DROP TYPE offer_discount_type;
    `);
  }
}
