-- Update marketing_content_queue table to track posted content
-- Run this in Supabase SQL Editor

ALTER TABLE public.marketing_content_queue
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_post_id TEXT,
ADD COLUMN IF NOT EXISTS platform_post_url TEXT;

-- Update table comments
COMMENT ON COLUMN public.marketing_content_queue.posted_at IS 'Timestamp when content was posted to platform';
COMMENT ON COLUMN public.marketing_content_queue.platform_post_id IS 'Post ID from Instagram/TikTok (for metrics tracking)';
COMMENT ON COLUMN public.marketing_content_queue.platform_post_url IS 'Direct URL to posted content on platform';

-- Create index for quick lookups of posted content
CREATE INDEX IF NOT EXISTS idx_marketing_content_posted_at ON public.marketing_content_queue(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_content_platform_post_id ON public.marketing_content_queue(platform_post_id);
