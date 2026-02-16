import { NextResponse, NextRequest } from 'next/server';
import { authenticateAffiliate } from '@/lib/affiliate-auth';
import { getAffiliateSummary } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authenticateAffiliate(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const summary = await getAffiliateSummary(auth.affiliate.id);
    if (!summary) {
      return NextResponse.json({ ok: false, error: 'Affiliate data not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error('[affiliate/summary] Error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch summary' }, { status: 500 });
  }
}
