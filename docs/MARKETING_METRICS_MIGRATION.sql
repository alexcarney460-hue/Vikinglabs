-- Migration: Add performance metrics to marketing_content_queue
-- Date: 2026-02-18
-- Purpose: Enable closed-loop learning from posted content

ALTER TABLE public.marketing_content_queue
ADD COLUMN views INTEGER,
ADD COLUMN likes INTEGER,
ADD COLUMN comments INTEGER,
ADD COLUMN shares INTEGER,
ADD COLUMN saves INTEGER,
ADD COLUMN engagement_rate FLOAT,
ADD COLUMN posted_at TIMESTAMPTZ,
ADD COLUMN platform_post_id TEXT;

-- Create index on posted_at for analytics queries
CREATE INDEX marketing_content_queue_posted_at_idx ON public.marketing_content_queue(posted_at DESC) WHERE posted_at IS NOT NULL;

-- Create index on platform_post_id for lookups
CREATE INDEX marketing_content_queue_platform_post_id_idx ON public.marketing_content_queue(platform_post_id) WHERE platform_post_id IS NOT NULL;
