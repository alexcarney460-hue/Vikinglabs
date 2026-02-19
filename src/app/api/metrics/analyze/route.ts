/**
 * Metrics Analysis API
 * Analyzes Instagram performance data to determine optimal posting times
 * and content performance patterns
 * 
 * PHASE 2: Performance Analysis System
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { assertMarketingKey } from '@/lib/marketingAuth';

export const dynamic = 'force-dynamic';

interface TimeWindowPerformance {
  timeWindow: string;
  avgLikes: number;
  avgComments: number;
  avgSaves: number;
  avgEngagementRate: number;
  postCount: number;
}

interface ContentTypePerformance {
  format: string;
  avgLikes: number;
  avgComments: number;
  avgEngagementRate: number;
  postCount: number;
}

interface AnalysisResult {
  bestPostingTime: string;
  timeWindowAnalysis: TimeWindowPerformance[];
  contentTypePerformance: ContentTypePerformance[];
  topPerformers: any[];
  recommendations: string[];
  dataRange: {
    from: string;
    to: string;
    totalPosts: number;
  };
}

/**
 * GET /api/metrics/analyze
 * Analyzes performance across posted content
 * 
 * Query params:
 * - days: Number of days to analyze (default: 30)
 * - platform: Filter by platform (instagram|tiktok)
 */
