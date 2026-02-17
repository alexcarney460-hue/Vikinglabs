'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email');

  const [codes, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle code input
  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newCodes = [...codes];
    newCodes[index] = value;
    setCode(newCodes);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Handle backspace
  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Submit verification
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const code = codes.join('');
    if (code.length !== 6) {
      setError('Please enter the full code');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to verify code');
        setLoading(false);
        return;
      }

      // Success - sign in user
      const signInResult = await signIn('credentials', {
        email,
        password: data.tempPassword, // Temporary password for first login
        redirect: false,
      });

      if (!signInResult?.ok) {
        setError('Verification successful, but sign-in failed. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to account
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  }

  // Resend code
  async function handleResend() {
    if (!email) return;
    setError('');
    setResendLoading(true);

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to resend code');
        setResendLoading(false);
        return;
      }

      // Reset codes and start timer
      setCode(['', '', '', '', '', '']);
      setResendTimer(60);
      inputRefs.current[0]?.focus();
      setResendLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resend failed');
      setResendLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Verify Your Email</h1>
      <p className="mt-2 text-slate-600">Enter the 6-digit code sent to {email}</p>

      <form onSubmit={handleVerify} className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Code input fields */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Verification Code</label>
          <div className="flex gap-2 justify-center">
            {codes.map((code, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={code}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder="0"
                className="h-12 w-12 rounded-lg border-2 border-slate-300 text-center text-2xl font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        {/* Resend button */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || resendTimer > 0}
            className="text-sm text-amber-600 hover:underline disabled:text-slate-400"
          >
            {resendLoading
              ? 'Sending...'
              : resendTimer > 0
                ? `Resend code in ${resendTimer}s`
                : 'Resend code'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
