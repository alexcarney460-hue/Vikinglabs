'use client';

import { FormEvent, useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/hubspot/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'newsletter',
          payload: { email },
        }),
      });

      if (!res.ok) throw new Error('Newsletter opt-in failed');
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
      />
      <button
        className="rounded bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? '…' : 'Join'}
      </button>
      {status === 'success' && (
        <span className="text-xs text-emerald-600 font-semibold self-center">Added!</span>
      )}
      {status === 'error' && (
        <span className="text-xs text-red-500 self-center">Try again.</span>
      )}
    </form>
  );
}
