# Affiliate API Implementation Guide

## Overview

The Affiliate API system provides approved affiliates with programmatic access to their performance data, marketing assets, and personal research tracking functionality. This document describes the complete implementation.

## Architecture

### Data Models

#### AffiliateApiKey
Stores hashed API keys with metadata:
- `apiKeyHash`: SHA256 hash of the raw API key (never stored in plaintext)
- `last4`: Last 4 characters of the key for identification
- `scopes`: List of permissions (shopping_read, sales_read, assets_read, tracker_rw)
- `createdAt`, `rotatedAt`, `revokedAt`: Timestamps

#### TrackerStack
Research tracking stacks (personal notes):
- `name`: Stack name (e.g., "Supplement A - Daily Log")
- `notes`: Optional description
- `affiliateId`: Owner affiliate
- `createdAt`, `updatedAt`: Timestamps

#### TrackerEntry
Individual tracker entries within a stack:
- `stackId`: Reference to parent stack
- `date`: Entry date (ISO format)
- `dosage`: Optional dosage field
- `notes`: Personal notes
- `createdAt`, `updatedAt`: Timestamps

### Database Tables

If using PostgreSQL (Vercel Postgres):
- `affiliate_api_keys`: API key management
- `tracker_stacks`: Tracker stack definitions
- `tracker_entries`: Tracker entries

Falls back to file-based storage (JSON) if database unavailable.

## API Endpoints

### Authentication

All endpoints support two authentication methods:

1. **Session Auth**: Use NextAuth session (for dashboard UI)
   ```
   GET /api/affiliate/api-key
   ```

2. **API Key Auth**: Bearer token in Authorization header
   ```
   Authorization: Bearer sk_...
   ```

The raw API key is never logged or transmitted insecurely. Only the hash is stored server-side.

### 1. API Key Management

#### GET /api/affiliate/api-key
Get current API key status
```bash
curl -X GET https://vikinglabs.co/api/affiliate/api-key
```

Response:
```json
{
  "ok": true,
  "apiKey": {
    "last4": "a1b2",
    "scopes": ["shopping_read", "sales_read", "assets_read", "tracker_rw"],
    "createdAt": "2024-01-01T00:00:00Z",
    "revokedAt": null
  }
}
```

#### POST /api/affiliate/api-key
Generate/rotate API key (revokes old key, creates new one)
```bash
curl -X POST https://vikinglabs.co/api/affiliate/api-key
```

Response (raw key shown only once):
```json
{
  "ok": true,
  "apiKey": "sk_abc123...",
  "last4": "c123",
  "scopes": ["shopping_read", "sales_read", "assets_read", "tracker_rw"],
  "warning": "Save this key securely. You will not be able to view it again."
}
```

#### DELETE /api/affiliate/api-key
Revoke API key
```bash
curl -X DELETE https://vikinglabs.co/api/affiliate/api-key
```

### 2. Shopping Activity

#### GET /api/affiliate/shopping
Get referral traffic and attributed orders
```bash
curl -H "Authorization: Bearer sk_..." \
  https://vikinglabs.co/api/affiliate/shopping
```

Response:
```json
{
  "ok": true,
  "data": {
    "clicks": 42,
    "orders": 5,
    "revenueCents": 15000,
    "revenueFormatted": "$150.00"
  }
}
```

### 3. Sales Stats

#### GET /api/affiliate/sales
Get revenue, commission, and payout status
```bash
curl -H "Authorization: Bearer sk_..." \
  https://vikinglabs.co/api/affiliate/sales
```

Response:
```json
{
  "ok": true,
  "data": {
    "orders": 5,
    "revenueCents": 15000,
    "revenueFormatted": "$150.00",
    "commissionRate": "10%",
    "commissionCents": 1500,
    "commissionFormatted": "$15.00",
    "payoutStatus": "pending",
    "payoutMinimum": 5000
  }
}
```

### 4. Marketing Assets

#### GET /api/affiliate/assets
Get marketing toolkit manifest (logos, templates, social guides)
```bash
curl -H "Authorization: Bearer sk_..." \
  https://vikinglabs.co/api/affiliate/assets
```

Response:
```json
{
  "ok": true,
  "toolkit": {
    "version": "1.0.0",
    "branding": {
      "logo": { ... },
      "colors": { ... },
      "typography": { ... }
    },
    "captionTemplates": [ ... ],
    "layouts": [ ... ],
    "downloadableAssets": [ ... ],
    "socialMediaGuide": { ... }
  }
}
```

### 5. Tracker Stacks (Research Tracking)

#### GET /api/affiliate/tracker/stacks
List all tracker stacks
```bash
curl -H "Authorization: Bearer sk_..." \
  https://vikinglabs.co/api/affiliate/tracker/stacks
```

Response:
```json
{
  "ok": true,
  "stacks": [
    {
      "id": "uuid",
      "affiliateId": "uuid",
      "name": "Supplement A - Daily Log",
      "notes": "Personal research tracking",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

#### POST /api/affiliate/tracker/stacks
Create new tracker stack
```bash
curl -X POST -H "Authorization: Bearer sk_..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Stack Name", "notes": "Optional notes"}' \
  https://vikinglabs.co/api/affiliate/tracker/stacks
```

#### PATCH /api/affiliate/tracker/stacks?id=...
Update tracker stack
```bash
curl -X PATCH -H "Authorization: Bearer sk_..." \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}' \
  https://vikinglabs.co/api/affiliate/tracker/stacks?id=uuid
