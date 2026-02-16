# Affiliate API Key Creation Fix

## Problem

The affiliate API key creation was failing with the error:
```
Database not available for API key creation
```

## Root Causes Identified

1. **Missing Supabase Table**: The `affiliate_api_keys` table did not exist in Supabase
2. **Faulty Fallback Logic**: When @vercel/postgres SQL query failed, it threw an error immediately instead of falling back to Supabase
3. **No Affiliate Validation**: The function didn't check if the affiliate existed or was approved before attempting to create a key
4. **Insufficient Logging**: No diagnostic logging to trace where the failure occurred

## Changes Made

### 1. Fixed `createAffiliateApiKey` Function (`src/lib/affiliates.ts`)

**Before:**
- Tried @vercel/postgres
- If SQL insert failed, threw error immediately (no fallback)
- Minimal logging

**After:**
- ✅ Added affiliate existence and approval validation upfront
- ✅ Comprehensive logging at every step
- ✅ Fixed fallback logic: SQL errors now log and continue to Supabase instead of throwing
- ✅ Added explicit UUID type casting in SQL query
- ✅ Clear error messages indicating which stage failed

### 2. Created Missing Database Table

**File:** `SUPABASE_FIX.sql`

Added the `affiliate_api_keys` table definition:
```sql
CREATE TABLE affiliate_api_keys (
  id uuid PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  hash text NOT NULL UNIQUE,
  last4 text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['read:affiliate'],
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL
);
```

With appropriate indexes for performance.

### 3. Created Test Script

**File:** `scripts/test-api-key-creation.ts`

A comprehensive test script that:
- Verifies Supabase connection
- Checks if `affiliate_api_keys` table exists
- Tests the complete API key creation flow
- Verifies the created key in the database

## How to Apply the Fix

### Step 1: Run SQL Migration

Open Supabase SQL Editor and run `SUPABASE_FIX.sql`:

```sql
-- Or run just the affiliate_api_keys table creation:
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
```

### Step 2: Verify Fix

Run the test script:

```bash
npx ts-node scripts/test-api-key-creation.ts
```

Expected output:
```
🔧 Testing Affiliate API Key Creation
═══════════════════════════════════════════
✅ Supabase client initialized
✅ Table affiliate_api_keys exists
✅ Found affiliate: [name] ([email])
✅ API key created successfully!
✅ Key verified in database
✅ All tests passed!
```

### Step 3: Test in UI

1. Log in as an approved affiliate
2. Navigate to `/account/affiliates`
3. Click on "API Keys" tab
4. Click "Create" button
5. API key should be created successfully

## Logging Output

With the new comprehensive logging, you'll see detailed output like:

```
[createAffiliateApiKey] Starting for affiliateId: 123e4567-e89b-12d3-a456-426614174000
[createAffiliateApiKey] Affiliate lookup result: { id: '...', status: 'approved', email: '...' }
[createAffiliateApiKey] Generated key data: { id: '...', affiliateId: '...', last4: 'ab12' }
[createAffiliateApiKey] getDb() returned: null
[createAffiliateApiKey] Attempting Supabase fallback...
[createAffiliateApiKey] getSupabase() returned: client
[createAffiliateApiKey] Inserting into Supabase with data: { ... }
[createAffiliateApiKey] Supabase insert successful: { ... }
```

## Testing Checklist

- [ ] SQL migration applied to Supabase
- [ ] Test script passes
- [ ] Can create API key via UI
- [ ] Created key appears in database
- [ ] Key can be used for Bearer auth
- [ ] Can revoke API key
- [ ] Logs show detailed diagnostic info

## Fallback Strategy

If database issues persist, the code now includes a JSON file fallback option (commented out but ready to implement):

```typescript
// Final fallback: store in JSON file for testing
const keyStore = await readJson<{ keys: AffiliateApiKey[] }>('affiliate-api-keys.json', { keys: [] });
keyStore.keys.push(newKey);
await writeJson('affiliate-api-keys.json', keyStore);
```

## Related Files

- `src/lib/affiliates.ts` - Main affiliate functions (createAffiliateApiKey, etc.)
- `src/app/api/affiliate/keys/route.ts` - API endpoint for key management
- `src/components/affiliate/AffiliateDashboard.tsx` - UI component
- `SUPABASE_FIX.sql` - Complete database schema
- `scripts/migrations/003_affiliate_api_keys.sql` - Just the API keys table
- `scripts/test-api-key-creation.ts` - Test script

## Notes

- The `formatApiKeyRow` function exists and works correctly
- UUID types are consistent across SQL and Supabase
- Scopes default to `['read:affiliate']`
- Keys are hashed with SHA256 before storage
- Only the last 4 characters of the plaintext key are stored for identification
