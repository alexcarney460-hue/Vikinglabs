-- Create affiliate_api_keys table
CREATE TABLE IF NOT EXISTS affiliate_api_keys (
  id uuid PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliate_applications(id) ON DELETE CASCADE,
  hash text NOT NULL UNIQUE,
  last4 text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['read:affiliate'],
  revoked_at timestamptz NULL,
  created_at timestamptz NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_affiliate ON affiliate_api_keys(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON affiliate_api_keys(hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON affiliate_api_keys(revoked_at) WHERE revoked_at IS NOT NULL;
