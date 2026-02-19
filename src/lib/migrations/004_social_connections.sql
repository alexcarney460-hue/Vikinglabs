-- Create social_connections table
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  expires_at TIMESTAMPTZ,
  account_id TEXT NOT NULL,
  account_username TEXT,
  scope TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, account_id)
);

-- Create social_posts table
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketing_content_id UUID REFERENCES marketing_content_queue(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  platform_post_id TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'posted', 'failed')),
  posted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_connections (admin only)
CREATE POLICY "Admin can read own social connections"
  ON public.social_connections FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY "Admin can insert own social connections"
  ON public.social_connections FOR INSERT
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admin can update own social connections"
  ON public.social_connections FOR UPDATE
  USING (admin_id = auth.uid());

CREATE POLICY "Admin can delete own social connections"
  ON public.social_connections FOR DELETE
  USING (admin_id = auth.uid());

-- RLS Policies for social_posts (admin only)
CREATE POLICY "Admin can read social posts"
  ON public.social_posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

CREATE POLICY "Admin can insert social posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
  ));

-- Indexes
CREATE INDEX idx_social_connections_admin_id ON public.social_connections(admin_id);
CREATE INDEX idx_social_connections_platform ON public.social_connections(platform);
CREATE INDEX idx_social_posts_marketing_content_id ON public.social_posts(marketing_content_id);
CREATE INDEX idx_social_posts_platform ON public.social_posts(platform);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);
