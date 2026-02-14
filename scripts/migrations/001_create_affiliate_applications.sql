CREATE TABLE IF NOT EXISTS affiliate_applications (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  social_handle TEXT,
  audience_size TEXT,
  channels TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS affiliate_applications_status_idx
  ON affiliate_applications (status, created_at DESC);
