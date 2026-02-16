import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { hasUserEmail } from '@/lib/session-guards';
import {
  listAffiliateApplications,
  createAffiliateApiKey,
  getAffiliateApiKeyByAffiliateId,
  revokeAffiliateApiKey,
} from '@/lib/affiliates';

/**
 * GET /api/affiliate/api-key
 * Get current API key status for logged-in affiliate.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!hasUserEmail(session)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find the affiliate by email
    const allAffiliates = await listAffiliateApplications('approved');
    const affiliate = allAffiliates.find((a) => a.email === session.user.email);

    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    const apiKey = await getAffiliateApiKeyByAffiliateId(affiliate.id);

    return NextResponse.json({
      ok: true,
      apiKey: apiKey
        ? {
            last4: apiKey.last4,
            scopes: apiKey.scopes,
            createdAt: apiKey.createdAt,
            revokedAt: apiKey.revokedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Failed to fetch API key status:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliate/api-key
 * Generate/rotate API key for logged-in affiliate.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!hasUserEmail(session)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find the affiliate by email
    const allAffiliates = await listAffiliateApplications('approved');
    const affiliate = allAffiliates.find((a) => a.email === session.user.email);

    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    // Revoke old key if it exists
    const oldKey = await getAffiliateApiKeyByAffiliateId(affiliate.id);
    if (oldKey) {
      await revokeAffiliateApiKey(affiliate.id);
    }

    // Generate new key
    const { key, keyRecord } = await createAffiliateApiKey(affiliate.id);

    return NextResponse.json({
      ok: true,
      apiKey: key,
      last4: keyRecord.last4,
      scopes: keyRecord.scopes,
      warning: 'Save this key securely. You will not be able to view it again.',
    });
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/affiliate/api-key
 * Revoke API key for logged-in affiliate.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!hasUserEmail(session)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find the affiliate by email
    const allAffiliates = await listAffiliateApplications('approved');
    const affiliate = allAffiliates.find((a) => a.email === session.user.email);

    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    const success = await revokeAffiliateApiKey(affiliate.id);

    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'No API key to revoke' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: 'API key revoked' });
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
