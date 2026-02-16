const fs = require('fs');
const lines = fs.readFileSync('.env.local','utf8').split('\n');
const env = {};
lines.forEach(l => { const m = l.match(/^([^#=]+)=(.+)/); if(m) env[m[1].trim()] = m[2].trim(); });

const key = env.SUPABASE_SERVICE_ROLE_KEY;
const url = env.SUPABASE_URL;

const sql = `
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
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  product_id text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  amount numeric(12,2) NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON refunds (order_id);
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
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliate_applications(id),
  referral_code text NOT NULL,
  visitor_id text,
  order_id uuid REFERENCES orders(id),
  commission_cents bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS affiliate_referrals_code_idx ON affiliate_referrals (referral_code);
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_views_path_idx ON page_views (path);
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at);
`;

async function run() {
  // Try pg-meta query endpoint (used by Supabase Studio internally)
  const endpoints = [
    '/pg-meta/default/query',
    '/pg/query',
  ];
  
  for (const ep of endpoints) {
    try {
      const r = await fetch(url + ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'x-connection-encrypted': 'false',
        },
        body: JSON.stringify({ query: sql })
      });
      const text = await r.text();
      console.log(ep + ':', r.status, text.substring(0, 300));
      if (r.ok) {
        console.log('SUCCESS!');
        return;
      }
    } catch(e) {
      console.log(ep + ': error', e.message);
    }
  }
  
  // Last resort: try using the Supabase Table Editor REST API to create tables one by one
  console.log('\nTrying Supabase Table Editor API...');
  const tablePayload = {
    name: 'orders',
    schema: 'public',
    columns: [
      { name: 'id', type: 'uuid', is_nullable: false, is_primary_key: true, default_value: 'gen_random_uuid()' },
      { name: 'provider', type: 'text', is_nullable: false },
      { name: 'provider_order_id', type: 'text', is_nullable: true },
      { name: 'email', type: 'text', is_nullable: true },
      { name: 'amount_cents', type: 'int8', is_nullable: false, default_value: '0' },
      { name: 'currency', type: 'text', is_nullable: false, default_value: "'USD'" },
      { name: 'autoship', type: 'bool', is_nullable: false, default_value: 'false' },
      { name: 'items', type: 'jsonb', is_nullable: true },
      { name: 'created_at', type: 'timestamptz', is_nullable: false, default_value: 'now()' },
    ]
  };
  
  const tableEndpoints = [
    '/pg-meta/default/tables',
    '/pg/tables',
  ];
  
  for (const ep of tableEndpoints) {
    try {
      const r = await fetch(url + ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': 'Bearer ' + key,
        },
        body: JSON.stringify(tablePayload)
      });
      const text = await r.text();
      console.log(ep + ':', r.status, text.substring(0, 300));
      if (r.ok) {
        console.log('Table creation via REST works!');
        return;
      }
    } catch(e) {
      console.log(ep + ': error', e.message);
    }
  }
  
  console.log('\n=== BLOCKER ===');
  console.log('Cannot create tables. Need one of:');
  console.log('1. Database password (for direct pg connection)');
  console.log('2. Supabase Management API access token');
  console.log('3. Manual SQL execution via Supabase Dashboard');
}

run();
