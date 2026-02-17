-- Supabase schema for email authentication
-- Add these tables to your Viking Labs database

-- Users table (extend if needed)
-- Assumes you already have users table; add these columns if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'oauth'; -- 'oauth' or 'email'

-- Email verification tokens (temporary, single-use)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE, -- 6-digit code
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  CHECK (LENGTH(code) = 6),
  CHECK (expires_at > created_at)
);

CREATE INDEX idx_verification_tokens_email ON email_verification_tokens(email);
CREATE INDEX idx_verification_tokens_code ON email_verification_tokens(code);
CREATE INDEX idx_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Password reset tokens (temporary, single-use)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Random hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  
  CHECK (expires_at > created_at)
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);

-- Account linking (connect OAuth to email accounts)
CREATE TABLE IF NOT EXISTS account_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'apple', 'facebook', 'tiktok'
  provider_account_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_account_links_user_id ON account_links(user_id);
CREATE INDEX idx_account_links_provider ON account_links(provider, provider_account_id);

-- Enable RLS for security
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Verification tokens (service role only)
CREATE POLICY "Service role can manage verification tokens"
  ON email_verification_tokens
  USING (true)
  WITH CHECK (true);

-- RLS Policies: Password reset tokens (service role only)
CREATE POLICY "Service role can manage reset tokens"
  ON password_reset_tokens
  USING (true)
  WITH CHECK (true);

-- RLS Policies: Account links (users can see their own)
CREATE POLICY "Users can view their own account links"
  ON account_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Cleanup function: Remove expired tokens (run via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_tokens WHERE expires_at < NOW() AND used_at IS NULL;
  DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;
