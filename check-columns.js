const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfzzhgrtpkzxzcbvsvxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmenpoZ3J0cGt6eHpjYnZzdnh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5MzY2MywiZXhwIjoyMDg2NjY5NjYzfQ.CLfi0W75fX4WebmZtJKkP3o3iqWxftz3yZPhJeZbM9E'
);

(async () => {
  try {
    // Try to read with limited columns to see what exists
    const { data, error } = await supabase
      .from('affiliate_applications')
      .select('*')
      .limit(1);

    if (error) {
      console.log('ERROR:', error.message);
    } else {
      if (data.length > 0) {
        console.log('EXISTING RECORD COLUMNS:');
        console.log(Object.keys(data[0]));
      } else {
        console.log('Table exists but is empty');
        
        // Try to insert with just basic columns
        const { error: insertErr } = await supabase.from('affiliate_applications').insert([{
          id: 'test-' + Date.now(),
          name: 'Test',
          email: 'test@test.com',
          status: 'pending',
          signup_credit_cents: 0,
          commission_rate: 0.10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
        
        if (insertErr) {
          console.log('INSERT ERROR:', insertErr.message);
        } else {
          console.log('Basic insert worked - now check what columns are missing');
        }
      }
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
})();
