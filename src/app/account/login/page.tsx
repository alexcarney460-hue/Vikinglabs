'use client';

import { Suspense, useEffect, useMemo } from 'react';
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
      <p className="mt-2 text-slate-600">Use your email or a social account.</p>

      <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === 'OAuthAccountNotLinked'
              ? 'That email is already linked to another sign-in method. Use the provider you originally used.'
              : `Sign-in error: ${error}`}
          </div>
        )}

        {/* Check email message */}
        {checkEmail && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Check your email for the verification code. It expires in 15 minutes.
          </div>
        )}

        {/* Email form */}
        <LoginForm type="signup" />

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200" />
          <span className="text-xs font-medium text-slate-500">OR</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* Social buttons */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Sign in with a social account:</p>
          <ProviderButton id="google" label="Google" />
          <ProviderButton id="tiktok" label="TikTok" />
        </div>

        <div className="text-xs text-slate-500">
          By continuing you agree to our terms and policies.
        </div>

        <div className="text-sm text-slate-600">
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
