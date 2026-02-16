import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import {
  getAffiliateApiKeyByHash,
  getAffiliateByEmail,
  getAffiliateById,
} from '@/lib/affiliates';
import type { AffiliateApplication } from '@/lib/affiliates';

export type AffiliateAuthResult =
  | { ok: true; affiliate: AffiliateApplication; authMethod: 'session' | 'bearer' }
  | { ok: false; error: string; status: number };

/**
 * Authenticate an affiliate request via session cookie OR Bearer token.
 *
 * Bearer tokens are the raw API keys (64-char hex strings) returned at
 * creation time. We SHA-256 hash them and look up the hash in
 * `affiliate_api_keys`.
 *
 * Usage:
 *   curl -H "Authorization: Bearer <key>" https://vikinglabs.co/api/affiliate/summary
 */
export async function authenticateAffiliate(
  req: NextRequest
): Promise<AffiliateAuthResult> {
  // 1. Try Bearer token first (stateless, cheaper)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const rawKey = authHeader.substring(7).trim();
    if (!rawKey) {
      return { ok: false, error: 'Empty Bearer token', status: 401 };
    }

    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await getAffiliateApiKeyByHash(hash);

    if (!apiKey) {
      return { ok: false, error: 'Invalid or revoked API key', status: 401 };
    }

    const affiliate = await getAffiliateById(apiKey.affiliateId);
    if (!affiliate) {
      return { ok: false, error: 'Affiliate not found', status: 404 };
    }

    return { ok: true, affiliate, authMethod: 'bearer' };
  }

  // 2. Fall back to session auth
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email as string | undefined;

  if (!session?.user || !userEmail) {
    return { ok: false, error: 'Unauthorized', status: 401 };
  }

  const affiliate = await getAffiliateByEmail(userEmail);
  if (!affiliate) {
    return { ok: false, error: 'Not an approved affiliate', status: 403 };
  }

  return { ok: true, affiliate, authMethod: 'session' };
}
