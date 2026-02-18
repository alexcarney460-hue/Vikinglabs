import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serviceClient: SupabaseClient | null = null;

/**
 * Get a server-side Supabase client authenticated with the service role key.
 * This should only be used in API routes and server components.
 * NEVER expose the service role key to the client.
 */
export function getSupabaseServer(): SupabaseClient {
  if (_serviceClient) {
    return _serviceClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  _serviceClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _serviceClient;
}
