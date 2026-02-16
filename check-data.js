const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  'https://lfzzhgrtpkzxzcbvsvxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmenpoZ3J0cGt6eHpjYnZzdnh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5MzY2MywiZXhwIjoyMDg2NjY5NjYzfQ.CLfi0W75fX4WebmZtJKkP3o3iqWxftz3yZPhJeZbM9E'
);

(async () => {
  try {
    // Check all applications
    const { data: all, error: err1 } = await supabase.from('affiliate_applications').select('*');
    console.log('ALL APPLICATIONS:', all?.length || 0);
    if (all && all.length > 0) {
      console.log(JSON.stringify(all, null, 2));
    }
    if (err1) console.log('Error:', err1.message);

    // Check approved only
    const { data: approved, error: err2 } = await supabase
      .from('affiliate_applications')
      .select('*')
      .eq('status', 'approved');
    console.log('\nAPPROVED APPLICATIONS:', approved?.length || 0);
    if (approved && approved.length > 0) {
      console.log(JSON.stringify(approved, null, 2));
    }
    if (err2) console.log('Error:', err2.message);

    // Try inserting a test record
    console.log('\nTesting insert...');
    const testId = crypto.randomUUID();
    const { data: inserted, error: insertErr } = await supabase
      .from('affiliate_applications')
      .insert([{
        id: testId,
        name: 'Test Affiliate',
        email: 'test@example.com',
        status: 'pending',
        signup_credit_cents: 0,
        commission_rate: 0.10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select();

    if (insertErr) {
      console.log('INSERT ERROR:', insertErr.message);
    } else {
      console.log('INSERT SUCCESS');
      
      // Clean up
      await supabase.from('affiliate_applications').delete().eq('id', testId);
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
})();
