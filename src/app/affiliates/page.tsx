'use client';

import Link from 'next/link';
import AffiliateForm from '@/components/forms/AffiliateForm';

const perks = [
  {
    title: '15% baseline commission',
    detail: 'Recurring payouts on every referred order with lifetime attribution cookie.'
  },
  {
    title: 'Net-7 payouts',
    detail: 'Direct deposit or USDC every Tuesday once the return window closes.'
  },
  {
    title: 'Tracked samples',
    detail: 'Influencer starter kit ships with scannable QR codes tied to your ID.'
  },
  {
    title: 'Live dashboard',
    detail: 'Track clicks, conversions, and COA downloads in real time.'
  }
];

const steps = [
  { label: 'Apply', desc: 'Tell us about your audience, content style, and preferred channels.' },
  { label: 'Get Assets', desc: 'Receive branded creatives, swipe copy, and personalized coupon codes.' },
  { label: 'Promote', desc: 'Drop your link anywhere—podcasts, newsletters, social—and watch the dashboard update.' }
];

const faqs = [
  {
    q: 'Is there a minimum audience size?',
    a: 'We prioritize engaged, niche communities. Micro-influencers under 5k followers are welcome.'
  },
  {
    q: 'How long does tracking last?',
    a: 'Our attribution cookie lasts 90 days. Returning customers stay tied to your ID unless another code is used.'
  },
  {
    q: 'Can I order at a discount?',
    a: 'Approved partners receive a private wholesale code for personal research stock replenishment.'
  }
];

export default function AffiliatesPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Affiliate & Influencer Program</p>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Partner with Viking Labs</h1>
          <p className="mt-4 text-lg text-slate-600">
            Earn recurring revenue by referring researchers to our GMP-produced peptide catalog. Instant onboarding, transparent dashboards, and rapid payouts.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#affiliate-form" className="inline-flex items-center justify-center rounded-full bg-amber-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600">
              Apply Now
            </a>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-sm font-bold text-slate-700 hover:border-amber-500">
              Talk to a Partner Manager
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <article key={perk.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">{perk.title}</p>
              <p className="mt-3 text-sm text-slate-600">{perk.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <div className="grid gap-6 mt-8 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={step.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <span className="text-4xl font-black text-slate-900">0{idx + 1}</span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{step.label}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-12 max-w-4xl space-y-4">
        {faqs.map((faq) => (
          <details key={faq.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <summary className="cursor-pointer text-lg font-semibold text-slate-900">{faq.q}</summary>
            <p className="mt-3 text-sm text-slate-600">{faq.a}</p>
          </details>
        ))}
      </section>

      <section id="affiliate-form" className="container mx-auto px-6 max-w-4xl py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Affiliate Application</h2>
          <p className="text-sm text-slate-600 mb-6">
            Submit your info and we’ll send over assets, private codes, and onboarding instructions within one business day.
          </p>
          <AffiliateForm />
        </div>
      </section>

      <section className="container mx-auto px-6 max-w-5xl">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Compliance first</p>
          <p className="mt-3 text-sm text-amber-900">
            Creatives emphasize “for laboratory research use only.” We provide copy guidelines so your promos stay compliant on every platform.
          </p>
        </div>
      </section>
    </div>
  );
}
