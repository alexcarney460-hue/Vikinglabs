import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import {
  listAffiliateApplications,
  getAffiliateApiKeyByHash,
  createTrackerEntry,
  getTrackerEntries,
  updateTrackerEntry,
  deleteTrackerEntry,
} from '@/lib/affiliates';

function extractApiKey(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * GET /api/affiliate/tracker/entries?stackId=...
 * Get tracker entries for a specific stack.
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
      if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userEmail: string = session.user.email;
      const allAffiliates = await listAffiliateApplications('approved');
      const affiliate = allAffiliates.find((a) => a.email === userEmail);

      if (!affiliate) {
        return NextResponse.json(
          { ok: false, error: 'Not an approved affiliate' },
          { status: 403 }
        );
      }

      affiliateId = affiliate.id;
    }

    const stackId = request.nextUrl.searchParams.get('stackId');
    if (!stackId) {
      return NextResponse.json(
        { ok: false, error: 'stackId query parameter is required' },
        { status: 400 }
      );
    }

    const entries = await getTrackerEntries(stackId, affiliateId);

    return NextResponse.json({
      ok: true,
      entries,
    });
  } catch (error) {
    console.error('Failed to fetch tracker entries:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliate/tracker/entries
 * Create a new tracker entry.
 * Body: { stackId, date, dosage?, notes? }
 * Auth: Session or API key
 */
export async function POST(request: NextRequest) {
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
      if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userEmail: string = session.user.email;
      const allAffiliates = await listAffiliateApplications('approved');
      const affiliate = allAffiliates.find((a) => a.email === userEmail);

      if (!affiliate) {
        return NextResponse.json(
          { ok: false, error: 'Not an approved affiliate' },
          { status: 403 }
        );
      }

      affiliateId = affiliate.id;
    }

    const body = await request.json();
    const { stackId, date, dosage, notes } = body;

    if (!stackId || !date) {
      return NextResponse.json(
        { ok: false, error: 'stackId and date are required' },
        { status: 400 }
      );
    }

    const entry = await createTrackerEntry(stackId, affiliateId, date, dosage, notes);

    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (error) {
    console.error('Failed to create tracker entry:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/affiliate/tracker/entries?id=...
 * Update tracker entry.
 * Body: { date?, dosage?, notes? }
 */
export async function PATCH(request: NextRequest) {
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
      if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userEmail: string = session.user.email;
      const allAffiliates = await listAffiliateApplications('approved');
      const affiliate = allAffiliates.find((a) => a.email === userEmail);

      if (!affiliate) {
        return NextResponse.json(
          { ok: false, error: 'Not an approved affiliate' },
          { status: 403 }
        );
      }

      affiliateId = affiliate.id;
    }

    const entryId = request.nextUrl.searchParams.get('id');
    if (!entryId) {
      return NextResponse.json(
        { ok: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateTrackerEntry(entryId, affiliateId, body);

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, entry: updated });
  } catch (error) {
    console.error('Failed to update tracker entry:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/affiliate/tracker/entries?id=...
 * Delete tracker entry.
 */
export async function DELETE(request: NextRequest) {
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
      if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const userEmail: string = session.user.email;
      const allAffiliates = await listAffiliateApplications('approved');
      const affiliate = allAffiliates.find((a) => a.email === userEmail);

      if (!affiliate) {
        return NextResponse.json(
          { ok: false, error: 'Not an approved affiliate' },
          { status: 403 }
        );
      }

      affiliateId = affiliate.id;
    }

    const entryId = request.nextUrl.searchParams.get('id');
    if (!entryId) {
      return NextResponse.json(
        { ok: false, error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteTrackerEntry(entryId, affiliateId);

    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete tracker entry:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}



