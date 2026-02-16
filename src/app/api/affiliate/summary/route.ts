import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail, getAffiliateSummary } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email as string | undefined;

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

    // Get summary for this affiliate
    const summary = await getAffiliateSummary(affiliate.id);
    if (!summary) {
      return NextResponse.json(
        { ok: false, error: 'Affiliate data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error('[affiliate/summary] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
