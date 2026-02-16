const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfzzhgrtpkzxzcbvsvxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmenpoZ3J0cGt6eHpjYnZzdnh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5MzY2MywiZXhwIjoyMDg2NjY5NjYzfQ.CLfi0W75fX4WebmZtJKkP3o3iqWxftz3yZPhJeZbM9E'
);

(async () => {
  try {
    // Simulate the createAffiliateApplication function
    const now = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(),
      name: 'Test Affiliate Name',
      email: 'test-' + Date.now() + '@example.com',
      social_handle: 'testhandle',
      audience_size: '10k-50k',
      channels: 'Twitter, TikTok',
      notes: 'Testing affiliate submission',
      status: 'pending',
      code: null,
      signup_credit_cents: 0,
      commission_rate: 0.10,
      approved_at: null,
      expires_at: null,
      declined_at: null,
      requested_info_at: null,
      discord_user_id: null,
      created_at: now,
      updated_at: now,
    };

    console.log('Inserting affiliate:', record.id, record.email);

    const { data, error } = await supabase.from('affiliate_applications').insert([record]).select();

    if (error) {
      console.log('INSERT ERROR:', error.message);
      console.log('Full error:', error);
    } else {
      console.log('INSERT SUCCESS');
      console.log('Inserted:', data);

      // Now try to read it back
      const { data: read, error: readErr } = await supabase
        .from('affiliate_applications')
        .select('*')
        .eq('id', record.id);

      if (readErr) {
        console.log('READ ERROR:', readErr.message);
      } else {
        console.log('READ SUCCESS:', read);
      }

      // Now test the approve flow
      console.log('\n--- Testing approval flow ---');
      const { data: updated, error: updateErr } = await supabase
        .from('affiliate_applications')
        .update({
          status: 'approved',
          code: 'TESTHANDLE-001',
          approved_at: now,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: now,
        })
        .eq('id', record.id)
        .select();

      if (updateErr) {
        console.log('UPDATE ERROR:', updateErr.message);
      } else {
        console.log('UPDATE SUCCESS');
        console.log('Updated:', updated);
      }

      // Query by status = 'approved'
      console.log('\n--- Querying approved affiliates ---');
      const { data: approved, error: approvedErr } = await supabase
        .from('affiliate_applications')
        .select('*')
        .eq('status', 'approved');

      if (approvedErr) {
        console.log('APPROVED QUERY ERROR:', approvedErr.message);
      } else {
        console.log('APPROVED QUERY SUCCESS:', approved?.length, 'records');
        if (approved && approved.length > 0) {
          console.log(JSON.stringify(approved[0], null, 2));
        }
      }

      // Clean up
      console.log('\n--- Cleanup ---');
      await supabase.from('affiliate_applications').delete().eq('id', record.id);
      console.log('Cleaned up test record');
    }
  } catch (err) {
    console.log('ERROR:', err.message);
    console.log(err);
  }
})();
