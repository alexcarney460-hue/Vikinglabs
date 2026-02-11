'use client';

import { useState } from 'react';

const defaultForm = {
  name: '',
  email: '',
  socialHandle: '',
  audienceSize: '',
  channels: '',
  notes: '',
};

export default function AffiliateForm() {
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/hubspot/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: 'affiliate',
          payload: form,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unable to submit.' }));
        throw new Error(data.error || 'Unable to submit.');
      }

      setStatus('success');
      setForm(defaultForm);
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange('name')}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Primary Handle / URL</label>
        <input
          type="text"
          value={form.socialHandle}
          onChange={handleChange('socialHandle')}
          placeholder="@username or https://..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Audience Size</label>
          <input
            type="text"
            value={form.audienceSize}
            onChange={handleChange('audienceSize')}
            placeholder="e.g. 50k subscribers"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Primary Channels</label>
          <input
            type="text"
            value={form.channels}
            onChange={handleChange('channels')}
            placeholder="YouTube, TikTok, Email List, etc."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Notes / Pitch</label>
        <textarea
          rows={4}
          value={form.notes}
          onChange={handleChange('notes')}
          placeholder="Tell us about your audience and content style."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-full bg-amber-500 text-white font-bold py-3 shadow hover:bg-amber-600 disabled:opacity-50"
      >
        {status === 'loading' ? 'Submitting…' : 'Apply Now'}
      </button>

      {status === 'success' && (
        <p className="text-sm text-emerald-600 font-semibold text-center">Application sent! We&apos;ll reply via email.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600 text-center">Unable to submit. Please try again.</p>
      )}
    </form>
  );
}
