const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lfzzhgrtpkzxzcbvsvxu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmenpoZ3J0cGt6eHpjYnZzdnh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA5MzY2MywiZXhwIjoyMDg2NjY5NjYzfQ.CLfi0W75fX4WebmZtJKkP3o3iqWxftz3yZPhJeZbM9E'
);

(async () => {
  try {
    // Get the admin client for raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS affiliate_applications CASCADE;
        
        CREATE TABLE affiliate_applications (
          id uuid PRIMARY KEY,
          name text NOT NULL,
          email text NOT NULL,
          social_handle text NULL,
          audience_size text NULL,
          channels text NULL,
          notes text NULL,
          status text NOT NULL DEFAULT 'pending',
          code text NULL,
          signup_credit_cents int NOT NULL DEFAULT 0,
          commission_rate numeric NOT NULL DEFAULT 0.10,
          approved_at timestamptz NULL,
          expires_at timestamptz NULL,
          declined_at timestamptz NULL,
          requested_info_at timestamptz NULL,
          discord_user_id text NULL,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL,
          UNIQUE(code)
        );
        
        CREATE INDEX idx_affiliate_status ON affiliate_applications(status);
      `
    });

    if (error) {
      console.log('RPC ERROR:', error);
    } else {
      console.log('SCHEMA REBUILD SUCCESS');
    }
  } catch (err) {
    console.log('ERROR:', err.message);
  }
})();
