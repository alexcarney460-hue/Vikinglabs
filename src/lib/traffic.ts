import { getSql, hasPooledDatabase } from '@/lib/db';
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

  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureTrafficTable();
      await sql`
        INSERT INTO page_views (id, path, referrer, user_agent, created_at)
        VALUES (${input.id}, ${input.path}, ${input.referrer ?? null}, ${input.userAgent ?? null}, ${input.createdAt})
      `;
      return;
    }
  }

  const store = await readJson<PageViewStore>(STORAGE_FILE, EMPTY_STORE);
  store.views.unshift({
    id: input.id,
    path: input.path,
    referrer: input.referrer ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: input.createdAt,
  });
  await writeJson(STORAGE_FILE, store);
}

export async function getTrafficSummary(): Promise<{ day: number; week: number; month: number }> {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (hasDatabase()) {
    const sql = await getSql();
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
  }

  const store = await readJson<PageViewStore>(STORAGE_FILE, EMPTY_STORE);
  const views = store.views;
  return {
    day: views.filter((v) => v.createdAt >= dayAgo).length,
    week: views.filter((v) => v.createdAt >= weekAgo).length,
    month: views.filter((v) => v.createdAt >= monthAgo).length,
  };
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

  if (hasDatabase()) {
    const sql = await getSql();
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
    }
  } else {
    const store = await readJson<PageViewStore>(STORAGE_FILE, EMPTY_STORE);
    for (const view of store.views) {
      if (view.createdAt < start.toISOString()) continue;
      const key = new Date(view.createdAt).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}
