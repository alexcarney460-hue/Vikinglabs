import { NextResponse, NextRequest } from 'next/server';
import { authenticateAffiliate } from '@/lib/affiliate-auth';
import { listAffiliateConversions } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authenticateAffiliate(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    const conversions = await listAffiliateConversions(auth.affiliate.id, limit);

    return NextResponse.json({ ok: true, conversions });
  } catch (error) {
    console.error('[affiliate/conversions] Error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch conversions' }, { status: 500 });
  }
}
