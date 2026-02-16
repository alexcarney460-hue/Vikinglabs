import { NextResponse, NextRequest } from 'next/server';
import { authenticateAffiliate } from '@/lib/affiliate-auth';
import { listAffiliatePayouts } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authenticateAffiliate(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const payouts = await listAffiliatePayouts(auth.affiliate.id, limit);

    return NextResponse.json({ ok: true, payouts });
  } catch (error) {
    console.error('[affiliate/payouts] Error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
