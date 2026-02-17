import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail as sendResetEmail } from '@/lib/authjs/email-service';

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

    // Send reset email (doesn't reveal if email exists, for security)
    const { success, error } = await sendResetEmail(email);

    if (!success) {
      return NextResponse.json({ error: error || 'Failed to send reset email' }, { status: 500 });
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If this email exists, a reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
