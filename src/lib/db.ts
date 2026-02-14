import { ensureDatabaseEnv } from './db-env';
import { createPool } from '@vercel/postgres';

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;

let cachedSql: SqlTag | null = null;

function getConnectionUrl(): string | undefined {
  ensureDatabaseEnv();
  return process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
}

export function hasPooledDatabase() {
  return !!getConnectionUrl();
}

export async function getSql(): Promise<SqlTag | null> {
  if (cachedSql !== null) return cachedSql;
  try {
    const dbUrl = getConnectionUrl();
    if (!dbUrl) {
      console.error('[db] No database URL found. Checked POSTGRES_URL, POSTGRES_PRISMA_URL, DATABASE_URL');
      console.error('[db] Available env keys:', Object.keys(process.env).filter(k => /postgres|database|prisma/i.test(k)).join(', '));
      return null;
    }
    console.log('[db] Connecting with URL from:', dbUrl.startsWith('postgres') ? dbUrl.substring(0, 30) + '...' : 'masked');
    const pool = createPool({ connectionString: dbUrl });
    cachedSql = pool.sql.bind(pool);
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
