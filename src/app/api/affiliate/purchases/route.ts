import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';
import { getSql, hasPooledDatabase } from '@/lib/db';
import { readJson } from '@/lib/storage';

export const dynamic = 'force-dynamic';

type Purchase = {
  id: string;
  orderId: string;
  amountCents: number;
  originalAmountCents: number;
  discountCents: number;
  discountPercent: number;
  status: string;
  createdAt: string;
};

type PurchasesResponse = {
  ok: boolean;
  error?: string;
  purchases?: Purchase[];
  total?: {
    count: number;
    amountCents: number;
    discountsCents: number;
  };
};

function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse<PurchasesResponse>> {
  const bearerToken = getAuthToken(req);
  let userEmail: string | undefined;

  if (bearerToken) {
    console.warn(
      '[affiliate/purchases] Bearer token auth not fully implemented, falling back to session'
    );
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
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    let purchases: Purchase[] = [];
    let totalCount = 0;
    let totalAmountCents = 0;
    let totalDiscountsCents = 0;

    // Try database first
    const sql = await (hasPooledDatabase() ? getSql() : Promise.resolve(null));
    if (sql) {
      try {
        // Get personal purchases for this affiliate (marked with isPersonalPurchase=true)
        const result = await sql`
          SELECT id, order_id, amount_cents, metadata, created_at
          FROM order_affiliates
          WHERE affiliate_id = ${affiliate.id}
          AND metadata->>'isPersonalPurchase' = 'true'
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        // Get total count
        const countResult = await sql`
          SELECT COUNT(*)::int as count FROM order_affiliates
          WHERE affiliate_id = ${affiliate.id}
          AND metadata->>'isPersonalPurchase' = 'true'
        `;

        totalCount = countResult.rows[0]?.count ?? 0;

        purchases = (result.rows as any[]).map((row) => {
          const metadata = row.metadata || {};
          const originalAmountCents = parseInt(
            metadata.originalPrice || row.amount_cents
          );
          const discountCents = parseInt(
            metadata.discountApplied || 0
          );
          const discountPercent =
            originalAmountCents > 0
              ? (discountCents / originalAmountCents) * 100
              : 0;

          totalAmountCents += row.amount_cents;
          totalDiscountsCents += discountCents;

          return {
            id: row.id,
            orderId: row.order_id,
            amountCents: row.amount_cents,
            originalAmountCents,
            discountCents,
            discountPercent,
            status: 'completed',
            createdAt: row.created_at,
          };
        });
      } catch (error) {
        console.error('[purchases] Database query failed:', error);
        // Fall through to file-based storage
      }
    }

    // Fallback to file storage if database failed
    if (purchases.length === 0) {
      try {
        const orderStore = await readJson<{ orders: any[] }>(
          'order-affiliates.json',
          { orders: [] }
        );

        const personalPurchases = orderStore.orders.filter(
          (o) =>
            o.affiliateId === affiliate.id &&
            o.metadata?.isPersonalPurchase === true
        );

        totalCount = personalPurchases.length;

        purchases = personalPurchases
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
          .slice(offset, offset + limit)
          .map((row) => {
            const metadata = row.metadata || {};
            const originalAmountCents = parseInt(
              metadata.originalPrice || row.amountCents || 0
            );
            const discountCents = parseInt(
              metadata.discountApplied || 0
            );
            const discountPercent =
              originalAmountCents > 0
                ? (discountCents / originalAmountCents) * 100
                : 0;

            totalAmountCents += row.amountCents || 0;
            totalDiscountsCents += discountCents;

            return {
              id: row.id,
              orderId: row.orderId,
              amountCents: row.amountCents || 0,
              originalAmountCents,
              discountCents,
              discountPercent,
              status: 'completed',
              createdAt: row.createdAt,
            };
          });
      } catch (error) {
        console.error('[purchases] File storage fallback failed:', error);
      }
    }

    return NextResponse.json({
      ok: true,
      purchases,
      total: {
        count: totalCount,
        amountCents: totalAmountCents,
        discountsCents: totalDiscountsCents,
      },
    });
  } catch (error) {
    console.error('[affiliate/purchases] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
