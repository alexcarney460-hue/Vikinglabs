import Link from 'next/link';

/* eslint-disable react/no-unescaped-entities */

export default function AboutPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero */}
      <section className="bg-white py-20 border-b border-slate-200">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Our Mission</h1>
          <div className="mx-auto my-6 h-1 w-24 bg-amber-500"></div>
          <p className="text-xl text-slate-600 leading-relaxed">
            Viking Labs was founded to solve a critical problem in the research community: the lack of verifiable, high-purity peptides. We set out to create a standard where <strong>transparency is not optional.</strong>
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 max-w-5xl">
        {/* Story Section */}
        <div className="grid gap-12 lg:grid-cols-2 items-center mb-20">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Research Grade Only</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              In an industry flooded with ambiguous sourcing, Viking Labs stands apart by owning the process. We don't just resell; we oversee manufacturing in a state-of-the-art facility equipped with:
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 items-center text-slate-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Ultrasonic Washing Systems
              </li>
              <li className="flex gap-3 items-center text-slate-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Class 100 Laminar Air Flow Tunnels
              </li>
              <li className="flex gap-3 items-center text-slate-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                High-Definition Ceramic Pump Filling
              </li>
            </ul>
            <p className="text-slate-600">
              This ensures every vial is free of contaminants, accurately dosed, and stable for your research applications.
            </p>
          </div>
          <div className="relative aspect-square bg-slate-200 rounded-3xl overflow-hidden shadow-inner">
             {/* Placeholder for Facility Photo */}
             <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold uppercase tracking-wider">
               Sterile Facility Photo
             </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Integrity</h3>
            <p className="text-slate-600">If a batch tests below 99%, we discard it. We post full COAs for every lot number sold.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Precision</h3>
            <p className="text-slate-600">Our ceramic pumps ensure exact fill volumes (±1%) so your research dosage calculations are never off.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Speed</h3>
            <p className="text-slate-600">We stock domestically. No waiting for overseas shipments. Orders ship same-day before 2PM.</p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <Link href="/catalog" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-10 py-4 text-sm font-bold tracking-widest text-white shadow-lg transition-all hover:bg-slate-800 hover:-translate-y-0.5">
            BROWSE CATALOG
          </Link>
        </div>
      </div>
    </div>
  );
}
