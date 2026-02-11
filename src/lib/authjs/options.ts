import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';

import TikTokProvider from './tiktok-provider';

function getAdminEmail(): string | null {
  const raw = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return raw || null;
}

function isAdminEmail(email?: string | null): boolean {
  const adminEmail = getAdminEmail();
  const e = (email || '').trim().toLowerCase();
  return Boolean(adminEmail && e && e === adminEmail);
}

// NOTE:
// - This project runs on Vercel.
// - Writing to the filesystem is not reliable in serverless.
// - So we default to JWT sessions (no adapter).
// - Sign-in is restricted to OAuth providers (Google/Apple/Facebook/TikTok).
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/account/login',
    verifyRequest: '/account/login?checkEmail=1',
  },
  providers: [
    // Only enable a provider when its credentials exist.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),

    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? [AppleProvider({ clientId: process.env.APPLE_CLIENT_ID, clientSecret: process.env.APPLE_CLIENT_SECRET })]
      : []),

    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [FacebookProvider({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET })]
      : []),

    ...(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET
      ? [TikTokProvider({ clientId: process.env.TIKTOK_CLIENT_KEY, clientSecret: process.env.TIKTOK_CLIENT_SECRET })]
      : []),

    // Email sign-in disabled (OAuth-only)
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` only exists on initial sign-in.
      if (user?.email) {
        (token as any).role = isAdminEmail(user.email) ? 'admin' : 'user';
      }
      // Keep role stable across refreshes.
      if (!(token as any).role) (token as any).role = isAdminEmail(token.email as any) ? 'admin' : 'user';
      return token;
    },
    async session({ session, token }) {
      // Expose role to UI.
      (session.user as any).role = (token as any).role || 'user';
      return session;
    },
  },
  // You MUST set NEXTAUTH_SECRET in production.
  secret: process.env.NEXTAUTH_SECRET,
};
