import { randomBytes } from 'crypto';
import { getSql } from './db';

export type MobileUser = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

// Generate random refresh token
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

// Sign access token (JWT)
export function signAccessToken(user: MobileUser, secret: string): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  };
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${header}.${body}`;
  
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');
  
  return `${signatureInput}.${signature}`;
}

// Verify access token
export function verifyAccessToken(token: string, secret: string): MobileUser | null {
  try {
    const [headerB64, bodyB64, sig] = token.split('.');
    if (!headerB64 || !bodyB64 || !sig) return null;

    const signatureInput = `${headerB64}.${bodyB64}`;
    const crypto = require('crypto');
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64url');

    if (sig !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8'));
    
    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

// Hash refresh token for storage
export function hashRefreshToken(token: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Store refresh token in DB
export async function storeRefreshToken(
  userId: string,
  hashedToken: string,
  deviceId?: string
): Promise<void> {
  const sql = await getSql();
  if (!sql) throw new Error('Database not available');

  await sql`
    INSERT INTO mobile_refresh_tokens (user_id, hashed_token, device_id, expires_at)
    VALUES (${userId}, ${hashedToken}, ${deviceId || null}, ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})
    ON CONFLICT (user_id, hashed_token) DO UPDATE SET expires_at = EXCLUDED.expires_at
  `;
}

// Verify refresh token in DB
export async function verifyRefreshToken(userId: string, hashedToken: string): Promise<boolean> {
  const sql = await getSql();
  if (!sql) throw new Error('Database not available');

  const result = await sql`
    SELECT id FROM mobile_refresh_tokens
    WHERE user_id = ${userId} AND hashed_token = ${hashedToken} AND expires_at > NOW()
  `;

  return result.count > 0;
}

// Revoke refresh token
export async function revokeRefreshToken(userId: string, hashedToken: string): Promise<void> {
  const sql = await getSql();
  if (!sql) return;

  await sql`
    DELETE FROM mobile_refresh_tokens
    WHERE user_id = ${userId} AND hashed_token = ${hashedToken}
  `;
}

// Ensure table exists
export async function ensureTokenTable(): Promise<void> {
  const sql = await getSql();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS mobile_refresh_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL,
      hashed_token text NOT NULL,
      device_id text,
      expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT NOW(),
      UNIQUE(user_id, hashed_token)
    )
  `;
}
