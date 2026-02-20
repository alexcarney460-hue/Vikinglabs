import { NextRequest, NextResponse } from 'next/server';
import { assertMarketingEnabled, assertMarketingKey, respondUnauthorized, respondError } from '@/lib/marketingAuth';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    assertMarketingEnabled();
    assertMarketingKey(req);

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
    
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('post_metrics_latest')
      .select('*')
      .order('snapshot_at', { ascending: false })
      .limit(limit);

    if (error) {
      return respondError(`Failed to fetch insights: ${error.message}`);
    }

    // Analyze patterns from metrics
    const insights = analyzePerformance(data || []);

    return NextResponse.json(insights);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return respondUnauthorized();
    }
    if (err instanceof Error && err.message === 'Marketing API is not enabled') {
      return respondError('Marketing API is not enabled', 403);
    }
    return respondError((err instanceof Error ? err.message : 'Unknown error') || 'Failed to fetch insights');
  }
}

function analyzePerformance(metrics: any[]) {
  if (!metrics || metrics.length === 0) {
    return {
      window: 'none',
      top_patterns: [],
      failing_patterns: [],
      guidance: 'No metrics available yet. Post content and wait for engagement data.',
      updated_at: new Date().toISOString(),
    };
  }

  // Group by engagement_rate to find patterns
  const sorted = [...metrics].sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0));
  const topPerformers = sorted.slice(0, Math.ceil(sorted.length * 0.2));
  const bottomPerformers = sorted.slice(Math.floor(sorted.length * 0.8));

  // Extract patterns
  const topPatterns = topPerformers.map((m) => ({
    platform: m.platform,
    engagement_rate: m.engagement_rate,
    likes: m.likes,
    comments: m.comments,
    saves: m.saves,
  }));

  const failingPatterns = bottomPerformers.map((m) => ({
    platform: m.platform,
    engagement_rate: m.engagement_rate,
    likes: m.likes,
  }));

  return {
    window: 'all',
    top_patterns: topPatterns,
    failing_patterns: failingPatterns,
    guidance: 'Use top-performing patterns: focus on high engagement content, optimize posting times, encourage saves/shares.',
    updated_at: new Date().toISOString(),
  };
}
