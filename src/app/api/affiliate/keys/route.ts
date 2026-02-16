import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import {
  createAffiliateApiKey,
  getAffiliateApiKeyByAffiliateId,
  revokeAffiliateApiKey,
  getAffiliateApiKeyByHash,
  getAffiliateByEmail,
} from '@/lib/affiliates';
import { hasUserEmail } from '@/lib/session-guards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!hasUserEmail(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const apiKey = await getAffiliateApiKeyByAffiliateId(affiliate.id);

    if (!apiKey) {
      return NextResponse.json({ keys: [] });
    }

    // Don't expose the full hash, only last 4 chars
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
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!hasUserEmail(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const { key, keyRecord } = await createAffiliateApiKey(affiliate.id);

    // Only show the raw key once
    return NextResponse.json(
      {
        message: 'API key created successfully. Save this key - you will not see it again.',
        key, // Raw key shown only at creation
        keyRecord: {
          id: keyRecord.id,
          last4: keyRecord.last4,
          createdAt: keyRecord.createdAt,
          scopes: keyRecord.scopes,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!hasUserEmail(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const affiliate = await getAffiliateByEmail(email);
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    const success = await revokeAffiliateApiKey(affiliate.id);

    if (!success) {
      return NextResponse.json({ error: 'No API key found to revoke' }, { status: 404 });
    }

    return NextResponse.json({ message: 'API key revoked successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
