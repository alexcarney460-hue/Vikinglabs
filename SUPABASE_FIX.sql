-- Drop old incomplete table
DROP TABLE IF EXISTS affiliate_applications CASCADE;

-- Create the correct schema
CREATE TABLE affiliate_applications (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  social_handle text NULL,
  audience_size text NULL,
  channels text NULL,
  notes text NULL,
  status text NOT NULL DEFAULT 'pending',
  code text NULL UNIQUE,
  signup_credit_cents int NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0.10,
  approved_at timestamptz NULL,
  expires_at timestamptz NULL,
  declined_at timestamptz NULL,
  requested_info_at timestamptz NULL,
  discord_user_id text NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX idx_affiliate_status ON affiliate_applications(status);
CREATE INDEX idx_affiliate_code ON affiliate_applications(code);

-- Recreate other affiliate tables
DROP TABLE IF EXISTS affiliate_clicks CASCADE;
CREATE TABLE affiliate_clicks (
  id uuid PRIMARY KEY,
  affiliate_id uuid NULL REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  code text NULL,
  landing_path text NULL,
  referrer text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL
);

DROP TABLE IF EXISTS order_affiliates CASCADE;
CREATE TABLE order_affiliates (
  id uuid PRIMARY KEY,
  provider text NOT NULL,
  order_id text NOT NULL,
  affiliate_id uuid NULL REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  code text NULL,
  amount_cents int NULL,
  currency text NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL
);

DROP TABLE IF EXISTS affiliate_conversions CASCADE;
CREATE TABLE affiliate_conversions (
  id uuid PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  amount_cents int NOT NULL,
  commission_cents int NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL
);

DROP TABLE IF EXISTS affiliate_payouts CASCADE;
CREATE TABLE affiliate_payouts (
  id uuid PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  amount_cents int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reference text NULL,
  created_at timestamptz NOT NULL
);
