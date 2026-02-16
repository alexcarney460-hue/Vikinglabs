import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import {
  listAffiliateApplications,
  getAffiliateApiKeyByHash,
  createTrackerStack,
  getTrackerStacks,
  updateTrackerStack,
  deleteTrackerStack,
} from '@/lib/affiliates';

function extractApiKey(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * GET /api/affiliate/tracker/stacks
 * Get all tracker stacks for affiliate (personal research notes/tracking).
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
      if (!session?.user?.email) {
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

    const stacks = await getTrackerStacks(affiliateId);

    return NextResponse.json({
      ok: true,
      stacks: stacks.map((s) => ({
        ...s,
        note: 'Research tracking / personal notes',
      })),
    });
  } catch (error) {
    console.error('Failed to fetch tracker stacks:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliate/tracker/stacks
 * Create a new tracker stack.
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
      if (!session?.user?.email) {
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

    const body = await request.json();
    const { name, notes } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Stack name is required' },
        { status: 400 }
      );
    }

    const stack = await createTrackerStack(affiliateId, name, notes);

    return NextResponse.json({ ok: true, stack }, { status: 201 });
  } catch (error) {
    console.error('Failed to create tracker stack:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/affiliate/tracker/stacks/[stackId]
 * Update tracker stack.
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
      if (!session?.user?.email) {
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

    const { searchParams } = new URL(request.url);
    const stackId = searchParams.get('id');

    if (!stackId) {
      return NextResponse.json(
        { ok: false, error: 'Stack ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateTrackerStack(stackId, affiliateId, body);

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'Stack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, stack: updated });
  } catch (error) {
    console.error('Failed to update tracker stack:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/affiliate/tracker/stacks/[stackId]
 * Delete tracker stack.
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
      if (!session?.user?.email) {
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

    const { searchParams } = new URL(request.url);
    const stackId = searchParams.get('id');

    if (!stackId) {
      return NextResponse.json(
        { ok: false, error: 'Stack ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteTrackerStack(stackId, affiliateId);

    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'Stack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete tracker stack:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
