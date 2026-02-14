import ContactForm from '@/components/forms/ContactForm';

export default function ContactPage() {
  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero */}
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Support</h1>
          <div className="mx-auto my-6 h-1 w-24 bg-amber-500"></div>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Have questions about an order or our products? Our team is here to help.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2">
          
          {/* Contact Form */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Get in touch</h2>
              <ContactForm />
            </div>
          </div>
          
          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                Contact Info
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email Support</p>
                  <p className="text-lg font-medium">info@vikinglabs.com</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Response Time</p>
                  <p className="text-slate-300">Typically within 24 hours (Mon-Fri)</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Office Hours</p>
                  <p className="text-slate-300">9:00 AM – 5:00 PM PST</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Shipping Info</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Orders placed before <span className="font-bold text-slate-900">2:00 PM CST</span> ship the same business day.
              </p>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Free shipping on orders over $200</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Discrete packaging</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Tracking provided via email</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
