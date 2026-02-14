import Link from 'next/link';
import AffiliateForm from '@/components/forms/AffiliateForm';

export default function AffiliateApplyPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-white border-b border-slate-200 py-14">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Affiliate Application</p>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Apply to partner with Viking Labs</h1>
          <p className="mt-4 text-lg text-slate-600">
            Share your audience and channel details. We’ll reply with assets, referral links, and onboarding steps.
          </p>
          <div className="mt-6">
            <Link href="/affiliates" className="text-sm font-semibold text-amber-600 hover:text-amber-700">← Back to affiliate program details</Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 max-w-4xl py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Affiliate Application</h2>
          <p className="text-sm text-slate-600 mb-6">
            Submit your info and we’ll send over assets, private codes, and onboarding instructions within one business day.
          </p>
          <AffiliateForm />
        </div>
      </section>
    </div>
  );
}
