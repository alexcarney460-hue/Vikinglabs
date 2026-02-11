/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import Link from "next/link";

import Hero from '../components/Hero.jsx';
import ProductGrid from '../components/ProductGrid';

const curatedCategories = [
  {
    label: 'Metabolic Control',
    desc: 'GLP-1, GIP & triple agonists',
    href: '/catalog?category=ADVANCED',
  },
  {
    label: 'GH Secretagogues',
    desc: 'CJC, Ipamorelin, GHRPs',
    href: '/catalog?category=TYPE%20I',
  },
  {
    label: 'Regenerative Stacks',
    desc: 'BPC/TB blends & recovery',
    href: '/catalog?category=BLEND',
  },
  {
    label: 'Cellular Repair',
    desc: 'NAD+, FOXO4-DRI, senolytics',
    href: '/catalog?category=TYPE%20III',
  },
];

export default function Home() {
  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* USP Banner (Auto-scrolling marquee) */}
      <div className="bg-slate-50 border-b border-slate-100 overflow-hidden">
        <div className="vl-marquee">
          <div className="vl-marquee__track text-sm font-bold text-slate-700 uppercase tracking-wide">
            <div className="flex items-center justify-center gap-12 px-6 py-3">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Premium Peptides</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Free Shipping Over $200</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Lab Verified &gt;99%</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
          <div className="vl-marquee__track text-sm font-bold text-slate-700 uppercase tracking-wide" aria-hidden="true">
            <div className="flex items-center justify-center gap-12 px-6 py-3">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Premium Peptides</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Free Shipping Over $200</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Lab Verified &gt;99%</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                <span>Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - The "Card" */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 shadow-xl border border-slate-200">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center p-8 lg:p-12">
              {/* Left Content (Mobile: Bottom, Desktop: Left) */}
              <div className="order-2 lg:order-1 space-y-6 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start">
                   <div className="relative h-16 w-40">
                      <Image src="/logo-primary.png" alt="Viking Labs" fill className="object-contain" />
                   </div>
                </div>
                
                <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Proudly offering <span className="text-amber-600">top-quality peptides</span> for research.
                </h1>
                
                <p className="text-base lg:text-lg text-slate-600 leading-relaxed max-w-md mx-auto lg:mx-0">
                  Viking Labs operates with transparency and integrity, providing detailed HPLC analysis and sterility data for every batch.
                </p>
                
                <div className="pt-4 space-y-4">
                  <Link 
                    href="/catalog" 
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-10 py-4 text-sm font-bold tracking-widest text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:scale-105 active:scale-95"
                  >
                    SHOP NOW
                  </Link>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    {curatedCategories.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-amber-500 hover:-translate-y-0.5"
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-900">{item.desc}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Graphics (Mobile: Top, Desktop: Right) */}
              <div className="order-1 lg:order-2 relative h-[300px] lg:h-[450px] w-full flex items-center justify-center">
                 <Image 
                  src="/hero-vials.jpg" 
                  alt="Viking Labs Epitalon and CJC/Ipamorelin vials" 
                  width={450}
                  height={600}
                  className="max-w-full max-h-full drop-shadow-2xl lg:translate-x-10"
                  priority
                />
                <div className="absolute inset-0 scale-105 blur-3xl bg-amber-200/10 rounded-full -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purity Banner */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Hero />
        </div>
      </section>

      {/* Subscribe & Save */}
      <section className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-amber-300">Autoship Program</p>
              <h2 className="mt-4 text-3xl font-bold">Lock in 10% off with Subscribe & Save</h2>
              <p className="mt-4 text-slate-200">
                Researchers who rely on the same compounds month over month can schedule automatic resupply every 30 days. Pause or cancel anytime inside your account—no hidden fees, just guaranteed inventory and loyalty pricing.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li>• 10% discount on every recurring shipment</li>
                <li>• Priority pull from fresh COA lots</li>
                <li>• Automated cold-chain packaging with tracking</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-white/5 p-8 shadow-xl shadow-black/20">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">How it works</p>
              <ol className="mt-4 space-y-4 text-sm text-slate-100 list-decimal list-inside">
                <li>Select “Autoship & Save 10%” on any product.</li>
                <li>Choose your vial size. Discount applies instantly.</li>
                <li>Manage renewals from your dashboard in two clicks.</li>
              </ol>
              <Link href="/catalog" className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-400">
                Browse eligible products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Viking */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Why Viking Labs?</p>
              <h2 className="mt-4 text-3xl font-bold text-slate-900">Trusted science. Verified batches.</h2>
              <p className="mt-3 text-slate-600">
                Every vial that leaves our facility is backed by ISO 17025 partner labs, in-house sterility logs, and serialized labels for full chain-of-custody. Researchers choose Viking for consistent purity and transparent documentation.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  { title: 'Unmatched Quality', desc: '≥99% purity confirmed via HPLC + MS.' },
                  { title: 'Innovative Solutions', desc: 'Blends engineered for recovery and metabolic control.' },
                  { title: 'Comprehensive Selection', desc: 'Type I–III, blends, and advanced agonists in stock.' },
                  { title: 'Reliable Results', desc: 'Serialized COAs stored with your order history.' }
                ].map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">✓</div>
                    <h3 className="mt-3 text-sm font-bold uppercase tracking-wider text-slate-900">{feature.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-amber-200/30 rounded-full -z-10"></div>
              <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl p-8">
                <Image 
                  src="/hero-vials.jpg"
                  alt="Viking Labs vial line up"
                  width={640}
                  height={640}
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
                <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                  Research use only · Not for human consumption
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white" id="top-sellers">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-amber-600/20">
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Featured Vials</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-amber-600/20 to-transparent"></div>
          </div>
          
          <ProductGrid />
          
          <div className="mt-12 text-center">
             <Link href="/catalog" className="inline-block rounded-full border-2 border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all">
               View All Products
             </Link>
          </div>
        </div>
      </section>

      {/* Advanced Manufacturing Section */}
      <section className="bg-slate-50 py-20 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div className="order-2 lg:order-1 relative aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-lg">
                <Image src="/machinery/machinery-hero.png" alt="Manufacturing line" fill className="object-cover object-center" />
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-6">
                   <p className="text-sm font-bold text-slate-900">Fully Automated Line</p>
                   <p className="text-xs text-slate-500">Capable of 30+ vials/minute with Class 100 sterility.</p>
                </div>
             </div>
             <div className="order-1 lg:order-2 space-y-6">
                <p className="text-sm font-bold uppercase tracking-wider text-amber-600">Advanced Manufacturing</p>
                <h2 className="text-3xl font-bold text-slate-900">Sterile. Precise. Automated.</h2>
                <p className="text-slate-600 leading-relaxed">
                  We don't just resell—we manufacture. Our state-of-the-art facility utilizes a fully automated vial filling line equipped with ultrasonic washing, Class 100 laminar air flow, and high-definition ceramic pumps to ensure medical-grade sterility and dosage accuracy.
                </p>
                
                <ul className="space-y-4 pt-4">
                  <li className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Ultrasonic Washing</h4>
                      <p className="text-sm text-slate-500">Automated 360° flip cleaning removes all contaminants.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Class 100 Laminar Flow</h4>
                      <p className="text-sm text-slate-500">HEPA-filtered sterilization tunnel for maximum safety.</p>
                    </div>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Ceramic Precision Pumps</h4>
                      <p className="text-sm text-slate-500">Exact dosage accuracy (±1.0mm) for every single vial.</p>
                    </div>
                  </li>
                </ul>
             </div>
          </div>
        </div>
      </section>

      {/* Wholesale / White Label CTA */}
      <section className="bg-slate-900 py-20 text-white relative overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6">Wholesale & White Label Solutions</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Scale your brand with our premium manufacturing capabilities. We offer competitive bulk pricing and fully custom white-label packaging for qualified partners.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/wholesale" 
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:-translate-y-0.5"
            >
              Apply for Wholesale Account
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              Contact Sales
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Minimum Order Quantities apply. ISO 17025 testing included with all bulk orders.
          </p>
        </div>
      </section>

      {/* Affiliate Program Section */}
      <section className="bg-white py-20 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">Affiliate Program</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Creators earn 15%+ recurring</h2>
          <p className="mt-4 text-slate-600 max-w-3xl mx-auto">
            Give your audience access to GMP-grade research compounds and earn commission on every order. We ship influencer sample kits, custom coupon codes, and real-time dashboards.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
            {['Net-7 payouts','Personalized discount links','Research-compliant creative kit','Live click + order analytics'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/affiliates" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800">
              View Affiliate Details
            </Link>
            <Link href="https://forms.gle/affiliates" target="_blank" className="inline-flex items-center justify-center rounded-full border-2 border-amber-500 px-8 py-4 text-sm font-bold text-amber-600 hover:bg-amber-50">
              Apply Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
