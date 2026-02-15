'use client';

import { ChangeEvent, FormEvent, useState } from 'react';

const defaultState = {
  companyName: '',
  contactPerson: '',
  email: '',
  website: '',
  volume: '$2k - $5k',
  details: '',
};

export default function WholesaleForm() {
  const [form, setForm] = useState(defaultState);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email) {
      setStatus('error');
      return;
    }
    setStatus('submitting');

    try {
      const [firstname, ...lastnameParts] = form.contactPerson.split(' ');
      const lastname = lastnameParts.join(' ') || '';

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: firstname || undefined,
          lastname: lastname || undefined,
          email: form.email,
          company: form.companyName,
          website: form.website,
          message: `Wholesale inquiry\nEstimated volume: ${form.volume}\nDetails: ${form.details}`,
          source: 'wholesale_inquiry',
        }),
      });

      if (!res.ok) throw new Error('Submission failed');

      setStatus('success');
      setForm(defaultState);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('[WholesaleForm] Error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Company Name</label>
          <input
            type="text"
            value={form.companyName}
            onChange={handleChange('companyName')}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Contact Person</label>
          <input
            type="text"
            value={form.contactPerson}
            onChange={handleChange('contactPerson')}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Email Address</label>
        <input
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Website / Social <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.website}
          onChange={handleChange('website')}
          placeholder="https://..."
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Estimated Monthly Volume <span className="text-red-500">*</span></label>
        <select
          value={form.volume}
          onChange={handleChange('volume')}
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-white"
        >
          <option>$2k - $5k</option>
          <option>$5k - $20k</option>
          <option>$20k - $50k</option>
          <option>$50k+</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Additional Details <span className="text-red-500">*</span></label>
        <textarea
          rows={3}
          value={form.details}
          onChange={handleChange('details')}
          placeholder="Tell us about your needs..."
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        ></textarea>
      </div>

      <button
        className="w-full rounded-lg bg-slate-900 px-6 py-4 font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:-translate-y-0.5 disabled:opacity-60"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
      </button>

      {status === 'success' && (
        <p className="text-sm text-emerald-600 font-semibold">Application received. Our team will follow up shortly.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-500">Unable to submit. Please verify your email and try again.</p>
      )}
    </form>
  );
}
