import { ensureDatabaseEnv } from './db-env';

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;

let cachedSql: SqlTag | null | undefined;

function getConnectionUrl(): string | undefined {
  ensureDatabaseEnv();
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || undefined;
}

function isPooledConnectionString(url: string): boolean {
  const lowered = url.toLowerCase();
  // Prisma Accelerate URLs are NOT direct postgres connections
  if (lowered.startsWith('prisma+postgres://')) return false;
  if (lowered.includes('db.prisma.io')) return false;
  // Neon/Supabase pooled connections
  if (lowered.includes('-pooler.') || lowered.includes(':6543')) return true;
  if (lowered.includes('pgbouncer=true')) return true;
  return false;
}

export function hasPooledDatabase() {
  return !!getConnectionUrl();
}

export async function getSql(): Promise<SqlTag | null> {
  if (cachedSql !== undefined) return cachedSql;

  const dbUrl = getConnectionUrl();
  if (!dbUrl) {
    console.error('[db] No database URL found. Checked POSTGRES_URL, DATABASE_URL');
    console.error('[db] Available env keys:', Object.keys(process.env).filter(k => /postgres|database|prisma/i.test(k)).join(', '));
    cachedSql = null;
    return null;
  }

  try {
    const mod = await import('@vercel/postgres');
    const masked = dbUrl.substring(0, 30) + '...';

    if (isPooledConnectionString(dbUrl)) {
      // Pooled connection — use createPool
      console.log('[db] Using pooled connection:', masked);
      const pool = mod.createPool({ connectionString: dbUrl });
      cachedSql = pool.sql.bind(pool) as SqlTag;
    } else {
      // Direct connection — must use createClient (NOT createPool or sql tag)
      console.log('[db] Using direct connection (createClient):', masked);
      const client = mod.createClient({ connectionString: dbUrl });
      await client.connect();
      cachedSql = client.sql.bind(client) as SqlTag;
    }

    // Verify connectivity
    await cachedSql`SELECT 1`;
    console.log('[db] Database connection verified');
    return cachedSql;
  } catch (err) {
    console.error('[db] Database initialization error:', err);
    cachedSql = null;
    return null;
  }
}
