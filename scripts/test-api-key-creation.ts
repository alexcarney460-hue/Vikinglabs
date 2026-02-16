#!/usr/bin/env ts-node
/**
 * Test script for affiliate API key creation
 * 
 * This script tests the complete flow:
 * 1. Connects to Supabase
 * 2. Verifies affiliate_api_keys table exists
 * 3. Tests createAffiliateApiKey function
 * 4. Cleans up test data
 */

import * as dotenv from 'dotenv';
import { getSupabase } from '../src/lib/supabase';
import { createAffiliateApiKey, getAffiliateByEmail } from '../src/lib/affiliates';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('🔧 Testing Affiliate API Key Creation');
  console.log('═'.repeat(60));
  
  // Step 1: Check Supabase connection
  console.log('\n📡 Step 1: Checking Supabase connection...');
  const supabase = getSupabase();
  
  if (!supabase) {
    console.error('❌ Supabase client not available');
    console.error('Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }
  console.log('✅ Supabase client initialized');
  
  // Step 2: Verify affiliate_api_keys table exists
  console.log('\n📊 Step 2: Verifying affiliate_api_keys table...');
  try {
    const { data, error } = await supabase
      .from('affiliate_api_keys')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.error('❌ Table affiliate_api_keys does not exist!');
        console.error('\n📝 Please run the following SQL in Supabase SQL Editor:');
        console.error('─'.repeat(60));
        console.error(`
CREATE TABLE IF NOT EXISTS affiliate_api_keys (
  id uuid PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  hash text NOT NULL UNIQUE,
  last4 text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['read:affiliate'],
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_affiliate ON affiliate_api_keys(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON affiliate_api_keys(hash) WHERE revoked_at IS NULL;
        `);
        console.error('─'.repeat(60));
        console.error('\nOr run the complete migration: SUPABASE_FIX.sql');
        process.exit(1);
      }
      throw error;
    }
    console.log('✅ Table affiliate_api_keys exists');
  } catch (err) {
    console.error('❌ Error checking table:', err);
    process.exit(1);
  }
  
  // Step 3: Check for test affiliate
  console.log('\n👤 Step 3: Looking for approved affiliate...');
  const testEmail = process.env.ADMIN_EMAIL || 'gardenablaze@gmail.com';
  
  let affiliate = await getAffiliateByEmail(testEmail);
  
  if (!affiliate) {
    console.log(`⚠️  No approved affiliate found with email: ${testEmail}`);
    console.log('Looking for any approved affiliate...');
    
    const { data: approvedAffiliates, error } = await supabase
      .from('affiliate_applications')
      .select('*')
      .eq('status', 'approved')
      .limit(1);
    
    if (error || !approvedAffiliates || approvedAffiliates.length === 0) {
      console.error('❌ No approved affiliates found in database');
      console.error('Please approve at least one affiliate before testing API key creation');
      process.exit(1);
    }
    
    affiliate = {
      id: approvedAffiliates[0].id,
      name: approvedAffiliates[0].name,
      email: approvedAffiliates[0].email,
      status: approvedAffiliates[0].status,
      code: approvedAffiliates[0].code,
      socialHandle: approvedAffiliates[0].social_handle,
      audienceSize: approvedAffiliates[0].audience_size,
      channels: approvedAffiliates[0].channels,
      notes: approvedAffiliates[0].notes,
      signupCreditCents: approvedAffiliates[0].signup_credit_cents,
      commissionRate: approvedAffiliates[0].commission_rate,
      approvedAt: approvedAffiliates[0].approved_at,
      expiresAt: approvedAffiliates[0].expires_at,
      declinedAt: approvedAffiliates[0].declined_at,
      requestedInfoAt: approvedAffiliates[0].requested_info_at,
      discordUserId: approvedAffiliates[0].discord_user_id,
      createdAt: approvedAffiliates[0].created_at,
      updatedAt: approvedAffiliates[0].updated_at,
    };
  }
  
  console.log(`✅ Found affiliate: ${affiliate.name} (${affiliate.email})`);
  console.log(`   Status: ${affiliate.status}`);
  console.log(`   ID: ${affiliate.id}`);
  
  // Step 4: Test API key creation
  console.log('\n🔑 Step 4: Testing API key creation...');
  try {
    const result = await createAffiliateApiKey(affiliate.id);
    console.log('✅ API key created successfully!');
    console.log(`   Key ID: ${result.keyRecord.id}`);
    console.log(`   Last 4: ${result.keyRecord.last4}`);
    console.log(`   Full key: ${result.key.substring(0, 20)}...`);
    console.log(`   Scopes: ${result.keyRecord.scopes.join(', ')}`);
    
    // Step 5: Verify in database
    console.log('\n🔍 Step 5: Verifying key in database...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('affiliate_api_keys')
      .select('*')
      .eq('id', result.keyRecord.id)
      .single();
    
    if (verifyError || !verifyData) {
      console.error('❌ Failed to verify key in database:', verifyError);
      process.exit(1);
    }
    
    console.log('✅ Key verified in database');
    console.log(`   Affiliate ID: ${verifyData.affiliate_id}`);
    console.log(`   Hash length: ${verifyData.hash.length}`);
    console.log(`   Created at: ${verifyData.created_at}`);
    
    // Step 6: Cleanup (optional - ask user)
    console.log('\n🧹 Step 6: Cleanup test data');
    console.log('⚠️  Leaving test key in database for now');
    console.log(`   To delete manually, run: DELETE FROM affiliate_api_keys WHERE id = '${result.keyRecord.id}';`);
    
  } catch (err) {
    console.error('❌ API key creation failed:', err);
    if (err instanceof Error) {
      console.error('   Error message:', err.message);
      console.error('   Stack:', err.stack);
    }
    process.exit(1);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ All tests passed!');
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
