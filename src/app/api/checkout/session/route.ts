import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

interface CartItemPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  plan: 'one-time' | 'autoship';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CartItemPayload[] = body.items;
    const email: string | undefined = body.email;
    const shippingCost: number = body.shippingCost ?? 0;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const hasAutoship = items.some((item) => item.plan === 'autoship');
    const hasOneTime = items.some((item) => item.plan === 'one-time');

    if (hasAutoship && hasOneTime) {
      return NextResponse.json({ error: 'Please place autoship and one-time purchases separately.' }, { status: 400 });
    }

    const mode: 'payment' | 'subscription' = hasAutoship ? 'subscription' : 'payment';

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
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get('origin') ?? 'http://localhost:3000';

    if (!stripe) {
      console.error('[Stripe] STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: email,
      line_items: lineItems,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      subscription_data: hasAutoship
        ? {
            metadata: {
              autoship: 'true',
            },
          }
        : undefined,
      metadata: {
        autoship: hasAutoship ? 'true' : 'false',
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: unknown) {
    console.error('[Stripe] session error', error);
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 });
  }
}
