import { getSql, hasPooledDatabase } from '@/lib/db';
import { getSupabase } from '@/lib/supabase';
import { readJson, writeJson } from '@/lib/storage';

export type PageViewRecord = {
  id: string;
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

type PageViewStore = { views: PageViewRecord[] };
const STORAGE_FILE = 'page-views.json';
const EMPTY_STORE: PageViewStore = { views: [] };

function hasDatabase() {
  return hasPooledDatabase();
}

async function ensureTrafficTable() {
  const sql = await getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS page_views (
      id uuid PRIMARY KEY,
      path text NOT NULL,
      referrer text NULL,
      user_agent text NULL,
      created_at timestamptz NOT NULL
    );
  `;
}

export async function recordPageView(input: {
  id: string;
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  createdAt: string;
}): Promise<void> {
  if (!input.path) return;

  try {
    // Try @vercel/postgres first
    let sql = await getSql();
    
    // Fall back to Supabase
    if (!sql) {
      const supabase = getSupabase();
      if (!supabase) {
        console.error('[Traffic] No database available; page view lost:', input.path);
        return;
      }

      const { error } = await supabase
        .from('page_views')
        .insert({
          id: input.id,
          path: input.path,
          referrer: input.referrer ?? null,
          user_agent: input.userAgent ?? null,
          created_at: input.createdAt,
        });

      if (error) {
        console.error('[Traffic] Supabase insert failed:', error);
      }
      return;
    }

    // Use @vercel/postgres
    await ensureTrafficTable();
    await sql`
      INSERT INTO page_views (id, path, referrer, user_agent, created_at)
      VALUES (${input.id}, ${input.path}, ${input.referrer ?? null}, ${input.userAgent ?? null}, ${input.createdAt})
    `;
  } catch (error) {
    console.error('[Traffic] Failed to record page view:', error);
  }
}

export async function getTrafficSummary(): Promise<{ day: number; week: number; month: number }> {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Try @vercel/postgres first
    let sql = await getSql();
    
    if (sql) {
      await ensureTrafficTable();
      const day = await sql`SELECT COUNT(*)::int AS count FROM page_views WHERE created_at >= ${dayAgo}`;
      const week = await sql`SELECT COUNT(*)::int AS count FROM page_views WHERE created_at >= ${weekAgo}`;
      const month = await sql`SELECT COUNT(*)::int AS count FROM page_views WHERE created_at >= ${monthAgo}`;
      return {
        day: (day.rows[0] as any)?.count ?? 0,
        week: (week.rows[0] as any)?.count ?? 0,
        month: (month.rows[0] as any)?.count ?? 0,
      };
    }

    // Fall back to Supabase
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[Traffic] Database not available; returning 0 counts');
      return { day: 0, week: 0, month: 0 };
    }

    const { data: dayData, error: dayErr } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dayAgo);

    const { data: weekData, error: weekErr } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    const { data: monthData, error: monthErr } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo);

    if (dayErr || weekErr || monthErr) {
      console.error('[Traffic] Supabase query failed');
      return { day: 0, week: 0, month: 0 };
    }

    return {
      day: dayData?.length ?? 0,
      week: weekData?.length ?? 0,
      month: monthData?.length ?? 0,
    };
  } catch (error) {
    console.error('[Traffic] Failed to fetch summary:', error);
    return { day: 0, week: 0, month: 0 };
  }
}

export async function getDailyTraffic(days = 30): Promise<Array<{ date: string; count: number }>> {
  const today = new Date();
  const start = new Date(today);
  start.setUTCHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  try {
    // Try @vercel/postgres first
    let sql = await getSql();
    
    if (sql) {
      await ensureTrafficTable();
      const rows = await sql`
        SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::int AS count
        FROM page_views
        WHERE created_at >= ${start.toISOString()}
        GROUP BY day
        ORDER BY day ASC
      `;
      for (const row of rows.rows as Array<{ day: string; count: number }>) {
        const key = new Date(row.day).toISOString().slice(0, 10);
        buckets.set(key, row.count);
      }
      return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
    }

    // Fall back to Supabase
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[Traffic] Database not available; returning empty daily traffic');
      return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
    }

    const { data, error } = await supabase
      .from('page_views')
      .select('created_at')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Traffic] Supabase query failed:', error);
      return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
    }

    // Group by date
    for (const row of data || []) {
      const key = new Date(row.created_at).toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }
  } catch (error) {
    console.error('[Traffic] Failed to fetch daily traffic:', error);
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
