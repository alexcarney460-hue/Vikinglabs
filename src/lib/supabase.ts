import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[supabase] getSupabase() called');
  console.log('[supabase] SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('[supabase] SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('[supabase] url available:', !!url);
  console.log('[supabase] key available:', !!key);

  if (!url || !key) {
    console.error('[supabase] Missing SUPABASE_URL or key - returning null');
    return null;
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('[supabase] Client created successfully');
  return _client;
}

export function hasSupabase(): boolean {
  return !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
}
