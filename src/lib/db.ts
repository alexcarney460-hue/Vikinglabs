import { ensureDatabaseEnv } from './db-env';

type SqlTag = (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;

let cachedSql: SqlTag | null | undefined;

function hasPooledConnectionString(url?: string) {
  if (!url) return false;
  const lowered = url.toLowerCase();
  if (lowered.startsWith('prisma+postgres://')) return false;
  if (lowered.includes('db.prisma.io')) return false;
  if (lowered.includes('neon.tech') && lowered.includes('pooler')) return true;
  if (lowered.includes('pooler')) return true;
  if (lowered.includes('pgbouncer=true')) return true;
  return false;
}

export function hasPooledDatabase() {
  ensureDatabaseEnv();
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
  return hasPooledConnectionString(url);
}

export async function getSql(): Promise<SqlTag | null> {
  if (cachedSql !== undefined) return cachedSql;
  if (!hasPooledDatabase()) {
    cachedSql = null;
    return cachedSql;
  }
  const mod = await import('@vercel/postgres');
  cachedSql = mod.sql as SqlTag;
  return cachedSql;
}
