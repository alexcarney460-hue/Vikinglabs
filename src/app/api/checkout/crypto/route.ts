import { NextRequest, NextResponse } from 'next/server';
import { resources } from '@/lib/coinbase';
import { AFFILIATE_COOKIE_NAME } from '@/lib/affiliate-cookies';
import { getAffiliateByCode, recordOrderAffiliate } from '@/lib/affiliates';

const Charge = resources?.Charge ?? null;

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

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const hasAutoship = items.some((item) => item.plan === 'autoship');
    if (hasAutoship) {
      return NextResponse.json({ error: 'Autoship subscriptions are card-only at this time.' }, { status: 400 });
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const amountCents = Math.round(amount * 100);

    const affiliateCode = req.cookies.get(AFFILIATE_COOKIE_NAME)?.value;
    const affiliate = affiliateCode ? await getAffiliateByCode(affiliateCode) : null;

    const origin = req.headers.get('origin') ?? 'http://localhost:3000';

    const charge = await Charge.create({
      name: 'Viking Labs Order',
      description: `Crypto checkout for ${email}`,
      local_price: {
        amount: amount.toFixed(2),
        currency: 'USD',
      },
      pricing_type: 'fixed_price',
      metadata: {
        email,
        items: JSON.stringify(items),
        affiliate_code: affiliate?.code || affiliateCode || '',
        affiliate_id: affiliate?.id || '',
        affiliate_signup_credit_cents: affiliate ? affiliate.signupCreditCents.toString() : '0',
      },
      redirect_url: `${origin}/checkout/success?method=crypto`,
      cancel_url: `${origin}/checkout/cancel?method=crypto`,
    });

    if (affiliate) {
      recordOrderAffiliate({
        provider: 'coinbase',
        orderId: charge.id,
        affiliateId: affiliate.id,
        code: affiliate.code || affiliateCode || null,
        amountCents,
        currency: 'usd',
        metadata: {
          email,
          items,
        },
      }).catch((error) => {
        console.error('Order affiliate record failed', error);
      });
    }

    return NextResponse.json({ hosted_url: charge.hosted_url });
  } catch (error) {
    console.error('[Coinbase] charge error', error);
    return NextResponse.json({ error: 'Unable to start crypto checkout.' }, { status: 500 });
  }
}
