import { NextResponse } from 'next/server';
import { getSql, hasPooledDatabase } from '@/lib/db';
import { ensureDatabaseEnv } from '@/lib/db-env';

export async function GET() {
  ensureDatabaseEnv();
  
  const postgresUrl = process.env.POSTGRES_URL || '';
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // Mask connection strings for safety
  const mask = (s: string) => s ? s.replace(/\/\/[^@]+@/, '//***:***@').substring(0, 80) + '...' : '(not set)';
  
  const info: Record<string, unknown> = {
    hasPooledDatabase: hasPooledDatabase(),
    POSTGRES_URL: mask(postgresUrl),
    DATABASE_URL: mask(databaseUrl),
  };

  try {
    const sql = await getSql();
    if (!sql) {
      return NextResponse.json({ ...info, status: 'error', message: 'getSql() returned null — no database connection available' });
    }
    
    const result = await sql`SELECT NOW() as current_time, current_database() as db_name`;
    info.status = 'connected';
    info.result = result.rows[0];
    return NextResponse.json(info);
  } catch (err: any) {
    info.status = 'error';
    info.error = err.message;
    info.code = err.code;
    return NextResponse.json(info, { status: 500 });
  }
}
