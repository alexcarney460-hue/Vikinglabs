import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail, listAffiliatePayouts } from '@/lib/affiliates';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    // Get query params
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    // List payouts for this affiliate
    const payouts = await listAffiliatePayouts(affiliate.id, limit);

    return NextResponse.json({ ok: true, payouts });
  } catch (error) {
    console.error('[affiliate/payouts] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
