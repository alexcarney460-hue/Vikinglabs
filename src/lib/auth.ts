import crypto from 'crypto';
import { cookies } from 'next/headers';

export type UserRole = 'user' | 'admin';

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
};

const COOKIE_NAME = 'vl_session';

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  // Allow local/dev usage without configuration. In production, set AUTH_SECRET.
  if (process.env.NODE_ENV !== 'production') return 'dev-auth-secret-change-me';
  throw new Error('AUTH_SECRET is not set');
}

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payloadB64: string): string {
  const h = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
  return base64url(h);
}

export function createSessionCookie(user: SessionUser): string {
  const payload = {
    ...user,
    iat: Date.now(),
    v: 1,
  };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionCookie(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  // constant-time compare
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json);
    if (!payload?.id || !payload?.email || !payload?.role) return null;
    return { id: payload.id, email: payload.email, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  return verifySessionCookie(token);
}

export async function setSession(user: SessionUser) {
  const c = await cookies();
  c.set(COOKIE_NAME, createSessionCookie(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
}

export async function clearSession() {
  const c = await cookies();
  c.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
