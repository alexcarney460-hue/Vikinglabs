import { NextResponse, NextRequest } from 'next/server';
import { findUserByEmail } from '@/lib/users';
import {
  signAccessToken,
  hashRefreshToken,
  verifyRefreshToken,
} from '@/lib/mobile-auth';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      );
    }

    // Extract user from Authorization header (if provided) or from token claim
    const authHeader = req.headers.get('authorization');
    const expiredToken = authHeader?.replace('Bearer ', '');

    let userId: string | undefined;

    let userEmail: string | undefined;
    
    // Try to extract userId & email from expired token
    if (expiredToken) {
      try {
        const [, bodyB64] = expiredToken.split('.');
        if (bodyB64) {
          const payload = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8'));
          userId = payload.id;
          userEmail = payload.email;
        }
      } catch {
        // Ignore parse error
      }
    }

    // If we couldn't extract from token, require userId in request body as fallback
    if (!userId) {
      const { userId: bodyUserId } = await req.json().catch(() => ({}));
      userId = bodyUserId;
      if (!userId) {
        return NextResponse.json(
          { error: 'User context required' },
          { status: 401 }
        );
      }
    }

    // Verify refresh token exists and is valid
    const hashedToken = hashRefreshToken(refreshToken);
    const isValid = await verifyRefreshToken(userId, hashedToken);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Refresh token expired or invalid' },
        { status: 401 }
      );
    }

    // Get fresh user data (use email if available from token)
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unable to refresh token' },
        { status: 401 }
      );
    }

    const user = await findUserByEmail(userEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Issue new access token
    const newAccessToken = signAccessToken(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      AUTH_SECRET
    );

    return NextResponse.json({
      accessToken: newAccessToken,
      expiresIn: 15 * 60,
    });
  } catch (error) {
    console.error('[Mobile Auth] refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
