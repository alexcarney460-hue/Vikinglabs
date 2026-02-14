import { getSql, hasPooledDatabase } from '@/lib/db';
import { ensureAffiliateTables } from '@/lib/affiliates';
import { listOrders, type OrderRecord } from '@/lib/orders';
import { readJson } from '@/lib/storage';
import { getDailyTraffic, getTrafficSummary } from '@/lib/traffic';

type AffiliateClickStore = { clicks: Array<{ createdAt: string }> };
type OrderAffiliateStore = { orders: Array<{ amountCents?: number | null; createdAt: string }> };

function hasDatabase() {
  return hasPooledDatabase();
}

export type AdminAnalytics = {
  windowDays: number;
  traffic: {
    day: number;
    week: number;
    month: number;
    daily: Array<{ date: string; count: number }>;
  };
  orders: {
    count: number;
    revenueCents: number;
    byProvider: Record<string, { count: number; revenueCents: number }>;
    recent: OrderRecord[];
  };
  affiliates: {
    clicks: number;
    orders: number;
    revenueCents: number;
  };
};

export async function getAdminAnalytics(windowDays = 30): Promise<AdminAnalytics> {
  const sinceIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const recent = (await listOrders(50)).filter((o) => o.createdAt >= sinceIso);

  const byProvider: Record<string, { count: number; revenueCents: number }> = {};
  let revenueCents = 0;
  for (const o of recent) {
    revenueCents += o.amountCents;
    byProvider[o.provider] = byProvider[o.provider] || { count: 0, revenueCents: 0 };
    byProvider[o.provider].count += 1;
    byProvider[o.provider].revenueCents += o.amountCents;
  }

  let affiliateClicks = 0;
  let affiliateOrders = 0;
  let affiliateRevenueCents = 0;

  if (hasDatabase()) {
    const sql = await getSql();
    if (sql) {
      await ensureAffiliateTables();
      const clicks = await sql`
        SELECT COUNT(*)::int AS count
        FROM affiliate_clicks
        WHERE created_at >= ${sinceIso}
      `;
      affiliateClicks = (clicks.rows[0] as any)?.count ?? 0;

      const orders = await sql`
        SELECT COUNT(*)::int AS count,
               COALESCE(SUM(amount_cents), 0)::int AS "revenueCents"
        FROM order_affiliates
        WHERE created_at >= ${sinceIso}
      `;

      affiliateOrders = (orders.rows[0] as any)?.count ?? 0;
      affiliateRevenueCents = (orders.rows[0] as any)?.revenueCents ?? 0;
    }
  } else {
    const clickStore = await readJson<AffiliateClickStore>('affiliate-clicks.json', { clicks: [] });
    affiliateClicks = clickStore.clicks.filter((c) => c.createdAt >= sinceIso).length;

    const orderStore = await readJson<OrderAffiliateStore>('order-affiliates.json', { orders: [] });
    const filtered = orderStore.orders.filter((o) => o.createdAt >= sinceIso);
    affiliateOrders = filtered.length;
    affiliateRevenueCents = filtered.reduce((sum, o) => sum + (o.amountCents ?? 0), 0);
  }

  const trafficSummary = await getTrafficSummary();
  const daily = await getDailyTraffic(30);

  return {
    windowDays,
    traffic: { ...trafficSummary, daily },
    orders: {
      count: recent.length,
      revenueCents,
      byProvider,
      recent,
    },
    affiliates: {
      clicks: affiliateClicks,
      orders: affiliateOrders,
      revenueCents: affiliateRevenueCents,
    },
  };
}
