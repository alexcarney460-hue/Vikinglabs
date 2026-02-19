# Marketing API Setup

## Status
✅ **Code Ready** — Marketing API endpoints enabled in codebase

## Required Environment Variables

Add these to **Vercel Dashboard** (Settings > Environment Variables):

| Variable | Value | Sensitivity |
|----------|-------|-------------|
| `MARKETING_API_ENABLED` | `true` | Public |
| `MARKETING_KEY` | `753b363687e8c3e2b9d296408cf0e076593fb40e92825f098663d891c4cfefca` | Sensitive ✓ |

## Setup Steps

1. Go to https://vercel.com/alex-carneys-projects/vikinglabs/settings/environment-variables
2. Click **"Add New"**
3. Enter `MARKETING_API_ENABLED` = `true`
4. Click **"Add New"** again
5. Enter `MARKETING_KEY` = `753b363687e8c3e2b9d296408cf0e076593fb40e92825f098663d891c4cfefca`
   - Check **"Sensitive"** checkbox
6. Click **Save**
7. Vercel will auto-redeploy (watch Deployments tab)

## Verification

Once deployed, test the API:

```bash
curl -X POST https://vikinglabs.co/api/marketing/content \
  -H "X-MARKETING-KEY: 753b363687e8c3e2b9d296408cf0e076593fb40e92825f098663d891c4cfefca" \
  -H "Content-Type: application/json" \
  -d '{"platform":"tiktok","format":"test","topic":"test","hook":"test","script":["test"],"caption":"test","hashtags":["#test"],"cta":"test","compliance":{"risk_score":0.0,"flags":[],"notes":"test"}}'
```

Should return: `HTTP 201` with `{id: "...", row: {...}}`

---

**Created**: 2026-02-19 11:24 PST
**Updated**: Ready for Vercel deployment
