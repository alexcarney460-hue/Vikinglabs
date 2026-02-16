# Affiliate Dashboard - Complete Guide

## Overview

The Affiliate Dashboard is a **lab-grade** system for managing the Viking Labs affiliate program. It enables:

- **Approved affiliates** to view sales, commissions, and payout history
- **Easy sharing** with personalized affiliate codes and links
- **Professional toolkit** with brand assets, copy templates, and content guidelines
- **Admin controls** for approving/declining applications and setting commission rates

## Architecture

### Data Model

**Tables:**
- `affiliate_applications` — Application + approval status + code + commission rate
- `affiliate_conversions` — Orders attributed to each affiliate (amount, commission, status)
- `affiliate_payouts` — Payout history (amount, status, reference)

**Key Fields:**
```
AffiliateApplication {
  id: string (UUID)
  status: 'pending' | 'approved' | 'declined' | 'needs_info'
  code: string | null  // generated on approval, e.g., 'JOHN-LABS-3x'
  commissionRate: number  // e.g., 0.10 = 10%
  approvedAt?: string (ISO date)
  expiresAt?: string (ISO date)  // default 60 days
}
```

### API Routes (Protected)

All routes require authentication + approved affiliate status.

**GET /api/affiliate/summary**
- Returns: `{ ok: boolean, summary: AffiliateSummary }`
- Data: total sales, commission earned, pending/paid payouts, last 30d metrics

**GET /api/affiliate/conversions?limit=50**
- Returns: `{ ok: boolean, conversions: AffiliateConversion[] }`
- Each conversion: `{ orderId, amountCents, commissionCents, status, createdAt }`

**GET /api/affiliate/payouts?limit=20**
- Returns: `{ ok: boolean, payouts: AffiliatePayout[] }`
- Each payout: `{ amountCents, status: 'pending'|'processing'|'completed', reference?, createdAt }`

**GET /api/affiliate/toolkit**
- Returns: `{ ok: boolean, toolkit: Toolkit }`
- Includes: brand assets, templates (with personal code injected), guidelines
- No medical claims in templates

### UI

**Affiliate Dashboard** — New tab in user profile (`/account`)

Visible only to approved affiliates. Includes:

1. **Overview Tab** (default)
   - 4 KPI cards: Total Sales, Commission Earned, Paid, Pending
   - Last 30 Days summary
   - Affiliate link + code with copy buttons

2. **Conversions Tab**
   - Table: Date, Order ID, Amount, Commission, Status
   - Shows recent orders attributed to affiliate

3. **Payouts Tab**
   - Table: Date, Amount, Status, Reference
   - Tracks commission payouts

4. **Toolkit Tab**
   - Brand assets (logo, mark, color palette)
   - Copy templates (Instagram, Facebook, Email, Bio)
   - Content guidelines (Do's/Don'ts, banned words)
   - All templates auto-populated with affiliate's personal code

## Admin Workflow

### Approving an Affiliate

1. Go to `/account/admin/affiliates`
2. Click **Approve** on a pending application
3. (Optional) Set signup credit, Discord user ID
4. Submit
5. **Automatic:**
   - Affiliate code is generated (deterministic from name + email)
   - Status changed to 'approved'
   - Expiry set to 60 days from now
   - Affiliate receives notification email (if SMTP configured)

### Declining or Requesting Info

- **Decline:** Mark as 'declined', affiliate cannot see dashboard
- **Needs Info:** Mark as 'needs_info', send followup email asking for clarification

### Setting Commission Rate

Edit the `commissionRate` field (in basis points):
- `1000` = 10%
- `500` = 5%
- `1500` = 15%

Default: 10% (from `affiliate_applications.commission_rate` column default)

## Referral Tracking

### User Clicks Affiliate Link

```
https://vikinglabs.co?ref=JOHN-LABS-3x
```

**What happens:**
1. Frontend detects `?ref=` param
2. Stores in localStorage: `vl_affiliate_code_<email>`
3. On checkout, passed to order record

### Order Attribution

When an order is created, checkout API should:
1. Read affiliate code from local storage / session
2. Look up `AffiliateApplication` by code
3. Attach `affiliate_id` to order record
4. Calculate commission: `order.subtotal * affiliate.commissionRate`
5. Record in `affiliate_conversions` table

