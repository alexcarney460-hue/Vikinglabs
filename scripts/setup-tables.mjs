import pg from 'pg';
import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('.env.local', 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
console.log('Connecting to:', url.replace(/\/\/[^@]+@/, '//***:***@').slice(0, 80));

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const res = await client.query('SELECT NOW() as now, current_database() as db');
console.log('✅ Connected:', res.rows[0]);

console.log('\nCreating tables...');

const tables = [
  { name: 'orders', sql: `CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY, provider text NOT NULL, provider_order_id text NOT NULL,
    email text NOT NULL, amount_cents int NOT NULL, currency text NOT NULL,
    autoship boolean NOT NULL DEFAULT false, items jsonb NULL, created_at timestamptz NOT NULL)` },
  { name: 'order_items', sql: `CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL,
    product_id text NOT NULL, quantity int NOT NULL DEFAULT 1,
    unit_price numeric(12,2) NOT NULL DEFAULT 0, total_price numeric(12,2) NOT NULL DEFAULT 0)` },
  { name: 'refunds', sql: `CREATE TABLE IF NOT EXISTS refunds (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL, reason text, status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now())` },
  { name: 'affiliate_payouts', sql: `CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), affiliate_id text NOT NULL,
    amount numeric(12,2) NOT NULL, status text NOT NULL DEFAULT 'pending',
    period_start date, period_end date, created_at timestamptz NOT NULL DEFAULT now())` },
  { name: 'affiliate_applications', sql: `CREATE TABLE IF NOT EXISTS affiliate_applications (
    id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL,
    social_handle text NULL, audience_size text NULL, channels text NULL, notes text NULL,
    status text NOT NULL, code text NULL, signup_credit_cents int NOT NULL DEFAULT 0,
    commission_rate numeric NOT NULL DEFAULT 0.10, approved_at timestamptz NULL,
    expires_at timestamptz NULL, declined_at timestamptz NULL, requested_info_at timestamptz NULL,
    discord_user_id text NULL, created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL)` },
  { name: 'affiliate_clicks', sql: `CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id uuid PRIMARY KEY, affiliate_id uuid NULL, code text NULL,
    landing_path text NULL, referrer text NULL, user_agent text NULL, created_at timestamptz NOT NULL)` },
  { name: 'order_affiliates', sql: `CREATE TABLE IF NOT EXISTS order_affiliates (
    id uuid PRIMARY KEY, provider text NOT NULL, order_id text NOT NULL,
    affiliate_id uuid NULL, code text NULL, amount_cents int NULL,
    currency text NULL, metadata jsonb NULL, created_at timestamptz NOT NULL)` },
];

for (const t of tables) {
  await client.query(t.sql);
  console.log('  ✅', t.name);
}

// Indexes
const indexes = [
  'CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC)',
  'CREATE INDEX IF NOT EXISTS orders_provider_order_id_idx ON orders (provider_order_id)',
  'CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id)',
  'CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON refunds (order_id)',
  'CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_idx ON affiliate_payouts (affiliate_id)',
];
for (const idx of indexes) { await client.query(idx); }
console.log('  ✅ indexes');

const result = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
console.log('\n📋 All tables:', result.rows.map(r => r.table_name).join(', '));

await client.end();
console.log('\n✅ All done!');
