# Metrics API Quick Reference

## Authentication

All endpoints require the `MARKETING_KEY` header:

```bash
-H "MARKETING_KEY: your-secret-key"
```

---

## Endpoints

### 1. Collect Hourly Metrics

**Endpoint**: `POST /api/metrics/collect`

**Description**: Scrapes Instagram metrics for all posts from the last 24 hours and stores hourly snapshots.

**Request**:
```bash
curl -X POST https://vikinglabs.co/api/metrics/collect \
  -H "MARKETING_KEY: your-key"
```

**Response**:
```json
{
  "success": true,
  "collected": 5,
  "failed": 0,
  "totalPosts": 5
}
```

**Schedule**: Run every hour via cron job (`0 * * * *`)

---

### 2. Get Collection Status

**Endpoint**: `GET /api/metrics/collect`

**Description**: Returns recent snapshots and currently tracked posts.

**Request**:
```bash
curl https://vikinglabs.co/api/metrics/collect \
  -H "MARKETING_KEY: your-key"
```

**Response**:
```json
{
  "recentSnapshots": [
    {
      "id": "uuid",
      "marketing_content_id": "uuid",
      "platform": "instagram",
      "likes": 543,
      "comments": 42,
      "snapshot_at": "2026-02-19T15:00:00Z",
      "hours_since_posted": 12
    }
  ],
  "activelyTracking": 3,
  "activePosts": [...]
}
```

---

### 3. Analyze Performance

**Endpoint**: `GET /api/metrics/analyze`

**Description**: Analyzes performance patterns and returns recommendations.

**Query Parameters**:
- `days` (optional, default: 30) - Number of days to analyze
- `platform` (optional, default: instagram) - Platform to analyze

**Request**:
```bash
curl "https://vikinglabs.co/api/metrics/analyze?days=30&platform=instagram" \
  -H "MARKETING_KEY: your-key"
```

**Response**:
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
    "⚠️ Avoid posting during Late Night (12-5 AM PST)",
    "🎬 \"Educational Reel\" performs best with 5.12% engagement"
  ],
  "dataRange": {
    "from": "2026-01-20T00:00:00Z",
    "to": "2026-02-19T00:00:00Z",
    "totalPosts": 45
  }
}
```

---

## Time Windows

The analyzer categorizes posts into these time windows (PST):

- **Early Morning**: 5-8 AM
- **Morning**: 8-11 AM
- **Midday**: 11 AM-2 PM
- **Afternoon**: 2-5 PM
- **Evening**: 5-9 PM
- **Night**: 9 PM-12 AM
- **Late Night**: 12-5 AM

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

**Cause**: Missing or invalid `MARKETING_KEY` header.

---

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch posts: <error message>"
}
```

**Causes**:
- Database connection error
- Scraping failure
- Invalid query parameters

---

## Rate Limits

- **Scraping**: 2-second delay between Instagram requests
- **Max Duration**: 5 minutes per collection run (Vercel limit)
- **Concurrent Requests**: Not recommended (may trigger IP blocks)

---

## Example Usage (JavaScript)

```javascript
// Collect metrics (run hourly via cron)
const collectMetrics = async () => {
  const response = await fetch('https://vikinglabs.co/api/metrics/collect', {
    method: 'POST',
    headers: {
      'MARKETING_KEY': process.env.MARKETING_KEY
    }
  });
  const data = await response.json();
  console.log(`Collected metrics for ${data.collected} posts`);
};

// Analyze performance (run weekly)
const analyzePerformance = async () => {
  const response = await fetch(
    'https://vikinglabs.co/api/metrics/analyze?days=7&platform=instagram',
    {
      headers: {
        'MARKETING_KEY': process.env.MARKETING_KEY
      }
    }
  );
  const data = await response.json();
  
  console.log(`Best posting time: ${data.bestPostingTime}`);
  console.log('Recommendations:', data.recommendations);
  
  return data;
};
```

---

## Database Schema

### `post_metrics_hourly`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `marketing_content_id` | UUID | FK to marketing_content_queue |
| `platform` | TEXT | instagram/tiktok |
| `platform_post_id` | TEXT | Instagram shortcode |
| `views` | INTEGER | Video views |
| `likes` | INTEGER | Like count |
| `comments` | INTEGER | Comment count |
| `shares` | INTEGER | Share count |
| `saves` | INTEGER | Save count |
| `engagement_rate` | NUMERIC | Calculated engagement rate |
| `snapshot_at` | TIMESTAMPTZ | Timestamp of snapshot |
| `hours_since_posted` | INTEGER | 0-24 hours since posting |

---

## Troubleshooting

### Collection returns `collected: 0`
- **Cause**: No posts in the last 24 hours
- **Solution**: Post more content or wait for existing posts to be tracked

### Scraping fails consistently
- **Cause**: Instagram changed page selectors
- **Solution**: Update selectors in `/src/lib/instagram-metrics.ts`

### Analysis returns "Insufficient data"
- **Cause**: Less than 10 posts in the time range
- **Solution**: Increase `days` parameter or post more content

---

**For detailed documentation, see**: `/docs/METRICS_SYSTEM_README.md`