**Example:**
```typescript
const affiliateCode = localStorage.getItem('vl_affiliate_code_' + userEmail);
const affiliate = await getAffiliateByCode(affiliateCode);
const commissionCents = Math.round(orderSubtotalCents * affiliate.commissionRate);

await recordAffiliateConversion({
  affiliateId: affiliate.id,
  orderId: order.id,
  amountCents: orderSubtotalCents,
  commissionCents: commissionCents,
  status: 'completed',
});
```

## Toolkit Management

### Static Assets

Located in: `/public/affiliate-toolkit/`

**Manifest:** `manifest.json`
- Lists brand assets (logos, colors)
- Lists copy templates + categories
- Lists content guidelines

**Template Structure:**
```json
{
  "id": "instagram-caption",
  "name": "Instagram Caption",
  "category": "social",
  "content": "🧪 Peptide research just got serious...",
}
```

### Content Guidelines

**Do's:**
- Link to vikinglabs.co with your affiliate code
- Mention lab-grade quality and testing
- Highlight fast, discreet shipping
- Use authentic testimonials from your audience
- Provide your unique discount code

**Don'ts:**
- Make medical claims (no "cure", "treat", "prevent")
- Target minors or restricted audiences
- Spam or use aggressive tactics
- Mislead about product source or quality

**Banned Words:**
```
'cure', 'treat', 'prevent', 'medical', 'therapeutic',
'prescription', 'FDA approved', 'miracle', 'breakthrough'
```

### Adding Templates

1. Edit `/public/affiliate-toolkit/manifest.json`
2. Add to `templates` array:
   ```json
   {
     "id": "tiktok-video-script",
     "name": "TikTok Video Script",
     "category": "social",
     "content": "[YOUR_CODE] gives 10% off. Link: [YOUR_AFFILIATE_LINK]"
   }
   ```
3. Redeploy
4. Template auto-appears in dashboard for all affiliates

## Security

### Authentication

All `/api/affiliate/*` routes check:
1. User is authenticated (`session?.user?.email`)
2. User has an approved affiliate application (`getAffiliateByEmail(email)`)
3. If either fails → 401 or 403 response

**Non-affiliate users cannot:**
- Access affiliate API endpoints
- See Affiliate Dashboard tab in profile

**Approved affiliates can only see:**
- Their own data (conversions, payouts, code)
- Shared toolkit (no personal data leaked)

### Medical Claims

No medical claims are made in:
- Toolkit templates (copy-pasted examples)
- Brand guidelines
- Admin interface

Responsibility: Affiliate is responsible for their own promotional content compliance with laws (FTC, FDA, state regulations).

## Database Setup

### Create Tables

If using Supabase or @vercel/postgres, run:

```sql
-- Already created by ensureAffiliateTables() on app startup
-- But you can manually verify/recreate:

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id uuid PRIMARY KEY,
  affiliate_id uuid NOT NULL,
  order_id text NOT NULL,
  amount_cents int NOT NULL,
  commission_cents int NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id uuid PRIMARY KEY,
  affiliate_id uuid NOT NULL,
  amount_cents int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reference text NULL,
  created_at timestamptz NOT NULL
);
```

## Deployment

### Pre-Deployment Checklist

