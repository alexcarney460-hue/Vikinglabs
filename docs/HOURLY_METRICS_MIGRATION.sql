-- Migration: Hourly Metrics Tracking for Performance Analysis
-- Date: 2026-02-19
-- Purpose: Store hourly snapshots of Instagram/TikTok metrics for 24h post-posting
-- Enables time-series analysis of engagement velocity and optimal posting times

-- Table: post_metrics_hourly
-- Stores hourly snapshots of post performance
CREATE TABLE IF NOT EXISTS public.post_metrics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_content_id UUID NOT NULL REFERENCES public.marketing_content_queue(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  platform_post_id TEXT NOT NULL,
  
  -- Metrics snapshot
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate NUMERIC(6,5) DEFAULT 0,
  
  -- Timing
  snapshot_at TIMESTAMPTZ NOT NULL,
  hours_since_posted INTEGER NOT NULL, -- 0-24
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate snapshots
  UNIQUE(marketing_content_id, hours_since_posted)
);

-- Indexes for fast queries
CREATE INDEX post_metrics_hourly_content_idx ON public.post_metrics_hourly(marketing_content_id);
CREATE INDEX post_metrics_hourly_platform_idx ON public.post_metrics_hourly(platform, platform_post_id);
CREATE INDEX post_metrics_hourly_snapshot_at_idx ON public.post_metrics_hourly(snapshot_at DESC);

-- Enable RLS
ALTER TABLE public.post_metrics_hourly ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all access via service role (API routes)
CREATE POLICY "Enable all access for service role" ON public.post_metrics_hourly
  FOR ALL USING (true);

-- View: Latest metrics per post
CREATE OR REPLACE VIEW public.post_metrics_latest AS
SELECT DISTINCT ON (marketing_content_id)
  marketing_content_id,
  platform,
  platform_post_id,
  views,
  likes,
  comments,
  shares,
  saves,
  engagement_rate,
  snapshot_at,
  hours_since_posted
FROM public.post_metrics_hourly
ORDER BY marketing_content_id, snapshot_at DESC;

COMMENT ON TABLE public.post_metrics_hourly IS 'Hourly snapshots of Instagram/TikTok post metrics for 24 hours post-publishing';
COMMENT ON VIEW public.post_metrics_latest IS 'Latest metrics snapshot for each marketing content item';
