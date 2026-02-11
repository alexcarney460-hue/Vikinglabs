export default function ShippingPage() {
  const steps = [
    {
      title: 'Order Verification',
      body: 'All submissions are reviewed within 1 business day to confirm research intent and payment clearance.',
      icon: 'check'
    },
    {
      title: 'Fulfillment & QC',
      body: 'Vials are pulled from cold storage, re-verified against COA lots, and packaged in thermal mailers.',
      icon: 'lab'
    },
    {
      title: 'Carrier Handoff',
      body: 'Packages ship Monday–Friday via insured USPS Priority or UPS 2-Day. Tracking numbers are emailed immediately.',
      icon: 'truck'
    }
  ];

  const faqs = [
    {
      q: 'How much is shipping?',
      a: 'Orders $200+ ship free. Otherwise a flat $15 rate applies anywhere in the continental United States.'
    },
    {
      q: 'Do you require signature on delivery?',
      a: 'Yes — adult signature is required for every shipment to ensure proper chain-of-custody for research compounds.'
    },
    {
      q: 'Do you ship internationally?',
      a: 'Not yet. Export compliance is under review; join the newsletter for updates.'
    },
    {
      q: 'How do you keep products temperature-stable?',
      a: 'All vials are protected with phase-change gel packs and foam inserts. Transit testing confirms stability for 72 hours.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="container mx-auto px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Logistics</p>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Shipping & Handling Policy</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Viking Labs moves every order through a cold-chain aware process so your research material arrives potent, documented, and on time.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 space-y-16 max-w-5xl">
        <section className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                {step.icon === 'check' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                )}
                {step.icon === 'lab' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a7 7 0 11-14 0m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v6" /></svg>
                )}
                {step.icon === 'truck' && (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h2l1 5h11l1-5h3l-2 7H5l-2-7z" /></svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Transit Estimates</h2>
          <ul className="mt-6 space-y-4 text-sm text-slate-600">
            <li><span className="font-semibold text-slate-900">Priority Mail (Free $200+):</span> 2–3 business days with tracking + $100 insurance.</li>
            <li><span className="font-semibold text-slate-900">UPS 2-Day:</span> Upgrade available at checkout for $28 flat.</li>
            <li><span className="font-semibold text-slate-900">Same-Day Will Call (UT):</span> Contact support before 11am MT to schedule pick-up.</li>
          </ul>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-400">
            Cold chain integrity is maintained for 72 hours; store at 2–8°C upon arrival.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Common Questions</h2>
          {faqs.map((item) => (
            <details key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer text-lg font-semibold text-slate-900 marker:text-amber-500">
                {item.q}
              </summary>
              <p className="mt-3 text-sm text-slate-600">{item.a}</p>
            </details>
          ))}
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
            For laboratory research use only · Not approved for human or veterinary applications
          </p>
          <p className="mt-3 text-sm text-amber-900">
            Need special handling instructions? Email logistics@vikinglabs.io before you submit your order and we will customize the packaging manifest.
          </p>
        </section>
      </div>
    </div>
  );
}
