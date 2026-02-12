import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { updateAffiliateStatus } from '@/lib/affiliates';
import type { AffiliateStatus } from '@/lib/affiliates';

const allowed = new Set<AffiliateStatus>(['approved', 'declined', 'pending']);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (!user || (user.role ?? 'user') !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const status = typeof body?.status === 'string' ? (body.status as AffiliateStatus) : null;
    if (!status || !allowed.has(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const updated = await updateAffiliateStatus(params.id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error('Affiliate status update error', error);
    return NextResponse.json({ error: 'Unable to update status.' }, { status: 500 });
  }
}
