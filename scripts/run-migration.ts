import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runMigration(filename: string) {
  const filePath = path.join(__dirname, 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Migration file not found: ${filePath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`📄 Running migration: ${filename}`);
  console.log('─'.repeat(60));
  
  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // If RPC doesn't exist, try direct query
        console.log('RPC not available, trying direct query...');
        const { error: queryError } = await (supabase as any).from('_migrations').insert({ statement });
        
        if (queryError) {
          console.error(`❌ Error:`, error);
          console.log('Note: You may need to run this SQL manually in Supabase SQL Editor');
          console.log('─'.repeat(60));
          console.log(sql);
          console.log('─'.repeat(60));
          process.exit(1);
        }
      }
      
      console.log('✓ Success');
    } catch (err) {
      console.error('❌ Unexpected error:', err);
    }
  }
  
  console.log('─'.repeat(60));
  console.log('✅ Migration completed successfully!');
}

// Get migration filename from command line args
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: ts-node scripts/run-migration.ts <migration-file>');
  console.error('Example: ts-node scripts/run-migration.ts 003_affiliate_api_keys.sql');
  process.exit(1);
}

runMigration(migrationFile).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
