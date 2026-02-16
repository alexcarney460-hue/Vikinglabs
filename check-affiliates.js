const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfzzhgrtpkzxzcbvsvxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmenpoZ3J0cGt6eHpjYnZzdnh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5MzY2MywiZXhwIjoyMDg2NjY5NjYzfQ.CLfi0W75fX4WebmZtJKkP3o3iqWxftz3yZPhJeZbM9E'
);

(async () => {
  // Check all applications
  const { data: all, error: err1 } = await supabase.from('affiliate_applications').select('*');
  console.log('ALL APPLICATIONS:');
  console.log(JSON.stringify(all, null, 2));
  if (err1) console.log('Error:', err1);

  // Check approved only
  const { data: approved, error: err2 } = await supabase
    .from('affiliate_applications')
    .select('*')
    .eq('status', 'approved');
  console.log('\nAPPROVED APPLICATIONS:');
  console.log(JSON.stringify(approved, null, 2));
  if (err2) console.log('Error:', err2);
})();
