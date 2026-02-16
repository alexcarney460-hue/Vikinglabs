-- Cleanup test API keys created during testing
-- Run this in Supabase SQL Editor after testing

-- List all test keys before deletion
SELECT 
  id,
  affiliate_id,
  last4,
  created_at
FROM affiliate_api_keys
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Uncomment below to delete test keys (BE CAREFUL!)
-- DELETE FROM affiliate_api_keys 
-- WHERE id = '987f2090-e4e9-48c0-acff-462698a03d5b';

-- Or delete all keys created in the last hour (testing only!)
-- DELETE FROM affiliate_api_keys
-- WHERE created_at > NOW() - INTERVAL '1 hour';
