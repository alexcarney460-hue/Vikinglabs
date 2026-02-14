'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

  // email magic links disabled (OAuth-only)

  const role = (session?.user as any)?.role as string | undefined;

  useEffect(() => {
    if (status === 'authenticated') {
      if (role === 'admin') router.replace('/account/admin');
      else router.replace('/account');
    }
  }, [status, role, router]);

  const error = useMemo(() => params.get('error'), [params]);

  // Email sign-in disabled (OAuth-only)

  return (
    <div className="container mx-auto px-6 py-12 max-w-lg">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Sign in / Create account</h1>
      <p className="mt-2 text-slate-600">Use Google, Apple, Facebook, or TikTok.</p>

      <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error === 'OAuthAccountNotLinked'
              ? 'That email is already linked to another sign-in method. Use the provider you originally used.'
              : `Sign-in error: ${error}`}
          </div>
        )}

        {/* Email verification UI removed (OAuth-only) */}

        {/* Provider buttons (enabled when configured server-side) */}
        <div className="space-y-3">
          <ProviderButton id="google" label="Google" />
          <ProviderButton id="apple" label="Apple" />
          <ProviderButton id="facebook" label="Facebook" />
          <ProviderButton id="tiktok" label="TikTok" />
        </div>


        {/* Email sign-in disabled (OAuth-only) */}

        <div className="text-xs text-slate-500">
          No passwords. By continuing you agree to our terms and policies.
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
