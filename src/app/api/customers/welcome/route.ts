import { NextRequest, NextResponse } from 'next/server';
import { sendFirstPurchaseEmail } from '@/lib/affiliates';

/**
 * POST /api/customers/welcome
 * Trigger first-purchase welcome email for a customer
 * 
 * Body:
 * {
 *   email: string
 *   name?: string
 *   orderAmount?: number (in cents)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, orderAmount } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    try {
      await sendFirstPurchaseEmail({
        customerEmail: email,
        customerName: name,
        orderAmount,
      });

      return NextResponse.json({ ok: true, message: 'Welcome email sent.' });
    } catch (error: any) {
      console.error('[POST /api/customers/welcome] Email error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send welcome email.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[POST /api/customers/welcome] Request error:', error);
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
