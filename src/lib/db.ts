import { ensureDatabaseEnv } from './db-env';
import { sql as vercelSql } from '@vercel/postgres';

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;

let cachedSql: SqlTag | null = null;

export async function getSql(): Promise<SqlTag | null> {
  if (cachedSql !== null) return cachedSql;
  try {
    ensureDatabaseEnv();
    const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('No database URL found. Checked POSTGRES_PRISMA_URL, POSTGRES_URL, DATABASE_URL');
      return null;
    }
    // Use @vercel/postgres which handles the connection pooling
    cachedSql = vercelSql;
    return cachedSql;
  } catch (err) {
    console.error('Database initialization error:', err);
    return null;
  }
}
