import { NextRequest, NextResponse } from 'next/server';

export async function POST(_: NextRequest) {
  // Placeholder: add Coinbase webhook verification once shared secret is available.
  console.log('[Coinbase] Webhook received (stub).');
  return NextResponse.json({ received: true });
}
