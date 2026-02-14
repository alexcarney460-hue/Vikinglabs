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
  
  // Skip @vercel/postgres if using Prisma Accelerate proxy (db.prisma.io) or if Supabase is configured
  const isPrismaProxy = dbUrl && (dbUrl.includes('db.prisma.io') || dbUrl.includes('prisma+postgres://'));
  if (!dbUrl || isPrismaProxy) {
    // Use Supabase if available
    if (hasSupabase()) {
      console.log('[db] Using Supabase for database access');
      cachedSql = null; // Callers should use getSupabase()
      return null;
    }
    
    if (!dbUrl) {
      console.error('[db] No database URL found. Configure SUPABASE_URL or POSTGRES_URL');
    } else {
      console.error('[db] Prisma Accelerate proxy detected. Use Supabase credentials instead.');
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
