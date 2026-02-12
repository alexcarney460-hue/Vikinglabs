ALTER TABLE affiliate_applications
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS signup_credit_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requested_info_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_applications_code_idx
  ON affiliate_applications (code)
  WHERE code IS NOT NULL;

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliate_applications(id) ON DELETE SET NULL,
  code TEXT,
  landing_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_clicks_code_idx
  ON affiliate_clicks (code, created_at DESC);

CREATE TABLE IF NOT EXISTS order_affiliates (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  order_id TEXT NOT NULL,
  affiliate_id UUID REFERENCES affiliate_applications(id) ON DELETE SET NULL,
  code TEXT,
  amount_cents INTEGER,
  currency TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_affiliates_provider_idx
  ON order_affiliates (provider, order_id);

CREATE INDEX IF NOT EXISTS order_affiliates_affiliate_idx
  ON order_affiliates (affiliate_id, created_at DESC);
