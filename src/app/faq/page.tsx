export default function FAQPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Help Center</h1>
          <div className="mx-auto my-6 h-1 w-24 bg-amber-500"></div>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Common questions about shipping, quality control, and ordering.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="grid gap-8">
          
          {/* Shipping */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              Shipping & Delivery
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">When will my order ship?</h3>
                <p className="text-slate-600">Orders placed before 2:00 PM CST (Mon-Fri) are processed and shipped the same day. Orders placed after the cutoff or on weekends ship the next business day.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Where do you ship from?</h3>
                <p className="text-slate-600">All orders ship directly from our domestic facility in the USA. No customs delays.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Do you offer free shipping?</h3>
                <p className="text-slate-600">Yes, we offer free Priority Shipping on all orders over $200.</p>
              </div>
            </div>
          </div>

          {/* Product Quality */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Quality & Testing
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Are your products tested?</h3>
                <p className="text-slate-600">Absolutely. Every single batch is sent to an ISO 17025 accredited third-party lab for HPLC (purity) and Mass Spectrometry (identity) testing. We do not sell any batch that tests below 99% purity.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Where can I find the COA?</h3>
                <p className="text-slate-600">Certificates of Analysis are available on our <a href="/lab-tests" className="text-amber-600 hover:underline">Lab Reports page</a> or via the QR code on your product box.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">How should I store my peptides?</h3>
                <p className="text-slate-600">Lyophilized (powder) peptides should be stored in a freezer (-20°C) for long-term stability. Once reconstituted, they must be refrigerated (4°C) and used within 30 days.</p>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Usage & Compliance
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Are these for human consumption?</h3>
                <p className="text-slate-600 font-bold text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100 inline-block">
                  NO. All products sold by Viking Labs are strictly for laboratory research purposes only. They are not intended for human use, ingestion, or clinical treatment.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Do you provide dosing instructions?</h3>
                <p className="text-slate-600">No. Under FDA regulations for research chemicals, we cannot provide instructions for personal use. Please consult relevant research literature for your laboratory protocols.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
