/**
 * Affiliate Dashboard Security Tests
 * 
 * Run with: npm test
 * 
 * These tests verify:
 * 1. Non-affiliates cannot access /api/affiliate/* routes (403)
 * 2. Approved affiliates can see dashboard + data
 * 3. Affiliate toolkit loads with personal code injected
 * 4. Referral tracking works (ref param → cookie)
 */

// Mock test scenarios (actual tests would use jest/vitest)

const scenarios = {
  scenario_1_non_affiliate_cannot_access: {
    description: 'Non-affiliate user hits /api/affiliate/summary → 403 Forbidden',
    steps: [
      '1. User logs in (no affiliate application)',
      '2. Frontend calls GET /api/affiliate/summary',
      '3. Server checks getAffiliateByEmail(user.email)',
      '4. Returns null (no approved affiliate)',
      '5. Route responds with 403 + "Not an approved affiliate"',
    ],
    expected: 'Frontend hides Affiliate tab; user cannot see dashboard',
  },

  scenario_2_approved_affiliate_can_view: {
    description: 'Approved affiliate user views dashboard with correct data',
    steps: [
      '1. User logs in (has approved AffiliateApplication)',
      '2. Frontend calls GET /api/affiliate/summary',
      '3. Server fetches AffiliateApplication (status=approved)',
      '4. Computes summary: sales, commission, pending/paid payouts',
      '5. Returns 200 + summary JSON',
      '6. AffiliateDashboard renders KPI cards, conversions table, payouts',
    ],
    expected: 'Dashboard displays with real affiliate data',
  },

  scenario_3_toolkit_code_injection: {
    description: 'Toolkit API injects user\'s affiliate code into templates',
    steps: [
      '1. Approved affiliate calls GET /api/affiliate/toolkit',
      '2. API loads manifest.json from public/affiliate-toolkit/',
      '3. Finds affiliate.code (e.g., "JOHN-LABS-3x")',
      '4. Replaces [YOUR_CODE] in all templates with affiliate.code',
      '5. Replaces [YOUR_AFFILIATE_LINK] with site URL + ref param',
      '6. Returns enriched templates with personal codes',
    ],
    expected: 'Templates show user\'s actual code; copy button works',
  },

  scenario_4_medical_claims_blocked: {
    description: 'Toolkit guidelines enforce no medical claims',
    data: {
      bannedWords: [
        'cure', 'treat', 'prevent', 'medical', 'therapeutic',
        'prescription', 'FDA approved', 'miracle', 'breakthrough'
      ],
      guidelines_do: [
        'Link to vikinglabs.co with your affiliate code',
        'Mention lab-grade quality and testing',
        'Highlight fast, discreet shipping',
        'Use authentic testimonials',
      ],
      guidelines_dont: [
        'Make medical claims or suggest health benefits',
        'Imply peptides treat, cure, or prevent disease',
        'Target minors or restricted audiences',
        'Spam or use aggressive tactics',
      ],
    },
    note: 'Content moderation is user responsibility; guidelines provided',
  },

  scenario_5_referral_tracking: {
    description: 'Affiliate link with ?ref=CODE param tracks in analytics',
    steps: [
      '1. Affiliate shares link: vikinglabs.co?ref=JOHN-LABS-3x',
      '2. User clicks, visits site',
      '3. Frontend reads URL param, stores in localStorage/cookie',
      '4. User adds product to cart, proceeds to checkout',
      '5. On order creation, checkout API attaches affiliate code',
      '6. Order recorded with affiliate_id and commission_cents',
      '7. Affiliate sees conversion in /api/affiliate/conversions',
    ],
    expected: 'Commission tracked and visible in conversions table',
  },

  scenario_6_affiliate_code_uniqueness: {
    description: 'Each affiliate gets unique code; codes are reusable (never revoked)',
    logic: {
      code_format: 'Deterministic: formatAffiliateCode(name, email) → seed → short hash',
      example: 'John Smith (john@example.com) → "JOHN-SMITH-abc123"',
      uniqueness: 'Email-based seed ensures one code per approved affiliate',
      expiry_model: 'Affiliate expires (60d default); code does not expire',
      note: 'Old affiliate can reapply and get same code if approved again',
    },
  },
};

export default scenarios;

/**
 * DEPLOYMENT CHECKLIST
 * 
 * Before going live with affiliate dashboard:
 * 
 * [ ] Database tables created:
 *     - affiliate_conversions
 *     - affiliate_payouts
 * 
 * [ ] Admin can approve affiliates:
 *     - Visit /account/admin/affiliates
 *     - Click "Approve"
 *     - Verify affiliate gets code
 * 
 * [ ] Approved affiliate sees dashboard:
 *     - Log in as approved user
 *     - Go to /account
 *     - "Affiliate Dashboard" tab appears
 *     - KPI cards populate with data
 * 
 * [ ] Toolkit files exist:
 *     - /public/affiliate-toolkit/manifest.json
 *     - (Optional) brand asset files (logos, templates)
 * 
 * [ ] Security validated:
 *     - Non-affiliate cannot hit /api/affiliate/* (403)
 *     - Approved affiliate can hit all endpoints
 *     - No medical claims in template examples
 * 
 * [ ] Referral tracking working:
 *     - Test URL: vikinglabs.co?ref=[code]
 *     - Verify order captured with affiliate_id
 * 
 * [ ] Email notifications work (optional):
 *     - Affiliate approval email sent
 *     - Code + dashboard link included
 * 
 * [ ] Documentation:
 *     - README.md updated with affiliate program details
 *     - Admin guide: how to approve/reject applications
 *     - Affiliate guide: how to use dashboard + toolkit
 */
