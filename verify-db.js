const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfzzhgrtpkzxzcbvsvxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmenpoZ3J0cGt6eHpjYnZzdnh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5MzY2MywiZXhwIjoyMDg2NjY5NjYzfQ.CLfi0W75fX4WebmZtJKkP3o3iqWxftz3yZPhJeZbM9E'
);

(async () => {
  try {
    // Try to insert a test record
    const testRecord = {
      id: 'test-' + Date.now(),
      name: 'Test Affiliate',
      email: 'test@example.com',
      social_handle: null,
      audience_size: null,
      channels: null,
      notes: null,
      status: 'pending',
      code: null,
      signup_credit_cents: 0,
      commission_rate: 0.10,
      approved_at: null,
      expires_at: null,
      declined_at: null,
      requested_info_at: null,
      discord_user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('affiliate_applications')
      .insert([testRecord])
      .select();

    if (error) {
      console.log('INSERT ERROR:', error.message);
    } else {
      console.log('INSERT SUCCESS:', data);
      
      // Now try to read it back
      const { data: read, error: readErr } = await supabase
        .from('affiliate_applications')
        .select('*')
        .eq('id', testRecord.id);
      
      if (readErr) {
        console.log('READ ERROR:', readErr.message);
      } else {
        console.log('READ SUCCESS:', read);
      }

      // Clean up
      await supabase.from('affiliate_applications').delete().eq('id', testRecord.id);
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
})();
