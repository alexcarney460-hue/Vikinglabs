-- Marketing Content Queue Schema
CREATE TABLE IF NOT EXISTS public.marketing_content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  format TEXT NOT NULL,
  topic TEXT NOT NULL,
  hook TEXT NOT NULL,
  script TEXT[] NOT NULL,
  caption TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  cta TEXT NOT NULL,
  compliance JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'killed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketing_content_queue ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all - admin only for production)
CREATE POLICY "Allow all access for now" ON public.marketing_content_queue
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_marketing_content_status ON public.marketing_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_marketing_content_platform ON public.marketing_content_queue(platform);
CREATE INDEX IF NOT EXISTS idx_marketing_content_created_at ON public.marketing_content_queue(created_at DESC);
