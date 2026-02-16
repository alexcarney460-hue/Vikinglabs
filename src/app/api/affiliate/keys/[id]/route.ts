import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { revokeAffiliateApiKey, getAffiliateByEmail } from '@/lib/affiliates';
import { hasUserEmail } from '@/lib/session-guards';

export const dynamic = 'force-dynamic';

async function getAffiliateFromSession(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!hasUserEmail(session)) return null;
  const email = session?.user?.email;
  if (!email) return null;
  return getAffiliateByEmail(email);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  // Key revocation requires session auth only (not Bearer) for security
  const affiliate = await getAffiliateFromSession(req);
  if (!affiliate) {
    return NextResponse.json({ error: 'Unauthorized - session required' }, { status: 401 });
  }

  try {
    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ error: 'Key ID required' }, { status: 400 });
    }

    const success = await revokeAffiliateApiKey(affiliate.id);

    if (!success) {
      return NextResponse.json({ error: 'No API key found to revoke' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('[DELETE /api/affiliate/keys/[id]]', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }
}
