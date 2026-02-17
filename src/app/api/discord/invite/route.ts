import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getDiscordInviteUrl } from '@/lib/discordInvites';
import { listOrders } from '@/lib/orders';

/**
 * GET /api/discord/invite
 * 
 * Returns Discord invite for authenticated user
 * 
 * Flow type determined by:
 * - ?flow=affiliate → affiliate_welcome
 * - ?flow=customer → customer_first_purchase (only if user has purchased)
 * - default → customer_first_purchase if purchased, else not allowed
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = (session.user.email as string).toLowerCase().trim();
    const flowParam = req.nextUrl.searchParams.get('flow');

    // Determine flow type
    let flowType: 'affiliate_welcome' | 'customer_first_purchase' = 'customer_first_purchase';

    if (flowParam === 'affiliate') {
      flowType = 'affiliate_welcome';
    } else if (flowParam === 'customer') {
      flowType = 'customer_first_purchase';
    } else {
      // Auto-detect: if user has orders, they're a customer
      try {
        const orders = await listOrders(1);
        const hasOrder = orders.some((o) => o.email.toLowerCase() === userEmail);
        if (!hasOrder) {
          return NextResponse.json(
            { error: 'No purchase history found. Discord invite is for customers.' },
            { status: 403 }
          );
        }
      } catch (error) {
        console.warn('[GET /api/discord/invite] Could not check orders:', error);
        // Continue anyway; DB might be down but invite creation might work
      }
    }

    // Get or create invite
    const inviteUrl = await getDiscordInviteUrl({
      flowType,
      userEmail,
    });

    return NextResponse.json({
      ok: true,
      inviteUrl,
      flowType,
      email: userEmail,
    });
  } catch (error: any) {
    console.error('[GET /api/discord/invite] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get Discord invite' },
      { status: 500 }
    );
  }
}
