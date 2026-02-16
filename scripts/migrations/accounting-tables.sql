-- Accounting Tables Migration
-- Run this in Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/lfzzhgrtpkzxzcbvsvxu/sql/new

-- 1. Orders (main transaction table)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_order_id text,
  email text,
  amount_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  autoship boolean NOT NULL DEFAULT false,
  items jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (email);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_provider_idx ON orders (provider);

-- 2. Order Items (line items for each order)
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items (product_id);

-- 3. Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON refunds (order_id);
CREATE INDEX IF NOT EXISTS refunds_status_idx ON refunds (status);
CREATE INDEX IF NOT EXISTS refunds_created_at_idx ON refunds (created_at);

-- 4. Affiliate Payouts
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  period_start date,
  period_end date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_idx ON affiliate_payouts (affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_payouts_status_idx ON affiliate_payouts (status);

-- 5. Affiliate Applications (already exists from earlier migration, but ensure it's here)
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  social_url text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  referral_code text UNIQUE,
  discord_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_apps_email_idx ON affiliate_applications (email);
CREATE INDEX IF NOT EXISTS affiliate_apps_status_idx ON affiliate_applications (status);
CREATE INDEX IF NOT EXISTS affiliate_apps_referral_code_idx ON affiliate_applications (referral_code);

-- 6. Affiliate Referrals (tracking)
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliate_applications(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  visitor_id text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  commission_cents bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_referrals_code_idx ON affiliate_referrals (referral_code);
CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_id_idx ON affiliate_referrals (affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_referrals_order_id_idx ON affiliate_referrals (order_id);

-- 7. Page Views (traffic analytics)
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON page_views (path);
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at);
CREATE INDEX IF NOT EXISTS page_views_visitor_id_idx ON page_views (visitor_id);

-- Verify tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
