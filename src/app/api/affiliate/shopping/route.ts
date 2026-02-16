import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { hasUserEmail } from '@/lib/session-guards';
import {
  listAffiliateApplications,
  getAffiliateApiKeyByHash,
  listAffiliateStats,
} from '@/lib/affiliates';

function extractApiKey(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * GET /api/affiliate/shopping
 * Get shopping activity for affiliate (referral traffic + attributed orders).
 * Auth: Session or API key
 */
export async function GET(request: NextRequest) {
  try {
    let affiliateId: string | null = null;

    // Try API key auth first
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const apiKey = extractApiKey(authHeader);
      if (apiKey) {
        const crypto = require('crypto');
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const keyRecord = await getAffiliateApiKeyByHash(keyHash);
        
        if (!keyRecord || keyRecord.revokedAt) {
          return NextResponse.json(
            { ok: false, error: 'Invalid or revoked API key' },
            { status: 401 }
          );
        }

        affiliateId = keyRecord.affiliateId;
      }
    }

    // Fall back to session auth
    if (!affiliateId) {
      const session = await getServerSession(authOptions);
      if (!hasUserEmail(session)) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const allAffiliates = await listAffiliateApplications('approved');
      const affiliate = allAffiliates.find((a) => a.email === session.user.email);

      if (!affiliate) {
        return NextResponse.json(
          { ok: false, error: 'Not an approved affiliate' },
          { status: 403 }
        );
      }

      affiliateId = affiliate.id;
    }

    // Get stats
    const stats = await listAffiliateStats([affiliateId]);
    const stat = stats[affiliateId];

    return NextResponse.json({
      ok: true,
      data: {
        clicks: stat.clicks,
        orders: stat.orders,
        revenueCents: stat.revenueCents,
        revenueFormatted: `$${(stat.revenueCents / 100).toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error('Failed to fetch shopping stats:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