export async function GET(req: NextRequest) {
  try {
    assertMarketingKey(req);

    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
    const platform = req.nextUrl.searchParams.get('platform') || 'instagram';

    const supabase = getSupabaseServer();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Fetch posted content with metrics
    const { data: posts, error } = await supabase
      .from('marketing_content_queue')
      .select('*')
      .eq('status', 'posted')
      .eq('platform', platform)
      .gte('posted_at', startDate.toISOString())
      .lte('posted_at', endDate.toISOString())
      .not('posted_at', 'is', null)
      .order('posted_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch posts: ${error.message}` },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: 'No posted content found in this time range',
        bestPostingTime: 'Insufficient data',
        recommendations: ['Post more content to generate insights'],
        dataRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          totalPosts: 0,
        },
      });
    }

    // Analyze time windows (early morning, morning, afternoon, evening, night)
    const timeWindowAnalysis = analyzePostingTimeWindows(posts);

    // Analyze content type performance
    const contentTypePerformance = analyzeContentTypes(posts);

    // Get top performers
    const topPerformers = posts
      .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
      .slice(0, 5)
      .map((post) => ({
        id: post.id,
        topic: post.topic,
        format: post.format,
        likes: post.likes || 0,
        comments: post.comments || 0,
        saves: post.saves || 0,
        engagement_rate: post.engagement_rate || 0,
        posted_at: post.posted_at,
      }));

    // Determine best posting time
    const bestWindow = timeWindowAnalysis.reduce((best, current) =>
      current.avgEngagementRate > best.avgEngagementRate ? current : best
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
      timeWindowAnalysis,
      contentTypePerformance,
      topPerformers
    );

    const result: AnalysisResult = {
      bestPostingTime: bestWindow.timeWindow,
      timeWindowAnalysis,
      contentTypePerformance,
      topPerformers,
      recommendations,
      dataRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        totalPosts: posts.length,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * Analyze performance by posting time windows
 */
function analyzePostingTimeWindows(posts: any[]): TimeWindowPerformance[] {
  const windows: Record<string, { likes: number[]; comments: number[]; saves: number[]; engagementRates: number[] }> = {
    'Early Morning (5-8 AM PST)': { likes: [], comments: [], saves: [], engagementRates: [] },
    'Morning (8-11 AM PST)': { likes: [], comments: [], saves: [], engagementRates: [] },
    'Midday (11 AM-2 PM PST)': { likes: [], comments: [], saves: [], engagementRates: [] },
    'Afternoon (2-5 PM PST)': { likes: [], comments: [], saves: [], engagementRates: [] },
    'Evening (5-9 PM PST)': { likes: [], comments: [], saves: [], engagementRates: [] },
    'Night (9 PM-12 AM PST)': { likes: [], comments: [], saves: [], engagementRates: [] },
    'Late Night (12-5 AM PST)': { likes: [], comments: [], saves: [], engagementRates: [] },
  };

  for (const post of posts) {
    if (!post.posted_at) continue;

    const postedDate = new Date(post.posted_at);
    // Convert to PST (UTC-8)
    const pstHour = (postedDate.getUTCHours() - 8 + 24) % 24;

    let windowKey: string;
    if (pstHour >= 5 && pstHour < 8) windowKey = 'Early Morning (5-8 AM PST)';
    else if (pstHour >= 8 && pstHour < 11) windowKey = 'Morning (8-11 AM PST)';
    else if (pstHour >= 11 && pstHour < 14) windowKey = 'Midday (11 AM-2 PM PST)';
    else if (pstHour >= 14 && pstHour < 17) windowKey = 'Afternoon (2-5 PM PST)';
    else if (pstHour >= 17 && pstHour < 21) windowKey = 'Evening (5-9 PM PST)';
    else if (pstHour >= 21 || pstHour < 0) windowKey = 'Night (9 PM-12 AM PST)';
    else windowKey = 'Late Night (12-5 AM PST)';

    windows[windowKey].likes.push(post.likes || 0);
    windows[windowKey].comments.push(post.comments || 0);
    windows[windowKey].saves.push(post.saves || 0);
    windows[windowKey].engagementRates.push(post.engagement_rate || 0);
  }

  return Object.entries(windows)
    .map(([timeWindow, data]) => ({
      timeWindow,
      avgLikes: average(data.likes),
      avgComments: average(data.comments),
      avgSaves: average(data.saves),
      avgEngagementRate: average(data.engagementRates),
      postCount: data.likes.length,
    }))
    .filter((window) => window.postCount > 0)
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Analyze performance by content type/format
 */
function analyzeContentTypes(posts: any[]): ContentTypePerformance[] {
  const formats: Record<string, { likes: number[]; comments: number[]; engagementRates: number[] }> = {};

  for (const post of posts) {
    const format = post.format || 'Unknown';
    if (!formats[format]) {
      formats[format] = { likes: [], comments: [], engagementRates: [] };
    }

    formats[format].likes.push(post.likes || 0);
    formats[format].comments.push(post.comments || 0);
    formats[format].engagementRates.push(post.engagement_rate || 0);
  }

  return Object.entries(formats)
    .map(([format, data]) => ({
      format,
      avgLikes: average(data.likes),
      avgComments: average(data.comments),
      avgEngagementRate: average(data.engagementRates),
      postCount: data.likes.length,
    }))
    .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  timeWindows: TimeWindowPerformance[],
  contentTypes: ContentTypePerformance[],
  topPerformers: any[]
): string[] {
  const recommendations: string[] = [];

  // Best posting time recommendation
  if (timeWindows.length > 0) {
    const best = timeWindows[0];
    recommendations.push(
      `📅 Post during ${best.timeWindow} for ${(best.avgEngagementRate * 100).toFixed(2)}% average engagement`
    );
  }

  // Worst performing time to avoid
  if (timeWindows.length > 1) {
    const worst = timeWindows[timeWindows.length - 1];
    if (worst.postCount > 2) {
      recommendations.push(
        `⚠️ Avoid posting during ${worst.timeWindow} (lowest engagement: ${(worst.avgEngagementRate * 100).toFixed(2)}%)`
      );
    }
  }

  // Best content format recommendation
  if (contentTypes.length > 0) {
    const bestFormat = contentTypes[0];
    recommendations.push(
      `🎬 "${bestFormat.format}" performs best with ${(bestFormat.avgEngagementRate * 100).toFixed(2)}% engagement`
    );
  }

  // Top performer insights
  if (topPerformers.length > 0) {
    const top = topPerformers[0];
    const postedTime = new Date(top.posted_at);
    const pstHour = (postedTime.getUTCHours() - 8 + 24) % 24;
    recommendations.push(
      `🏆 Top performer: "${top.topic}" (${top.format}) posted at ${pstHour}:00 PST`
    );
  }

  // Engagement velocity insights
  const avgLikes = timeWindows.reduce((sum, w) => sum + w.avgLikes, 0) / timeWindows.length;
  const avgComments = timeWindows.reduce((sum, w) => sum + w.avgComments, 0) / timeWindows.length;
  
  if (avgComments / avgLikes > 0.1) {
    recommendations.push(
      `💬 High comment rate detected - consider more engagement-driven CTAs`
    );
  }

  // Data sufficiency recommendation
  if (timeWindows.reduce((sum, w) => sum + w.postCount, 0) < 10) {
    recommendations.push(
      `📊 Post more content for better insights (current data: ${timeWindows.reduce((sum, w) => sum + w.postCount, 0)} posts)`
    );
  }

  return recommendations;
}

/**
 * Calculate average of an array
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}
