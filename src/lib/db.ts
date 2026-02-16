import { getSupabase, hasSupabase } from './supabase';
import { ensureDatabaseEnv } from './db-env';

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;

let cachedSql: SqlTag | null | undefined;

function getConnectionUrl(): string | undefined {
  ensureDatabaseEnv();
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || undefined;
}

function isPooledConnectionString(url: string): boolean {
  const lowered = url.toLowerCase();
  if (lowered.startsWith('prisma+postgres://')) return false;
  if (lowered.includes('db.prisma.io')) return false;
  if (lowered.includes('-pooler.') || lowered.includes(':6543')) return true;
  if (lowered.includes('pgbouncer=true')) return true;
  return false;
}

export function hasPooledDatabase() {
  return hasSupabase() || !!getConnectionUrl();
}

/**
 * Get a raw SQL tag function. Prefers @vercel/postgres if POSTGRES_URL is set,
 * otherwise returns null (callers should use getSupabase() for Supabase projects).
 */
export async function getSql(): Promise<SqlTag | null> {
  if (cachedSql !== undefined) return cachedSql;

  const dbUrl = getConnectionUrl();
  if (!dbUrl) {
    // No direct Postgres URL — if Supabase is configured, callers should use getSupabase()
    if (hasSupabase()) {
      console.log('[db] No POSTGRES_URL, but Supabase is configured. Use getSupabase() for queries.');
    } else {
      console.error('[db] No database URL found. Checked POSTGRES_URL, DATABASE_URL, SUPABASE_URL');
    }
    cachedSql = null;
    return null;
  }

  try {
    const mod = await import('@vercel/postgres');
    const masked = dbUrl.substring(0, 30) + '...';

    if (isPooledConnectionString(dbUrl)) {
      console.log('[db] Using pooled connection:', masked);
      const pool = mod.createPool({ connectionString: dbUrl });
      cachedSql = pool.sql.bind(pool) as SqlTag;
    } else {
      console.log('[db] Using direct connection (createClient):', masked);
      const client = mod.createClient({ connectionString: dbUrl });
      await client.connect();
      cachedSql = client.sql.bind(client) as SqlTag;
    }

    await cachedSql`SELECT 1`;
    console.log('[db] Database connection verified');
    return cachedSql;
  } catch (err) {
    console.error('[db] Database initialization error:', err);
    cachedSql = null;
    return null;
  }
}
