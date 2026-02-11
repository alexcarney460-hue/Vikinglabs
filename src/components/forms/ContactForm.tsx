'use client';

import { ChangeEvent, FormEvent, useState } from 'react';

const defaultState = {
  name: '',
  email: '',
  subject: 'Order Inquiry',
  message: '',
};

export default function ContactForm() {
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
      const res = await fetch('/api/hubspot/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'contact',
          payload: form,
        }),
      });

      if (!res.ok) throw new Error('Submission failed');

      setStatus('success');
      setForm(defaultState);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-bold text-slate-700">Name</label>
          <input
            id="name"
            type="text"
            placeholder="Dr. Smith"
            value={form.name}
            onChange={handleChange('name')}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm transition-all"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-slate-700">Email</label>
          <input
            id="email"
            type="email"
            placeholder="lab@university.edu"
            value={form.email}
            onChange={handleChange('email')}
            required
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-bold text-slate-700">Subject</label>
        <select
          id="subject"
          value={form.subject}
          onChange={handleChange('subject')}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm transition-all"
        >
          <option>Order Inquiry</option>
          <option>Product Question</option>
          <option>Wholesale Application</option>
          <option>Other</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-bold text-slate-700">Message</label>
        <textarea
          id="message"
          rows={5}
          placeholder="How can we help?"
          value={form.message}
          onChange={handleChange('message')}
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm transition-all"
        ></textarea>
      </div>

      <button
        className="w-full rounded-lg bg-amber-500 px-6 py-4 font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 hover:-translate-y-0.5 transition-all disabled:opacity-60"
        disabled={status === 'submitting'}
      >
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>

      {status === 'success' && (
        <p className="text-sm text-emerald-600 font-semibold">Message sent! We’ll respond within 24 hours.</p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
