# Phase 2: Instagram Metrics Collection & Performance Analysis

## Overview

This system automatically scrapes Instagram post metrics hourly for 24 hours after posting, analyzes performance patterns, and provides data-driven recommendations for optimal posting times and content formats.

## Architecture

### Components

1. **Instagram Metrics Scraper** (`/src/lib/instagram-metrics.ts`)
   - Scrapes public Instagram posts using Playwright
   - Extracts: likes, comments, views (Reels), saves (if authenticated)
   - Supports both single post and profile-wide scraping

2. **Hourly Collection Endpoint** (`/src/app/api/metrics/collect`)
   - Automatically tracks all posts from the last 24 hours
   - Stores hourly snapshots in `post_metrics_hourly` table
   - Updates main content record with latest metrics

3. **Analysis Endpoint** (`/src/app/api/metrics/analyze`)
   - Analyzes performance by posting time windows
   - Ranks content formats by engagement
   - Generates actionable recommendations

4. **Database Schema** (`/docs/HOURLY_METRICS_MIGRATION.sql`)
   - `post_metrics_hourly`: Stores hourly snapshots
   - `post_metrics_latest`: View for latest metrics per post

## Setup

### 1. Run Database Migration

```sql
-- Execute this in your Supabase SQL editor
\i docs/HOURLY_METRICS_MIGRATION.sql
```

### 2. Set Up Environment Variables

```env
# Already configured if you have Marketing API enabled
MARKETING_KEY=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Configure Cron Job (Hourly Collection)

**Option A: Vercel Cron (Recommended)**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/metrics/collect",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Option B: External Cron Service (cron-job.org, EasyCron)**

- URL: `https://vikinglabs.co/api/metrics/collect`
- Method: POST
- Headers: `MARKETING_KEY: your-secret-key`
- Schedule: Every hour (`0 * * * *`)

**Option C: GitHub Actions**

```yaml
name: Hourly Metrics Collection
on:
  schedule:
    - cron: '0 * * * *'
jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger metrics collection
        run: |
          curl -X POST https://vikinglabs.co/api/metrics/collect \
            -H "MARKETING_KEY: ${{ secrets.MARKETING_KEY }}"
```

## API Usage

### Collect Hourly Metrics

```bash
curl -X POST https://vikinglabs.co/api/metrics/collect \
  -H "MARKETING_KEY: your-secret-key"
```

**Response:**

```json
{
  "success": true,
  "collected": 5,
  "failed": 0,
  "totalPosts": 5
}
```

### Get Collection Status

```bash
curl -X GET https://vikinglabs.co/api/metrics/collect \
  -H "MARKETING_KEY: your-secret-key"
```

**Response:**

```json
{
  "recentSnapshots": [...],
  "activelyTracking": 3,
  "activePosts": [...]
}
```

### Analyze Performance

```bash
curl -X GET "https://vikinglabs.co/api/metrics/analyze?days=30&platform=instagram" \
  -H "MARKETING_KEY: your-secret-key"
```

**Response:**

```json
{
  "bestPostingTime": "Evening (5-9 PM PST)",
  "timeWindowAnalysis": [
    {
      "timeWindow": "Evening (5-9 PM PST)",
      "avgLikes": 543,
      "avgComments": 42,
      "avgSaves": 87,
      "avgEngagementRate": 0.0456,
      "postCount": 12
    }
  ],
  "contentTypePerformance": [
    {
      "format": "Educational Reel",
      "avgLikes": 623,
      "avgComments": 51,
      "avgEngagementRate": 0.0512,
      "postCount": 8
    }
  ],
  "topPerformers": [
    {
      "id": "uuid",
      "topic": "Peptides 101",
      "format": "Educational Reel",
      "likes": 892,
      "comments": 73,
      "engagement_rate": 0.0623,
      "posted_at": "2026-02-15T19:30:00Z"
    }
  ],
  "recommendations": [
    "📅 Post during Evening (5-9 PM PST) for 4.56% average engagement",
    "⚠️ Avoid posting during Late Night (12-5 AM PST) (lowest engagement: 1.23%)",
    "🎬 \"Educational Reel\" performs best with 5.12% engagement",
    "🏆 Top performer: \"Peptides 101\" (Educational Reel) posted at 19:00 PST"
  ],
  "dataRange": {
    "from": "2026-01-20T00:00:00Z",
    "to": "2026-02-19T00:00:00Z",
    "totalPosts": 45
  }
}
```

## Workflow Integration

### Catalyst Agent Loop (Recommended)

1. **Content Creation** → Catalyst generates content briefs
2. **Approval** → Admin approves content via Marketing Hub
3. **Posting** → Auto-post or manual post to Instagram
4. **Tracking** → Hourly collection runs automatically for 24h
5. **Analysis** → Catalyst calls `/api/metrics/analyze` every 7 days
6. **Optimization** → Catalyst adjusts content strategy based on recommendations

### Manual Analysis

```bash
# Get weekly insights
curl "https://vikinglabs.co/api/metrics/analyze?days=7" \
  -H "MARKETING_KEY: your-key" | jq '.recommendations'
```

## Database Queries

### Get Hourly Metrics for a Post

```sql
SELECT 
  hours_since_posted,
  likes,
  comments,
  saves,
  engagement_rate,
  snapshot_at
FROM post_metrics_hourly
WHERE marketing_content_id = 'your-post-uuid'
ORDER BY hours_since_posted ASC;
```

### Get Latest Metrics for All Posts

```sql
SELECT * FROM post_metrics_latest;
```

### Analyze Engagement Velocity

```sql
SELECT 
  marketing_content_id,
  MAX(likes) - MIN(likes) as likes_growth,
  MAX(comments) - MIN(comments) as comments_growth,
  MAX(engagement_rate) - MIN(engagement_rate) as engagement_growth
FROM post_metrics_hourly
WHERE marketing_content_id IN (SELECT id FROM marketing_content_queue WHERE status = 'posted')
GROUP BY marketing_content_id
ORDER BY engagement_growth DESC;
```

## Performance Considerations

- **Rate Limiting**: 2-second delay between Instagram scrapes
- **Max Duration**: 5 minutes per collection run (Vercel limit)
- **Concurrent Scraping**: Not implemented (to avoid IP blocks)
- **Authentication**: Public scraping only (saves data not available without login)

## Roadmap

### Phase 3: Advanced Analytics
- [ ] Engagement velocity graphs
- [ ] A/B testing framework
- [ ] Hashtag performance analysis
- [ ] Competitor benchmarking

### Phase 4: Real-Time Insights
- [ ] Instagram Graph API integration (official API)
- [ ] Real-time webhook notifications
- [ ] Automated response suggestions

## Troubleshooting

### Scraping Fails

- **Instagram changed selectors**: Update selectors in `instagram-metrics.ts`
- **Rate limiting**: Increase delay between requests
- **IP blocked**: Use proxy rotation (not implemented)

### Missing Metrics

- **Views = 0**: Post is not a Reel (views only for video content)
- **Saves = 0**: Not available via public scraping (requires auth)

### Cron Job Not Running

- **Vercel**: Check deployment logs, ensure `vercel.json` is committed
- **External**: Verify webhook endpoint is accessible, check service logs

## Security

- ✅ Authentication via `MARKETING_KEY` header
- ✅ RLS policies on all tables
- ✅ No public API access
- ⚠️ Scraping uses public Instagram data only (no private accounts)

## Support

For issues or questions, check:
1. Supabase logs for database errors
2. Vercel logs for API errors
3. Browser console for scraping failures (run manually via Node.js script)

---

**Built for Viking Labs Marketing Hub**  
Phase 2 Complete ✅
