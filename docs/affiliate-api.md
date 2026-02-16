# Affiliate API — Bearer Token Authentication

## Overview

All affiliate API endpoints support two authentication methods:

1. **Session auth** — NextAuth session cookie (browser/dashboard usage)
2. **Bearer token** — API key in `Authorization` header (programmatic access)

## Getting an API Key

1. Log into the affiliate dashboard
2. Navigate to the **API Keys** tab
3. Click **Generate API Key**
4. **Save the key immediately** — it is only shown once

Or via API (requires session auth):

```bash
curl -X POST https://vikinglabs.co/api/affiliate/keys \
  -H "Cookie: <session_cookie>"
```

Response:
```json
{
  "message": "API key created successfully. Save this key - you will not see it again.",
  "key": "abc123...def456",
  "keyRecord": {
    "id": "uuid",
    "last4": "f456",
    "createdAt": "2026-02-16T...",
    "scopes": ["read:affiliate"]
  }
}
```

## Using Bearer Tokens

Add the `Authorization` header to any request:

```bash
curl -H "Authorization: Bearer <your_api_key>" \
  https://vikinglabs.co/api/affiliate/summary
```

## Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/affiliate/keys` | Session or Bearer | List your API keys |
| POST | `/api/affiliate/keys` | Session only | Create a new API key |
| DELETE | `/api/affiliate/keys` | Session only | Revoke your API key |
| GET | `/api/affiliate/summary` | Session or Bearer | Dashboard summary stats |
| GET | `/api/affiliate/conversions` | Session or Bearer | List conversions |
| GET | `/api/affiliate/payouts` | Session or Bearer | List payouts |
| GET | `/api/affiliate/toolkit` | Session or Bearer | Brand assets & templates |

### Query Parameters

- `GET /api/affiliate/conversions?limit=50` — max results (default: 50)
- `GET /api/affiliate/payouts?limit=20` — max results (default: 20)

## Security Notes

- API keys are hashed (SHA-256) before storage — the raw key is never persisted
- Key creation and revocation require session auth (cannot be done via Bearer token)
- Revoked keys are immediately invalid
- Each affiliate can have one active key at a time

## Error Responses

```json
{ "ok": false, "error": "Unauthorized", "status": 401 }
{ "ok": false, "error": "Invalid or revoked API key", "status": 401 }
{ "ok": false, "error": "Not an approved affiliate", "status": 403 }
```
