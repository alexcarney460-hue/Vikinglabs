import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail, recordOrderAffiliate } from '@/lib/affiliates';
import { recordOrder } from '@/lib/orders';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

interface PurchaseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  plan: 'one-time' | 'autoship';
}

function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const bearerToken = getAuthToken(req);
  let userEmail: string | undefined;

  if (bearerToken) {
    console.warn(
      '[affiliate/purchase] Bearer token auth not fully implemented, falling back to session'
    );
  }

  const session = await getServerSession(authOptions);
  userEmail = session?.user?.email as string | undefined;

  if (!session?.user || !userEmail) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const items: PurchaseItem[] = body.items;
    const shippingCost: number = body.shippingCost ?? 0;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Cart is empty.' },
        { status: 400 }
      );
    }

    const hasAutoship = items.some((item) => item.plan === 'autoship');
    const hasOneTime = items.some((item) => item.plan === 'one-time');

    if (hasAutoship && hasOneTime) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Please place autoship and one-time purchases separately.',
        },
        { status: 400 }
      );
    }

    const mode: 'payment' | 'subscription' = hasAutoship ? 'subscription' : 'payment';

    // Calculate commission discount (affiliate commission % as discount)
    const subtotalCents = items.reduce(
      (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
      0
    );
    const commissionPercentage = affiliate.commissionRate; // e.g., 0.10 for 10%
    const discountCents = Math.round(subtotalCents * commissionPercentage);

    // Build line items for Stripe
    const lineItems = items.map((item) => {
      const base: {
        price_data: {
          currency: string;
          product_data: {
            name: string;
            metadata: Record<string, string>;
          };
          unit_amount: number;
          recurring?: {
            interval: 'month';
            interval_count: number;
          };
        };
        quantity: number;
      } = {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.name} (${item.size})`,
            metadata: {
              productId: item.id,
              plan: item.plan,
              size: item.size,
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };

      if (item.plan === 'autoship') {
        base.price_data.recurring = { interval: 'month', interval_count: 1 };
      }

      return base;
    });

    // Add shipping if applicable
    const shippingCents = Math.round(shippingCost * 100);
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Insured Priority Shipping',
            metadata: {
              productId: 'shipping',
              plan: 'one-time',
            },
          },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    // Add discount line item (commission as discount)
    if (discountCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Affiliate Discount (${(commissionPercentage * 100).toFixed(0)}%)`,
            metadata: {
              productId: 'affiliate-discount',
              plan: 'one-time',
            },
          },
          unit_amount: -discountCents, // Negative for discount
        },
        quantity: 1,
      });
    }

    const orderTotalCents =
      subtotalCents + shippingCents - discountCents;

    if (!stripe) {
      console.error('[Stripe] STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Create Stripe session
    const origin = req.headers.get('origin') ?? 'http://localhost:3000';
    const session_obj = await stripe.checkout.sessions.create(
      {
        mode,
        customer_email: userEmail,
        line_items: lineItems,
        billing_address_collection: 'required',
        shipping_address_collection: { allowed_countries: ['US'] },
        allow_promotion_codes: false, // Don't allow additional promos with affiliate discount
        success_url: `${origin}/affiliate/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/affiliate/purchase/cancel`,
        subscription_data: hasAutoship
          ? {
              metadata: {
                autoship: 'true',
                isPersonalPurchase: 'true',
                affiliateId: affiliate.id,
                affiliateCode: affiliate.code || '',
              },
            }
          : undefined,
        metadata: {
          autoship: hasAutoship ? 'true' : 'false',
          isPersonalPurchase: 'true',
          order_total_cents: orderTotalCents.toString(),
          affiliate_id: affiliate.id,
          affiliate_code: affiliate.code || '',
          affiliate_commission_percent: (
            commissionPercentage * 100
          ).toFixed(0),
          discount_cents: discountCents.toString(),
        },
      } as Stripe.Checkout.SessionCreateParams
    );

    // Record order with personal purchase metadata
    recordOrder({
      provider: 'stripe',
      providerOrderId: session_obj.id,
      email: userEmail,
      amountCents: orderTotalCents,
      currency: 'usd',
      autoship: hasAutoship,
      items: {
        cart: items,
        shippingCost,
        stripeMode: mode,
        affiliate: { id: affiliate.id, code: affiliate.code || null },
        isPersonalPurchase: true,
        discountApplied: discountCents,
      },
    }).catch((error) => {
      console.error('Order record failed', error);
    });

    // Record as affiliate order with personal purchase flag (don't count toward metrics)
    recordOrderAffiliate({
      provider: 'stripe',
      orderId: session_obj.id,
      affiliateId: affiliate.id,
      code: affiliate.code || null,
      amountCents: orderTotalCents,
      currency: 'usd',
      metadata: {
        email: userEmail,
        items,
        shippingCost,
        isPersonalPurchase: true,
        discountApplied: discountCents,
        originalPrice: subtotalCents,
      },
    }).catch((error) => {
      console.error('Order affiliate record failed', error);
    });

    return NextResponse.json({
      ok: true,
      checkoutSessionId: session_obj.id,
      checkoutUrl: session_obj.url,
      affiliateDiscount: {
        percent: commissionPercentage * 100,
        amountCents: discountCents,
        discountedTotal: orderTotalCents,
      },
    });
  } catch (error: unknown) {
    console.error('[affiliate/purchase] Error:', error);
    const message = error instanceof Error ? error.message : 'Purchase failed';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
