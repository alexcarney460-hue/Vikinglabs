import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail, listAffiliateConversions } from '@/lib/affiliates';

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
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    // List conversions for this affiliate
    const conversions = await listAffiliateConversions(affiliate.id, limit);

    return NextResponse.json({ ok: true, conversions });
  } catch (error) {
    console.error('[affiliate/conversions] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch conversions' },
      { status: 500 }
    );
  }
}
