/**
 * Viking Labs API Affiliate Resource Kit Endpoint
 * GET /api/affiliate/resources
 *
 * Returns comprehensive resource kit for authenticated affiliate including:
 * - Tracking links and discount codes
 * - System capabilities documentation
 * - Creative asset library
 * - Brand guidelines
 * - Security measures
 * - Partner support information
 */

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';
import { assembleResourceKit } from '@/lib/affiliate-resources';
import { ResourceKitResponse } from '@/../types/affiliate-resources';
import { hasUserEmail } from '@/lib/session-guards';

// Force dynamic rendering for session-dependent responses
export const dynamic = 'force-dynamic';

/**
 * Validate session and get user email
 */
async function validateSessionAndGetEmail(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!hasUserEmail(session)) {
      return null;
    }

    return session.user?.email as string;
  } catch (error) {
    console.error('[affiliate/resources] Session validation error:', error);
    return null;
  }
}

/**
 * GET /api/affiliate/resources
 * Retrieve complete resource kit for authenticated affiliate
 */
export async function GET(req: NextRequest): Promise<NextResponse<ResourceKitResponse>> {
  const startTime = Date.now();

  try {
    // Validate session and authentication
    const userEmail = await validateSessionAndGetEmail();

    if (!userEmail) {
      return NextResponse.json<ResourceKitResponse>(
        {
          ok: false,
          error: 'Unauthorized. Please log in to access resources.',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Verify affiliate status
    const affiliate = await getAffiliateByEmail(userEmail);

    if (!affiliate) {
      return NextResponse.json<ResourceKitResponse>(
        {
          ok: false,
          error: 'Not an approved affiliate. Apply at /affiliates/apply',
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Check affiliate approval status
    if (affiliate.status !== 'approved') {
      return NextResponse.json<ResourceKitResponse>(
        {
          ok: false,
          error: `Your affiliate application is ${affiliate.status}. Please wait for approval or contact support.`,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Assemble complete resource kit
    const resourceKit = assembleResourceKit(affiliate);

    const duration = Date.now() - startTime;

    // Log successful access
    console.log(
      `[affiliate/resources] Retrieved for ${affiliate.id} (${affiliate.email}) in ${duration}ms`
    );

    return NextResponse.json<ResourceKitResponse>(
      {
        ok: true,
        data: resourceKit,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[affiliate/resources] Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration,
    });

    return NextResponse.json<ResourceKitResponse>(
      {
        ok: false,
        error: 'Failed to retrieve resource kit. Please try again later.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/affiliate/resources
 * Handle CORS preflight requests
 */
export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * POST /api/affiliate/resources
 * Not implemented - resources are read-only
 */
export async function POST(): Promise<NextResponse<ResourceKitResponse>> {
  return NextResponse.json<ResourceKitResponse>(
    {
      ok: false,
      error: 'Method not allowed. Use GET to retrieve resources.',
      timestamp: new Date().toISOString(),
    },
    { status: 405 }
  );
}

/**
 * PUT /api/affiliate/resources
 * Not implemented - resources are read-only
 */
export async function PUT(): Promise<NextResponse<ResourceKitResponse>> {
  return NextResponse.json<ResourceKitResponse>(
    {
      ok: false,
      error: 'Method not allowed. Use GET to retrieve resources.',
      timestamp: new Date().toISOString(),
    },
    { status: 405 }
  );
}

/**
 * DELETE /api/affiliate/resources
 * Not implemented - resources cannot be deleted
 */
export async function DELETE(): Promise<NextResponse<ResourceKitResponse>> {
  return NextResponse.json<ResourceKitResponse>(
    {
      ok: false,
      error: 'Method not allowed. Resources cannot be deleted.',
      timestamp: new Date().toISOString(),
    },
    { status: 405 }
  );
}
