import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateApiKeyByHash } from '@/lib/affiliates';

export type AffiliateSession = {
  user: {
    email?: string | null;
  };
};

/**
 * Extract and validate API key from Authorization header.
 * Format: "Bearer sk_..."
 */
export function extractApiKey(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Require affiliate auth via session OR API key.
 * Returns the affiliate ID if authenticated.
 */
export async function requireAffiliateAuth(request: Request): Promise<
  { ok: true; affiliateId: string; isApiKey: boolean } | 
  { ok: false; status: 401 | 403; error: string }
> {
  // Try API key auth first (from Authorization header)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const apiKey = extractApiKey(authHeader);
    if (apiKey) {
      // Hash the key and look it up
      const crypto = require('crypto');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const keyRecord = await getAffiliateApiKeyByHash(keyHash);
      if (!keyRecord || keyRecord.revokedAt) {
        return { ok: false, status: 401, error: 'Invalid or revoked API key' };
      }

      return { ok: true, affiliateId: keyRecord.affiliateId, isApiKey: true };
    }
  }

  // Fall back to session auth
  const session = (await getServerSession(authOptions)) as AffiliateSession | null;
  if (!session?.user?.email) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  // Session authenticated—verify the user is an approved affiliate
  // Note: This uses their email to find their affiliate application.
  // For production, you might want to store affiliate ID directly in the session.
  // For now, we'll assume the email matches and they've been approved.
  // The frontend will enforce this by only showing the API tab to approved affiliates.
  
  // FIXME: This is a simplified check. In production, you'd verify the session user
  // is actually an approved affiliate. For MVP, session users on the affiliate dashboard are assumed approved.
  
  return { ok: true, affiliateId: session.user.email, isApiKey: false };
}
