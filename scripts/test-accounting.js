// Test script to verify accounting tables and queries
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const lines = fs.readFileSync('.env.local','utf8').split('\n');
const env = {};
lines.forEach(l => { const m = l.match(/^([^#=]+)=(.+)/); if(m) env[m[1].trim()] = m[2].trim(); });

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('🔍 Testing Accounting Dashboard Setup...\n');

  // Check if tables exist
  const tables = [
    'orders',
    'order_items',
    'refunds',
    'affiliate_payouts',
    'affiliate_applications',
    'affiliate_referrals',
    'page_views'
  ];

  console.log('1️⃣  Checking tables...');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: exists (${data.length} rows)`);
    }
  }

  // Try inserting a test order
  console.log('\n2️⃣  Testing order insert...');
  const testOrder = {
    id: '00000000-0000-0000-0000-000000000001',
    provider: 'stripe',
    provider_order_id: 'test_12345',
    email: 'test@example.com',
    amount_cents: 9999,
    currency: 'USD',
    autoship: false,
    items: [{ product_id: 'test-product', quantity: 1, price: 9999 }],
  };

  const { error: insertError } = await supabase
    .from('orders')
    .upsert(testOrder, { onConflict: 'id' });

  if (insertError) {
    console.log(`   ❌ Insert failed: ${insertError.message}`);
  } else {
    console.log('   ✅ Test order inserted');
  }

  // Try querying orders
  console.log('\n3️⃣  Testing order query...');
  const { data: orders, error: queryError } = await supabase
    .from('orders')
    .select('id, provider, email, amount_cents')
    .limit(5);

  if (queryError) {
    console.log(`   ❌ Query failed: ${queryError.message}`);
  } else {
    console.log(`   ✅ Query successful: ${orders.length} orders found`);
    if (orders.length > 0) {
      console.log('   Sample:', JSON.stringify(orders[0], null, 2));
    }
  }

  // Try aggregation query (like the accounting summary)
  console.log('\n4️⃣  Testing aggregation query...');
  const { data: allOrders, error: aggError } = await supabase
    .from('orders')
    .select('amount_cents');

  if (aggError) {
    console.log(`   ❌ Aggregation failed: ${aggError.message}`);
  } else {
    const totalRevenue = (allOrders || []).reduce((s, o) => s + Number(o.amount_cents), 0) / 100;
    console.log(`   ✅ Aggregation successful: $${totalRevenue.toFixed(2)} total revenue`);
  }

  console.log('\n✨ Test complete!');
  console.log('\n📊 Accounting Dashboard Status:');
  
  const allTablesExist = await Promise.all(
    tables.map(async t => {
      const { error } = await supabase.from(t).select('id').limit(1);
      return !error;
    })
  );

  if (allTablesExist.every(Boolean)) {
    console.log('   ✅ ALL TABLES EXIST - Dashboard should be LIVE!');
    console.log('   🚀 Visit: http://localhost:3000/account/admin/accounting');
  } else {
    console.log('   ❌ Some tables missing - run accounting-tables.sql first');
    console.log('   📝 File: scripts/migrations/accounting-tables.sql');
    console.log('   🔗 Dashboard: https://supabase.com/dashboard/project/lfzzhgrtpkzxzcbvsvxu/sql/new');
  }
}

test().catch(console.error);
