/* eslint-disable react/no-unescaped-entities */

import WholesaleForm from '@/components/forms/WholesaleForm';

export default function WholesalePage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-amber-500 text-black text-xs font-bold uppercase tracking-wider mb-4">
            B2B Partner Program
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Scale Your Brand</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Direct access to ISO 17025 manufacturing. Bulk raw materials, white-label filling, and custom formulation services.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2">
          
          {/* Benefits */}
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Partner With Us?</h2>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-emerald-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Verified Purity</h3>
                    <p className="text-slate-600">Every batch comes with full HPLC & Mass Spec COAs. We don't sell without testing.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-blue-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Custom Manufacturing</h3>
                    <p className="text-slate-600">Need a specific blend? We can synthesize custom peptides and lyophilize to your specs.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm text-purple-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">White Label Ready</h3>
                    <p className="text-slate-600">Unbranded vials or fully branded packaging available for volume partners.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-8">
              <h3 className="font-bold text-amber-900 mb-2">Minimum Order Quantity (MOQ)</h3>
              <p className="text-amber-800 text-sm mb-4">
                To qualify for wholesale pricing, initial orders must meet one of the following criteria:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                <li>$2,000 USD minimum spend</li>
                <li>50+ vials per SKU</li>
              </ul>
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Wholesale Application</h2>
            <WholesaleForm />
          </div>

        </div>
      </div>
    </div>
  );
}
