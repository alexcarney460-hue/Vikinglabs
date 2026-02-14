# Accounting Dashboard Migration to Supabase

## Status: ⚠️ BLOCKED - Tables Need Creation

### What's Done ✅

1. **Installed @supabase/supabase-js** - Supabase client library
2. **Created `src/lib/supabase.ts`** - Supabase client initialization
3. **Updated `src/lib/db.ts`** - Now supports Supabase alongside @vercel/postgres
4. **Rewrote `src/lib/admin/accounting.ts`** - Complete rewrite using Supabase query builder (no raw SQL)
5. **Updated `src/lib/orders.ts`** - Now uses Supabase for order storage
6. **Generated SQL migration** - `accounting-tables.sql` ready to run

### What's Blocked 🚫

**Cannot create tables programmatically** because:
- Service role key only grants PostgREST access (data operations)
- DDL (CREATE TABLE) requires either:
  - Database password (not provided in .env)
  - Supabase Management API access token (different from service_role key)
  - Manual execution via Supabase Dashboard SQL Editor

### How to Unblock 🚀

**Option 1: Manual SQL Execution (RECOMMENDED)**

1. Go to: https://supabase.com/dashboard/project/lfzzhgrtpkzxzcbvsvxu/sql/new
2. Copy contents of `scripts/migrations/accounting-tables.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify: You should see "Command completed" for each table

**Option 2: Get Database Password**

If you have the database password:

1. Add to `.env.local`:
   ```
   POSTGRES_URL=postgresql://postgres.[ref]:[password]@db.lfzzhgrtpkzxzcbvsvxu.supabase.co:5432/postgres
   ```
2. Run: `node scripts/create-tables.js`

**Option 3: Management API Token**

1. Get token from: https://supabase.com/dashboard/account/tokens
2. Use with Management API to execute SQL

### Testing After Migration

Run the test script:

```bash
node scripts/test-accounting.js
```

This will:
- Check if all 7 tables exist
- Insert a test order
- Run sample queries
- Verify aggregation works

### Expected Tables

1. **orders** - Main transaction records
2. **order_items** - Line items per order
3. **refunds** - Refund requests and status
4. **affiliate_payouts** - Payout tracking
5. **affiliate_applications** - Affiliate signups
6. **affiliate_referrals** - Referral tracking
7. **page_views** - Traffic analytics

### Environment Variables Required

Already configured in `.env.local`:

```bash
SUPABASE_URL=https://lfzzhgrtpkzxzcbvsvxu.supabase.co
SUPABASE_ANON_KEY=sb_publishable_FGmBD60KD9zsgCbERodRSA_a1FnwVO4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (JWT token)
```

### Accounting Dashboard Routes

Once tables are created, these routes will work:

- `/account/admin/accounting` - Overview
- `/account/admin/accounting/orders` - Order history
- `/account/admin/accounting/refunds` - Refund management
- `/account/admin/accounting/affiliates` - Affiliate payouts
- `/account/admin/accounting/products` - Product revenue
- `/account/admin/accounting/customers` - Customer LTV
- `/account/admin/accounting/reports` - Financial reports

### API Endpoints

All rewritten to use Supabase:

- `GET /api/admin/accounting/summary` - Dashboard summary
- `GET /api/admin/accounting/orders` - Paginated orders
- `GET /api/admin/accounting/refunds` - Refund list
- `GET /api/admin/accounting/affiliates` - Payout list
- `GET /api/admin/accounting/products` - Revenue per product
- `GET /api/admin/accounting/customers` - Customer metrics
- `GET /api/admin/accounting/reports` - Date-range reports
- `GET /api/admin/accounting/export` - CSV/PDF export

### Code Changes Summary

**Files Created:**
- `src/lib/supabase.ts` - Supabase client wrapper

**Files Modified:**
- `src/lib/db.ts` - Added Supabase support
- `src/lib/admin/accounting.ts` - Complete rewrite (raw SQL → Supabase query builder)
- `src/lib/orders.ts` - Now uses Supabase first, falls back to @vercel/postgres

**Files Still Using @vercel/postgres (not critical for accounting):**
- `src/lib/affiliates.ts`
- `src/lib/library.ts`
- `src/lib/products-admin.ts`
- `src/lib/products-storage.ts`
- `src/lib/traffic.ts`

These can be migrated later if needed.

### Next Steps After Tables Are Created

1. Run `node scripts/test-accounting.js` to verify
2. Start dev server: `npm run dev`
3. Navigate to: http://localhost:3000/account/admin/accounting
4. Test each accounting page
5. Verify data queries work
6. Test export functionality

### Rollback Plan

If you need to rollback:

1. Tables won't interfere with existing code (they're new)
2. Old `@vercel/postgres` code in `db.ts` still works
3. Can drop tables: `DROP TABLE IF EXISTS orders CASCADE;` (etc.)

### Support

If issues persist after creating tables:

1. Check browser console for errors
2. Check server logs: `npm run dev` output
3. Verify env vars loaded: Add `console.log(process.env.SUPABASE_URL)` to test
4. Run test script again: `node scripts/test-accounting.js`
