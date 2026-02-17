'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface LoginFormProps {
  type?: 'login' | 'signup';
}

export function LoginForm({ type = 'login' }: LoginFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (type === 'signup') {
        // Signup: send verification code first
        const res = await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to send verification code');
          setLoading(false);
          return;
        }

        // Redirect to verify page
        router.push(`/account/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        // Login: use NextAuth CredentialsProvider
        const result = await signIn('email', {
          email,
          password,
          redirect: false,
        });

        if (!result?.ok) {
          setError(result?.error || 'Invalid email or password');
          setLoading(false);
          return;
        }

        // Success
        router.push(params.get('callbackUrl') || '/account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  const buttonText = loading
    ? type === 'signup'
      ? 'Sending code...'
      : 'Signing in...'
    : type === 'signup'
      ? 'Create Account'
      : 'Sign In';

  return (
    <form onSubmit={handleEmailAuth} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {type === 'login' && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {buttonText}
      </button>

      {type === 'login' && (
        <div className="text-center text-sm">
          <Link href="/account/forgot-password" className="text-amber-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      )}
    </form>
  );
}
