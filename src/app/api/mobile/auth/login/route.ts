import { NextResponse, NextRequest } from 'next/server';
import { findUserByEmail, verifyPassword } from '@/lib/users';
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

    const { email, password, deviceId } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Validate password
    const passwordValid = await verifyPassword(user, password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
      expiresIn: 15 * 60, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[Mobile Auth] login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
