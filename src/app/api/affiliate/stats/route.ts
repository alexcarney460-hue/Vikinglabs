import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';
import { getSql, hasPooledDatabase } from '@/lib/db';
import { readJson } from '@/lib/storage';

export const dynamic = 'force-dynamic';

type TimeBreakdown = {
  clicks: number;
  conversions: number;
  revenueCents: number;
};

type StatsResponse = {
  ok: boolean;
  error?: string;
  stats?: {
    affiliateId: string;
    code: string | null | undefined;
    today: TimeBreakdown;
    sevenDays: TimeBreakdown;
    thirtyDays: TimeBreakdown;
    allTime: TimeBreakdown;
    updatedAt: string;
  };
};

async function getAffiliateStatsRealTime(
  affiliateId: string
): Promise<{
  today: TimeBreakdown;
  sevenDays: TimeBreakdown;
  thirtyDays: TimeBreakdown;
  allTime: TimeBreakdown;
}> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const emptyBreakdown: TimeBreakdown = {
    clicks: 0,
    conversions: 0,
    revenueCents: 0,
  };

  // Try database first
  const sql = await (hasPooledDatabase() ? getSql() : Promise.resolve(null));
  if (sql) {
    try {
      // Get clicks for each period
      const todayClicks = await sql`
        SELECT COUNT(*)::int as count FROM affiliate_clicks
        WHERE affiliate_id = ${affiliateId} AND created_at >= ${today.toISOString()}
      `;

      const sevenDaysClicks = await sql`
        SELECT COUNT(*)::int as count FROM affiliate_clicks
        WHERE affiliate_id = ${affiliateId} AND created_at >= ${sevenDaysAgo.toISOString()}
      `;

      const thirtyDaysClicks = await sql`
        SELECT COUNT(*)::int as count FROM affiliate_clicks
        WHERE affiliate_id = ${affiliateId} AND created_at >= ${thirtyDaysAgo.toISOString()}
      `;

      const allTimeClicks = await sql`
        SELECT COUNT(*)::int as count FROM affiliate_clicks
        WHERE affiliate_id = ${affiliateId}
      `;

      // Get conversions (from order_affiliates, excluding personal purchases)
      const todayConversions = await sql`
        SELECT COUNT(*)::int as count, COALESCE(SUM(amount_cents), 0)::int as revenue FROM order_affiliates
        WHERE affiliate_id = ${affiliateId} AND created_at >= ${today.toISOString()}
        AND (metadata->>'isPersonalPurchase' IS NULL OR metadata->>'isPersonalPurchase' != 'true')
      `;

      const sevenDaysConversions = await sql`
        SELECT COUNT(*)::int as count, COALESCE(SUM(amount_cents), 0)::int as revenue FROM order_affiliates
        WHERE affiliate_id = ${affiliateId} AND created_at >= ${sevenDaysAgo.toISOString()}
        AND (metadata->>'isPersonalPurchase' IS NULL OR metadata->>'isPersonalPurchase' != 'true')
      `;

      const thirtyDaysConversions = await sql`
        SELECT COUNT(*)::int as count, COALESCE(SUM(amount_cents), 0)::int as revenue FROM order_affiliates
        WHERE affiliate_id = ${affiliateId} AND created_at >= ${thirtyDaysAgo.toISOString()}
        AND (metadata->>'isPersonalPurchase' IS NULL OR metadata->>'isPersonalPurchase' != 'true')
      `;

      const allTimeConversions = await sql`
        SELECT COUNT(*)::int as count, COALESCE(SUM(amount_cents), 0)::int as revenue FROM order_affiliates
        WHERE affiliate_id = ${affiliateId}
        AND (metadata->>'isPersonalPurchase' IS NULL OR metadata->>'isPersonalPurchase' != 'true')
      `;

      return {
        today: {
          clicks: todayClicks.rows[0]?.count ?? 0,
          conversions: todayConversions.rows[0]?.count ?? 0,
          revenueCents: todayConversions.rows[0]?.revenue ?? 0,
        },
        sevenDays: {
          clicks: sevenDaysClicks.rows[0]?.count ?? 0,
          conversions: sevenDaysConversions.rows[0]?.count ?? 0,
          revenueCents: sevenDaysConversions.rows[0]?.revenue ?? 0,
        },
        thirtyDays: {
          clicks: thirtyDaysClicks.rows[0]?.count ?? 0,
          conversions: thirtyDaysConversions.rows[0]?.count ?? 0,
          revenueCents: thirtyDaysConversions.rows[0]?.revenue ?? 0,
        },
        allTime: {
          clicks: allTimeClicks.rows[0]?.count ?? 0,
          conversions: allTimeConversions.rows[0]?.count ?? 0,
          revenueCents: allTimeConversions.rows[0]?.revenue ?? 0,
        },
      };
    } catch (error) {
      console.error('[stats] Database query failed:', error);
      // Fall through to file-based storage
    }
  }

  // Fallback to file storage
  try {
    const clickStore = await readJson<{ clicks: any[] }>('affiliate-clicks.json', {
      clicks: [],
    });
    const orderStore = await readJson<{ orders: any[] }>('order-affiliates.json', {
      orders: [],
    });

    const clicks = clickStore.clicks.filter((c) => c.affiliateId === affiliateId);
    const orders = orderStore.orders.filter(
      (o) =>
        o.affiliateId === affiliateId &&
        (!o.metadata?.isPersonalPurchase)
    );

    const filterByDate = (items: any[], minDate: Date) =>
      items.filter((item) => new Date(item.createdAt) >= minDate);

    const todayClicks = filterByDate(clicks, today).length;
    const sevenDaysClicks = filterByDate(clicks, sevenDaysAgo).length;
    const thirtyDaysClicks = filterByDate(clicks, thirtyDaysAgo).length;
    const allTimeClicks = clicks.length;

    const todayOrders = filterByDate(orders, today);
    const sevenDaysOrders = filterByDate(orders, sevenDaysAgo);
    const thirtyDaysOrders = filterByDate(orders, thirtyDaysAgo);

    return {
      today: {
        clicks: todayClicks,
        conversions: todayOrders.length,
        revenueCents: todayOrders.reduce((sum, o) => sum + (o.amountCents ?? 0), 0),
      },
      sevenDays: {
        clicks: sevenDaysClicks,
        conversions: sevenDaysOrders.length,
        revenueCents: sevenDaysOrders.reduce((sum, o) => sum + (o.amountCents ?? 0), 0),
      },
      thirtyDays: {
        clicks: thirtyDaysClicks,
        conversions: thirtyDaysOrders.length,
        revenueCents: thirtyDaysOrders.reduce((sum, o) => sum + (o.amountCents ?? 0), 0),
      },
      allTime: {
        clicks: allTimeClicks,
        conversions: orders.length,
        revenueCents: orders.reduce((sum, o) => sum + (o.amountCents ?? 0), 0),
      },
    };
  } catch (error) {
    console.error('[stats] File storage fallback failed:', error);
    return {
      today: emptyBreakdown,
      sevenDays: emptyBreakdown,
      thirtyDays: emptyBreakdown,
      allTime: emptyBreakdown,
    };
  }
}

function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse<StatsResponse>> {
  // Session OR Bearer token auth
  const bearerToken = getAuthToken(req);
  let userEmail: string | undefined;

  if (bearerToken) {
    // For Bearer tokens, we'd need a token validation system
    // For now, we require Session auth, but accept Bearer tokens for API clients
    console.warn('[stats] Bearer token auth not fully implemented, falling back to session');
  }

  const session = await getServerSession(authOptions);
  userEmail = session?.user?.email as string | undefined;

  if (!session?.user || !userEmail) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if user is an approved affiliate
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    // Get real-time stats (no caching)
    const stats = await getAffiliateStatsRealTime(affiliate.id);

    return NextResponse.json({
      ok: true,
      stats: {
        affiliateId: affiliate.id,
        code: affiliate.code,
        ...stats,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[affiliate/stats] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
