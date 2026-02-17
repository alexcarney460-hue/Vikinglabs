import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode } from '@/lib/authjs/email-service';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Send verification code
    const { success, error } = await sendVerificationCode(email);

    if (!success) {
      return NextResponse.json({ error: error || 'Failed to send code' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Code sent to email' });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
