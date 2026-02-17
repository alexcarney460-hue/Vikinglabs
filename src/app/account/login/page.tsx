'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from './LoginForm';

function ProviderButton({ id, label }: { id: string; label: string }) {
  return (
    <button
      onClick={() => signIn(id, { callbackUrl: '/account' })}
      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-800 hover:border-slate-300 hover:text-amber-600"
    >
      Continue with {label}
    </button>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();
  const [tab, setTab] = useState<'email' | 'oauth'>('email');

  const role = (session?.user as any)?.role as string | undefined;

  useEffect(() => {
    if (status === 'authenticated') {
      if (role === 'admin') router.replace('/account/admin');
      else router.replace('/account');
    }
  }, [status, role, router]);

  const error = useMemo(() => params.get('error'), [params]);
  const checkEmail = useMemo(() => params.get('checkEmail'), [params]);

  return (
    <div className="container mx-auto px-6 py-12 max-w-lg">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Sign in / Create account</h1>
      <p className="mt-2 text-slate-600">Choose your preferred sign-in method.</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab('email')}
            className={`pb-3 px-1 font-semibold transition-colors ${
              tab === 'email'
                ? 'border-b-2 border-amber-600 text-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setTab('oauth')}
            className={`pb-3 px-1 font-semibold transition-colors ${
              tab === 'oauth'
                ? 'border-b-2 border-amber-600 text-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OAuth
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === 'OAuthAccountNotLinked'
              ? 'That email is already linked to another sign-in method. Use the provider you originally used.'
              : `Sign-in error: ${error}`}
          </div>
        )}

        {/* Email tab */}
        {tab === 'email' && (
          <div className="space-y-4">
            {checkEmail && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Check your email for the verification code. It expires in 15 minutes.
              </div>
            )}
            <LoginForm type="signup" />
          </div>
        )}

        {/* OAuth tab */}
        {tab === 'oauth' && (
          <div className="space-y-3">
            <ProviderButton id="google" label="Google" />
            <ProviderButton id="apple" label="Apple" />
            <ProviderButton id="facebook" label="Facebook" />
            <ProviderButton id="tiktok" label="TikTok" />
          </div>
        )}

        <div className="mt-6 text-xs text-slate-500">
          By continuing you agree to our terms and policies.
        </div>

        <div className="mt-2 text-sm text-slate-600">
          <Link href="/" className="font-semibold text-amber-600 hover:underline">Back to site</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
