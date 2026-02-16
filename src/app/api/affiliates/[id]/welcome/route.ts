import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateById, sendWelcomeEmail } from '@/lib/affiliates';

export async function POST(req: Request, context: any) {
  const paramsRaw = context?.params;
  const params = (typeof paramsRaw?.then === 'function') ? await paramsRaw : paramsRaw;
  const id = params?.id as string | undefined;

  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (!user || (user.role ?? 'user') !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing id.' }, { status: 400 });
  }

  try {
    const affiliate = await getAffiliateById(id);
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found.' }, { status: 404 });
    }

    if (affiliate.status !== 'approved') {
      return NextResponse.json({ error: 'Affiliate is not approved.' }, { status: 400 });
    }

    await sendWelcomeEmail(affiliate);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send welcome email.' }, { status: 500 });
  }
}
