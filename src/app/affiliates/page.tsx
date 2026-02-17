import Link from 'next/link';
import AffiliateForm from '@/components/forms/AffiliateForm';

export const metadata = {
  title: 'Affiliate Program | Viking Labs',
  description: 'Earn up to 23% commission partnering with Viking Labs. NET-7 payouts, premium brand, dedicated support. Apply now.',
};

export default function AffiliatesPage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      {/* HERO */}
      <section className="border-b border-slate-200 py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          <p className="text-sm font-bold uppercase tracking-wider text-amber-600">Partner Program</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Become a Viking
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Join a community of creators and influencers building real authority in the peptide space. Earn up to 23% commission, access exclusive perks, and become part of something bigger than affiliate links.
          </p>
        </div>
      </section>

      {/* WHY BECOME VIKING */}
      <section className="border-b border-slate-200 py-16 lg:py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-12 text-center">
            Why Become Viking
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-amber-600 font-bold text-lg">✓</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Join a Tribe, Not a Program</h3>
                  <p className="text-slate-600">Partner with creators who take peptide knowledge seriously. Build community with people dedicated to research, quality, and real results.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-amber-600 font-bold text-lg">✓</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Earn Like an Owner</h3>
                  <p className="text-slate-600">Up to 23% commission at the Apex tier. Get paid like you built it—because with Viking, you do.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-amber-600 font-bold text-lg">✓</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Lightning-Fast Payouts</h3>
                  <p className="text-slate-600">Standard monthly payouts. NET-7 for top Vikings (Elite & Apex). Money when you need it, not 90 days later.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-amber-600 font-bold text-lg">✓</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Real Support, Real People</h3>
                  <p className="text-slate-600">You get strategy, creative assets, and genuine help from our team. Not a chatbot. Not abandoned in a dashboard.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-amber-600 font-bold text-lg">✓</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Your Own Discount Empire</h3>
                  <p className="text-slate-600">Custom promo codes. Watch your audience convert. Own your numbers, not just a link.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-amber-600 font-bold text-lg">✓</div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">Transparent, Real-Time Earnings</h3>
                  <p className="text-slate-600">Watch every click, conversion, and commission in real time. No mystery. No hidden math.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMISSION TIERS */}
      <section className="border-b border-slate-200 py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-4 text-center">
            Commission Tiers
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Your commission rate is based on your 30-day <span className="font-semibold">net referred revenue</span> (after refunds & chargebacks). Higher tier = higher earnings + more benefits.
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
              <span className="font-semibold text-amber-700">NET-7 Payouts:</span> Available for Elite & Apex partners. Get paid within 7 days subject to account review. Perfect for scaling creators who need faster cash flow.
            </p>
          </div>
        </div>
      </section>

      {/* VIKING ARSENAL */}
      <section className="border-b border-slate-200 py-16 lg:py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-12 text-center">
            Your Viking Arsenal
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl text-amber-600 mb-4">📊</div>
              <h3 className="font-bold text-slate-900 mb-2">War Room Dashboard</h3>
              <p className="text-sm text-slate-600">Real-time visibility into every click, conversion, and commission. Own your data.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl text-amber-600 mb-4">🎁</div>
              <h3 className="font-bold text-slate-900 mb-2">Creator Arsenal</h3>
              <p className="text-sm text-slate-600">Brand logos, product shots, email swipes, and TikTok templates ready to deploy.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl text-amber-600 mb-4">💰</div>
              <h3 className="font-bold text-slate-900 mb-2">Viking Bounties</h3>
              <p className="text-sm text-slate-600">Exclusive campaign bonuses and quarterly payouts for top performers.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl text-amber-600 mb-4">🎯</div>
              <h3 className="font-bold text-slate-900 mb-2">Custom Codes</h3>
              <p className="text-sm text-slate-600">Your personal promo codes tied to your brand. Build your own empire.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl text-amber-600 mb-4">🛡</div>
              <h3 className="font-bold text-slate-900 mb-2">Dedicated Viking Squad</h3>
              <p className="text-sm text-slate-600">Real people on your team. Strategy, assets, support—not bots.</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="text-3xl text-amber-600 mb-4">⚡</div>
              <h3 className="font-bold text-slate-900 mb-2">Viking Speed Payouts</h3>
              <p className="text-sm text-slate-600">Monthly standard. NET-7 for elite Vikings. Get paid fast.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE LOOK FOR */}
      <section className="border-b border-slate-200 py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-12 text-center">
            Join the Viking Ranks
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              'Fitness & Performance Creators',
              'Biohacking & Longevity Influencers',
              'Wellness & Lifestyle Audiences',
              'Research & Science Communities',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <span className="text-amber-600 text-lg font-semibold">→</span>
                <span className="font-semibold text-slate-900">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM SECTION */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Become a Viking?</h2>
            <p className="text-slate-600 mb-8">
              Submit your info below. We'll review within 24 hours and get you set up with your dashboard, discount codes, and creator arsenal. Let's build something real together.
            </p>
            <AffiliateForm />
          </div>
        </div>
      </section>

      {/* FAQ / INFO */}
      <section className="border-t border-slate-200 py-16 lg:py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 mb-12 text-center">
            Viking Questions Answered
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">How do Viking commissions work?</h3>
              <p className="text-slate-600">Your tier is based on 30-day <span className="font-semibold">net referred revenue</span> (payments after refunds, chargebacks, and reversals). Earn 10%–23% commission depending on your tier. Tiers reset monthly—higher performance = higher rate. Simple.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">When do I get my cut?</h3>
              <p className="text-slate-600">Standard: monthly payouts. If you hit Elite ($150k+) or Apex ($250k+) tier, you're eligible for NET-7 (7-day payouts) after account review.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">What's the earning potential?</h3>
              <p className="text-slate-600">Depends on your audience. Hit $10k referred revenue? You're at 10%. Scale to $250k+? You're earning 23%. The more you drive, the more you earn.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Still have questions?</h3>
              <p className="text-slate-600">
                Reach out to the Viking squad: <a href="mailto:partners@vikinglabs.co" className="text-amber-600 hover:text-amber-700 font-semibold">partners@vikinglabs.co</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
