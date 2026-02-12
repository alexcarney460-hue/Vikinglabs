import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { updateAffiliateApplication } from '@/lib/affiliates';
import type { AffiliateStatus } from '@/lib/affiliates';

const allowed = new Set<AffiliateStatus>(['approved', 'declined', 'pending', 'needs_info']);

export async function PATCH(req: Request, context: any) {
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
    const body = await req.json();
    const status = typeof body?.status === 'string' ? (body.status as AffiliateStatus) : undefined;
    if (status && !allowed.has(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const signupCreditCents = Number.isFinite(body?.signupCreditCents)
      ? Number(body.signupCreditCents)
      : undefined;
    const discordUserId = typeof body?.discordUserId === 'string' ? body.discordUserId.trim() || null : undefined;
    const autoInvite = Boolean(body?.autoInvite);

    if (!status && signupCreditCents === undefined && discordUserId === undefined) {
      return NextResponse.json({ error: 'No changes provided.' }, { status: 400 });
    }

    const updated = await updateAffiliateApplication({
      id,
      status,
      signupCreditCents,
      discordUserId,
      autoInvite,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error('Affiliate status update error', error);
    return NextResponse.json({ error: 'Unable to update status.' }, { status: 500 });
  }
}