```

#### DELETE /api/affiliate/tracker/stacks?id=...
Delete tracker stack
```bash
curl -X DELETE -H "Authorization: Bearer sk_..." \
  https://vikinglabs.co/api/affiliate/tracker/stacks?id=uuid
```

### 6. Tracker Entries (Personal Notes)

#### GET /api/affiliate/tracker/entries?stackId=...
Get entries for a stack
```bash
curl -H "Authorization: Bearer sk_..." \
  https://vikinglabs.co/api/affiliate/tracker/entries?stackId=uuid
```

Response:
```json
{
  "ok": true,
  "entries": [
    {
      "id": "uuid",
      "stackId": "uuid",
      "affiliateId": "uuid",
      "date": "2024-01-01",
      "dosage": "500mg",
      "notes": "Personal notes here",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/affiliate/tracker/entries
Create new entry
```bash
curl -X POST -H "Authorization: Bearer sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "stackId": "uuid",
    "date": "2024-01-01",
    "dosage": "500mg",
    "notes": "Personal notes"
  }' \
  https://vikinglabs.co/api/affiliate/tracker/entries
```

#### PATCH /api/affiliate/tracker/entries?id=...
Update entry
```bash
curl -X PATCH -H "Authorization: Bearer sk_..." \
  -H "Content-Type: application/json" \
  -d '{"dosage": "600mg"}' \
  https://vikinglabs.co/api/affiliate/tracker/entries?id=uuid
```

#### DELETE /api/affiliate/tracker/entries?id=...
Delete entry
```bash
curl -X DELETE -H "Authorization: Bearer sk_..." \
  https://vikinglabs.co/api/affiliate/tracker/entries?id=uuid
```

## Security & Compliance

### API Key Security
- Keys are hashed with SHA256 before storage
- Raw keys shown only once at creation
- Revoked keys are permanently disabled
- All API key operations require session authentication

### Data Access
- Each affiliate can only access their own data
- API enforces affiliateId ownership on all requests
- No PII or payment details exposed (aggregates only)
- Commission rates pulled from affiliate application record

### Compliance Labeling
- Tracker is labeled as "Research tracking / personal notes"
- No medical advice copy included
- All endpoints include compliance notices where appropriate
- Tracker data is explicitly user-generated research notes, not medical guidance

### Rate Limiting
- Implement per-API-key rate limiting in production
- Lightweight limits sufficient (affiliates are partners)
- Add audit logging for API key rotations and revocations

## Frontend Integration

### Dashboard Page
Located at: `/account/affiliate`
- Accessible only to approved affiliates
- Shows API key management UI
- Displays real-time stats (clicks, orders, revenue, commission)
- Links to toolkit and tracker
- Includes API documentation with curl examples

### Components
- `AffiliateApiDashboard`: Main dashboard component (client-side)
  - Handles API key generation/rotation/revocation
  - Fetches and displays stats
  - Shows documentation and examples

## Files Modified/Created

### Modified
- `src/lib/affiliates.ts`: Added API key and tracker types + functions

### Created
- `src/lib/affiliate-auth.ts`: Authentication utilities
- `src/app/api/affiliate/api-key/route.ts`: API key management
- `src/app/api/affiliate/shopping/route.ts`: Shopping stats
- `src/app/api/affiliate/sales/route.ts`: Sales stats
- `src/app/api/affiliate/assets/route.ts`: Toolkit manifest
- `src/app/api/affiliate/tracker/stacks/route.ts`: Stack CRUD
- `src/app/api/affiliate/tracker/entries/route.ts`: Entry CRUD
- `src/components/affiliate/AffiliateApiDashboard.tsx`: Dashboard UI
- `src/app/account/affiliate/page.tsx`: Dashboard page
- `docs/AFFILIATE_API.md`: This documentation

## Future Enhancements

### Phase 2
- [ ] Admin endpoint to rotate/revoke affiliate keys
- [ ] API usage analytics and rate limit status
- [ ] Webhook support for order notifications
- [ ] Batch import of tracker entries
- [ ] Affiliate performance reports (PDF export)

### Phase 3
- [ ] Affiliate tier system (different commission rates)
- [ ] Advanced filtering/date range support on stats
- [ ] Affiliate collaboration (shared stacks)
- [ ] Integration with affiliate networks (Impact, Refersion, etc.)

## Testing

### Manual Testing Checklist
- [ ] Generate API key via UI
- [ ] Copy key and store securely
- [ ] Test GET /api/affiliate/shopping with API key
- [ ] Test GET /api/affiliate/sales with API key
- [ ] Test GET /api/affiliate/assets
- [ ] Create tracker stack via API
- [ ] Create, read, update, delete tracker entries
- [ ] Rotate API key (revokes old key)
- [ ] Revoke API key (disables access)
- [ ] Verify unapproved affiliate can't access API
- [ ] Verify affiliate can't access another affiliate's data

### Build Verification
```bash
npm run build
npm run start
```

## Deployment Notes

1. Ensure database tables are created (via `ensureAffiliateTables()`)
2. Set up SMTP for affiliate approval notifications
3. Configure environment variables (SMTP, site URL, etc.)
4. Test with approved affiliates in staging
5. Monitor API usage post-launch
6. Implement rate limiting before public release (optional for MVP)

## Support & Troubleshooting

- API key not working? Verify it's not revoked: `GET /api/affiliate/api-key`
- Stats showing zero? Verify affiliate ID and check order linkage in order_affiliates table
- Database falling back to file storage? Check Vercel Postgres connection
- CORS issues? Ensure request includes proper Content-Type headers

---

**Last Updated:** 2024-01-01  
**Version:** 1.0.0  
**Status:** Implementation Complete
