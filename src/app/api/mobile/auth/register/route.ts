import { NextResponse, NextRequest } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/users';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  storeRefreshToken,
  ensureTokenTable,
} from '@/lib/mobile-auth';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

export async function POST(req: NextRequest) {
  try {
    await ensureTokenTable();

    const { email, password, name, deviceId } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Check if email exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({ email, password, name });

    // Generate tokens
    const accessToken = signAccessToken(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      AUTH_SECRET
    );

    const refreshToken = generateRefreshToken();
    const hashedToken = hashRefreshToken(refreshToken);

    // Store refresh token
    await storeRefreshToken(user.id, hashedToken, deviceId);

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[Mobile Auth] register error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
