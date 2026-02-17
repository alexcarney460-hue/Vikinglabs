import Link from 'next/link';

export const metadata = {
  title: 'Creator Partner Program | Viking Labs',
  description: 'Partner with Viking Labs. Up to 23% commission, NET-7 payouts, and exclusive creator perks. Premium affiliate opportunity.',
};

export default function CreatorsPage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      {/* SECTION 1 — HERO */}
      <section className="border-b border-slate-200 py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-4xl space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-600">Creator Partner Program</p>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Become a Viking
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Join a community of creators building real authority in the peptide space. Earn up to 23% commission, access exclusive perks, NET-7 payouts, and become part of something bigger.
          </p>
          <div className="pt-4">
            <Link
              href="/affiliates"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Apply to Partner Program
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2 — COMMISSION TIERS */}
      <section className="border-b border-slate-200 py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 text-center">
            Commission Tiers
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Earn commissions based on your 30-day <span className="font-semibold">net referred revenue</span> (after refunds & chargebacks). Scale from Starter to Apex tier with increasing benefits.
          </p>
          
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Tier 1 */}
            <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-2xl font-bold text-amber-600 mb-2">10%</div>
              <h3 className="font-bold text-slate-900 mb-3">Starter</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold">Revenue:</span> $10k–$25k</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Tracking link</li>
                  <li>✓ Discount code</li>
                  <li>✓ Monthly payouts</li>
                </ul>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-2xl font-bold text-amber-600 mb-2">14%</div>
              <h3 className="font-bold text-slate-900 mb-3">Growth</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold">Revenue:</span> $25k–$75k</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Higher rate</li>
                  <li>✓ Promo bonuses</li>
                  <li>✓ Monthly payouts</li>
                </ul>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-2xl font-bold text-amber-600 mb-2">18%</div>
              <h3 className="font-bold text-slate-900 mb-3">Scale</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold">Revenue:</span> $75k–$150k</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Discount flex</li>
                  <li>✓ Bonus campaigns</li>
                  <li>✓ Monthly payouts</li>
                </ul>
              </div>
            </div>

            {/* Tier 4 */}
            <div className="p-6 rounded-lg border-2 border-amber-500 bg-white">
              <div className="text-2xl font-bold text-amber-600 mb-2">21%</div>
              <h3 className="font-bold text-slate-900 mb-3">Elite</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold">Revenue:</span> $150k–$250k</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Priority support</li>
                  <li>✓ <span className="font-semibold text-amber-600">NET-7 payouts</span></li>
                  <li>✓ Bonus eligibility</li>
                </ul>
              </div>
            </div>

            {/* Tier 5 */}
            <div className="p-6 rounded-lg border-2 border-amber-600 bg-white shadow-lg">
              <div className="text-2xl font-bold text-amber-600 mb-2">23%</div>
              <h3 className="font-bold text-slate-900 mb-3">Apex</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold">Revenue:</span> $250k+</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Max commission</li>
                  <li>✓ <span className="font-semibold text-amber-600">NET-7 payouts</span></li>
                  <li>✓ Exclusive campaigns</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-amber-700">NET-7 Payouts:</span> Available for Elite & Apex partners. Get paid within 7 days (subject to account review). Perfect for scaling creators.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PARTNER BENEFITS */}
      <section className="border-b border-slate-200 py-16 lg:py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-12 text-center">
            Partner Benefits
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-2xl text-amber-600 mb-4">⚡</div>
              <h3 className="font-bold text-slate-900 mb-2">Fast Payouts</h3>
              <p className="text-sm text-slate-600">Monthly standard. NET-7 available for Elite & Apex partners.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-2xl text-amber-600 mb-4">🎯</div>
              <h3 className="font-bold text-slate-900 mb-2">Custom Discount Codes</h3>
              <p className="text-sm text-slate-600">Personal promo codes to drive conversions and track your audience engagement.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-2xl text-amber-600 mb-4">📊</div>
              <h3 className="font-bold text-slate-900 mb-2">Real-Time Tracking</h3>
              <p className="text-sm text-slate-600">Full dashboard visibility into clicks, conversions, and earnings.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-2xl text-amber-600 mb-4">🎁</div>
              <h3 className="font-bold text-slate-900 mb-2">Performance Bonuses</h3>
              <p className="text-sm text-slate-600">Extra earnings through promotional campaigns and quarterly bonuses.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-2xl text-amber-600 mb-4">🤝</div>
              <h3 className="font-bold text-slate-900 mb-2">Dedicated Support</h3>
              <p className="text-sm text-slate-600">Partner support team to help with strategy, assets, and questions.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-2xl text-amber-600 mb-4">🧬</div>
              <h3 className="font-bold text-slate-900 mb-2">Premium Brand</h3>
              <p className="text-sm text-slate-600">Partner with a lab-verified, research-focused premium brand.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHO THIS IS FOR */}
      <section className="border-b border-slate-200 py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-12 text-center">
            Ideal Partners
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              'Fitness & Performance Creators',
              'Biohacking & Longevity Niche',
              'Lifestyle & Wellness Audiences',
              'Research-Interested Communities',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <span className="text-amber-600 text-2xl">→</span>
                <span className="font-semibold text-slate-900">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — FINAL CTA */}
      <section className="py-16 lg:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-2xl text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            Ready to Become a Viking?
          </h2>
          <p className="text-slate-300 text-lg">
            Join creators who are building real authority in the peptide space. Get paid, get support, get legendary.
          </p>
          
          <Link
            href="/affiliates"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
          >
            Apply Now
          </Link>

          <p className="text-slate-400 text-sm">
            Full details at <Link href="/affiliates" className="text-amber-400 hover:text-amber-300 underline">vikinglabs.co/affiliates</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