- [ ] Database tables exist (run `src/lib/affiliates.ts::ensureAffiliateTables()`)
- [ ] Admin can approve affiliates (`/account/admin/affiliates`)
- [ ] Approved affiliate sees dashboard tab
- [ ] API routes respond correctly (try /api/affiliate/summary)
- [ ] Toolkit loads with affiliate code injected
- [ ] Security: Non-affiliate gets 403 on /api/affiliate/*
- [ ] Referral tracking integration (checkout passes affiliate code)
- [ ] Email notifications working (optional)

### Environment Variables

```env
NEXT_PUBLIC_SITE_URL=https://vikinglabs.co  # Used in affiliate links

# Optional: Email notifications on approval
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@vikinglabs.co
SMTP_PASS=...
AFFILIATE_EMAIL=affiliates@vikinglabs.co
```

### Deployment Steps

1. **Merge** this branch to main
2. **Push** to GitHub
3. **Vercel** auto-deploys
4. **Verify:**
   ```bash
   curl https://vikinglabs.co/api/affiliate/summary
   # Should respond 401 (no auth) or 403 (not approved)
   ```

## Testing

### Manual Test: Approve an Affiliate

1. Create a test user account (e.g., testaffiliate@example.com)
2. Go to `/affiliates` and submit an application
3. As admin, go to `/account/admin/affiliates`
4. Click **Approve** on your test application
5. Log back in as test user
6. Go to `/account`
7. Should see **Affiliate Dashboard** tab
8. Click it → should show KPI cards + empty tables (no conversions yet)
9. Copy affiliate code + link
10. Test in browser: Link should have ?ref=CODE param

### Manual Test: Track a Conversion

1. Use affiliate link from dashboard
2. Place a test order (via Stripe or Coinbase)
3. Go back to dashboard
4. Refresh → **Conversions** tab should show the order
5. Commission should be calculated: `order_subtotal * commission_rate`

### Manual Test: Security

```bash
# As non-authenticated user:
curl https://vikinglabs.co/api/affiliate/summary
# Expected: 401 Unauthorized

# As authenticated non-affiliate:
curl -H "Cookie: [session]" https://vikinglabs.co/api/affiliate/summary
# Expected: 403 Forbidden (not an approved affiliate)

# As authenticated approved affiliate:
curl -H "Cookie: [session]" https://vikinglabs.co/api/affiliate/summary
# Expected: 200 + summary JSON
```

## Monitoring & Maintenance

### What to Monitor

1. **Affiliate Conversion Tracking**
   - Are orders being attributed correctly?
   - Check `affiliate_conversions` table for recent entries

2. **Commission Accuracy**
   - Spot-check calculation: `order_subtotal * commission_rate`
   - Watch for edge cases (refunds, partial orders)

3. **API Performance**
   - /api/affiliate/* routes should respond in <100ms
   - Monitor database query performance

### Maintenance Tasks

**Monthly:**
- Review affiliate approvals + status
- Check for expired affiliates (status=approved, expiresAt < now)
- Process payouts (mark as 'completed' in affiliate_payouts table)

**Quarterly:**
- Review toolkit templates for compliance
- Update brand assets if needed
- Audit affiliate promotions for medical claims

## Troubleshooting

### Dashboard Tab Not Visible

**Problem:** Approved affiliate still doesn't see "Affiliate Dashboard" tab

**Solution:**
1. Refresh browser (hard refresh: Ctrl+Shift+R)
2. Check `/api/affiliate/summary` response (should be 200)
3. Verify affiliate application status in DB is 'approved'
4. Check user session (may need to log out + back in)

### API Routes Return 404

**Problem:** `/api/affiliate/summary` returns 404

**Solution:**
1. Verify route file exists: `src/app/api/affiliate/summary/route.ts`
2. Check build logs for errors
3. Redeploy if needed

### Conversions Not Appearing

**Problem:** Affiliate makes a sale but it doesn't show in conversions table

**Solution:**
1. Verify order has `affiliate_id` field populated
2. Check if affiliate code matches any approved affiliate
3. Manually insert test conversion:
   ```sql
   INSERT INTO affiliate_conversions
   (id, affiliate_id, order_id, amount_cents, commission_cents, status, created_at)
   VALUES
   (gen_random_uuid(), '[affiliate_id]', 'order_123', 5000, 500, 'completed', now());
   ```

## Future Enhancements

- [ ] **Payout automation** — Auto-pay pending commissions (Stripe, PayPal)
- [ ] **Analytics** — Clicks, conversion rate, revenue trend charts
- [ ] **Referral codes vs. links** — Support coupon codes alternative to URL params
- [ ] **Performance tiers** — Higher commission for top affiliates
- [ ] **Disputes** — Affiliate can contest commission calculations
- [ ] **Affiliate messaging** — Built-in notifications + blog for partners

---

**Last updated:** 2026-02-15  
**Status:** LIVE  
**Contact:** affiliates@vikinglabs.co
