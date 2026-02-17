import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailCode } from '@/lib/authjs/email-service';

export async function POST(req: NextRequest) {
  try {
    const { email, code, displayName } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      );
    }

    // Verify code and create/update user
    const { success, userId, error } = await verifyEmailCode(
      email,
      code,
      displayName
    );

    if (!success) {
      return NextResponse.json({ error: error || 'Failed to verify code' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId,
      message: 'Email verified successfully',
      // Return a temporary password for first login
      // User should set password on next login
      tempPassword: 'temp-' + Math.random().toString(36).slice(2),
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
