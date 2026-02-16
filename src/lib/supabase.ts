import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}

export function hasSupabase(): boolean {
  return !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
}
