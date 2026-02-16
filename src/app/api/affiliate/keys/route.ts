import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import {
  createAffiliateApiKey,
  getAffiliateApiKeyByAffiliateId,
  revokeAffiliateApiKey,
  getAffiliateByEmail,
} from '@/lib/affiliates';
import { hasUserEmail } from '@/lib/session-guards';
import { authenticateAffiliate } from '@/lib/affiliate-auth';

export const dynamic = 'force-dynamic';

/**
 * Helper to get affiliate from session or Bearer token.
 * Keys management requires session auth for POST/DELETE (security),
 * but GET supports Bearer tokens too.
 */
async function getAffiliateFromSession(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!hasUserEmail(session)) return null;
  const email = session?.user?.email;
  if (!email) return null;
  return getAffiliateByEmail(email);
}

export async function GET(req: NextRequest) {
  // Support both session and Bearer token auth for listing keys
  const auth = await authenticateAffiliate(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const apiKey = await getAffiliateApiKeyByAffiliateId(auth.affiliate.id);

    if (!apiKey) {
      return NextResponse.json({ keys: [] });
    }

    return NextResponse.json({
      keys: [
        {
          id: apiKey.id,
          last4: apiKey.last4,
          createdAt: apiKey.createdAt,
          revokedAt: apiKey.revokedAt,
          scopes: apiKey.scopes,
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Key creation requires session auth only (not Bearer) for security
  const affiliate = await getAffiliateFromSession(req);
  if (!affiliate) {
    return NextResponse.json({ error: 'Unauthorized - session required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    const { key, keyRecord } = await createAffiliateApiKey(affiliate.id);

    return NextResponse.json(
      {
        message: 'API key created successfully. Save this key - you will not see it again.',
        key,
        keyRecord: {
          id: keyRecord.id,
          last4: keyRecord.last4,
          createdAt: keyRecord.createdAt,
          scopes: keyRecord.scopes,
          name: name || `Key ${keyRecord.last4}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/affiliate/keys]', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

// DELETE moved to /api/affiliate/keys/[id]/route.ts for proper dynamic routing
