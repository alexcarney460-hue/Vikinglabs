/**
 * Hourly Metrics Collection API
 * Scrapes Instagram metrics hourly for 24 hours after posting
 * Stores snapshots in post_metrics_hourly table
 * 
 * PHASE 2: Performance Analysis System
 * 
 * Usage:
 * - Call this endpoint hourly via cron job
 * - It will automatically track all posts from the last 24 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { assertMarketingKey } from '@/lib/marketingAuth';
import { scrapeInstagramPostMetrics, calculateEngagementRate } from '@/lib/instagram-metrics';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

interface CollectionResult {
  success: boolean;
  collected: number;
  failed: number;
  errors: string[];
}

/**
 * POST /api/metrics/collect
 * Collects hourly metrics for all posts from the last 24 hours
 * 
 * Auth: Requires MARKETING_KEY header
 */
export async function POST(req: NextRequest) {
  try {
    assertMarketingKey(req);

    const supabase = getSupabaseServer();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch all posts from the last 24 hours that need tracking
    const { data: posts, error: fetchError } = await supabase
      .from('marketing_content_queue')
      .select('id, platform, platform_post_id, posted_at, views, likes, comments, saves, shares')
      .eq('status', 'posted')
      .eq('platform', 'instagram')
      .gte('posted_at', twentyFourHoursAgo.toISOString())
      .not('platform_post_id', 'is', null);

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch posts: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        message: 'No posts to track in the last 24 hours',
        collected: 0,
        failed: 0,
      });
    }

    const result: CollectionResult = {
      success: true,
      collected: 0,
      failed: 0,
      errors: [],
    };

    // Process each post
    for (const post of posts) {
      try {
        const postUrl = `https://www.instagram.com/p/${post.platform_post_id}/`;
        const hoursSincePosted = Math.floor(
          (now.getTime() - new Date(post.posted_at).getTime()) / (1000 * 60 * 60)
        );

        // Skip if we already have a snapshot for this hour
        const { data: existingSnapshot } = await supabase
          .from('post_metrics_hourly')
          .select('id')
          .eq('marketing_content_id', post.id)
          .eq('hours_since_posted', hoursSincePosted)
          .single();

        if (existingSnapshot) {
          console.log(`[metrics-collect] Snapshot already exists for ${post.id} at hour ${hoursSincePosted}`);
          continue;
        }

        // Scrape current metrics
        const metrics = await scrapeInstagramPostMetrics(postUrl);

        const engagementRate = calculateEngagementRate(
          metrics.likes,
          metrics.comments,
          0, // shares not available via public scraping
          metrics.saves,
          metrics.views
        );

        // Store hourly snapshot
        const { error: insertError } = await supabase
          .from('post_metrics_hourly')
          .insert({
            marketing_content_id: post.id,
            platform: 'instagram',
            platform_post_id: post.platform_post_id,
            views: metrics.views,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: 0,
            saves: metrics.saves,
            engagement_rate: engagementRate,
            snapshot_at: now.toISOString(),
            hours_since_posted: hoursSincePosted,
          });

        if (insertError) {
          result.errors.push(`Failed to insert snapshot for ${post.id}: ${insertError.message}`);
          result.failed++;
        } else {
          result.collected++;

          // Update the main content record with latest metrics
          await supabase
            .from('marketing_content_queue')
            .update({
              views: metrics.views,
              likes: metrics.likes,
              comments: metrics.comments,
              saves: metrics.saves,
              engagement_rate: engagementRate,
              updated_at: now.toISOString(),
            })
            .eq('id', post.id);
        }

        // Rate limit: 2 second delay between scrapes
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[metrics-collect] Failed to collect metrics for ${post.id}:`, errorMessage);
        result.errors.push(`Post ${post.id}: ${errorMessage}`);
        result.failed++;
      }
    }

    return NextResponse.json({
      success: result.failed === 0,
      collected: result.collected,
      failed: result.failed,
      totalPosts: posts.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: `Collection failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/metrics/collect
 * Returns collection status and recent snapshots
 */
export async function GET(req: NextRequest) {
  try {
    assertMarketingKey(req);

    const supabase = getSupabaseServer();

    // Get recent snapshots
    const { data: recentSnapshots, error } = await supabase
      .from('post_metrics_hourly')
      .select('*, marketing_content_queue(topic, format, posted_at)')
      .order('snapshot_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch snapshots: ${error.message}` },
        { status: 500 }
      );
    }

    // Get tracking summary
    const { data: activePosts } = await supabase
      .from('marketing_content_queue')
      .select('id, topic, posted_at, platform_post_id')
      .eq('status', 'posted')
      .gte('posted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      recentSnapshots: recentSnapshots || [],
      activelyTracking: activePosts?.length || 0,
      activePosts: activePosts || [],
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: `Failed to get status: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
