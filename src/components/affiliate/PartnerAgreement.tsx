'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, DollarSign, FileText } from 'lucide-react';

interface AgreementData {
  agreement: {
    tiers: {
      name: string;
      revenue: string;
      commission: string;
      benefits: string[];
    }[];
    sections: {
      title: string;
      icon: string;
      content: string;
    }[];
  };
}

export default function PartnerAgreement() {
  const [expanded, setExpanded] = useState<string | null>('tiers');
  const [agreement, setAgreement] = useState<AgreementData['agreement'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const res = await fetch('/api/affiliate/agreement');
        if (res.ok) {
          const data = await res.json();
          setAgreement(data.agreement);
        }
      } catch (error) {
        console.error('[PartnerAgreement] Error fetching agreement:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Loading partner agreement…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-8">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-amber-900">Viking Labs Partner Agreement</h2>
        </div>
        <p className="text-amber-800">Commission structure, benefits, and program terms</p>
      </div>

      {/* Tier Structure */}
      <div className="space-y-4">
        <div
          onClick={() => setExpanded(expanded === 'tiers' ? null : 'tiers')}
          className="cursor-pointer rounded-xl border border-slate-200 hover:border-amber-300 transition-colors bg-white p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900">Commission Tiers</h3>
            </div>
            <span className="text-slate-400 text-2xl">{expanded === 'tiers' ? '−' : '+'}</span>
          </div>
        </div>

        {expanded === 'tiers' && (
          <div className="grid gap-4">
            {/* Tier 1 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Tier 1 — Starter Partner</h4>
                  <p className="text-sm text-slate-600">$10,000 – $24,999 monthly referred revenue</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600">10%</div>
                  <p className="text-xs text-slate-500">commission</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Unique affiliate tracking link
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Unique partner discount code
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Standard monthly payout cycle
                </li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Tier 2 — Growth Partner</h4>
                  <p className="text-sm text-slate-600">$25,000 – $74,999 monthly referred revenue</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600">14%</div>
                  <p className="text-xs text-slate-500">commission</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Increased commission rate
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Eligibility for promotional incentives
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Standard monthly payout cycle
                </li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Tier 3 — Scale Partner</h4>
                  <p className="text-sm text-slate-600">$75,000 – $149,999 monthly referred revenue</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600">18%</div>
                  <p className="text-xs text-slate-500">commission</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Enhanced earnings structure
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Discount flexibility up to approved limits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Eligibility for bonus campaigns
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  Standard monthly payout cycle
                </li>
              </ul>
            </div>

            {/* Tier 4 */}
            <div className="rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-amber-900 mb-1">Tier 4 — Elite Partner</h4>
                  <p className="text-sm text-amber-700">$150,000 – $249,999 monthly referred revenue</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-600">21%</div>
                  <p className="text-xs text-amber-600">commission + NET-7 payouts</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  Priority support consideration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  Custom landing page eligibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  Quarterly bonus eligibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  Inventory priority consideration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  NET-7 payout eligibility (subject to approval)
                </li>
              </ul>
            </div>

            {/* Tier 5 */}
            <div className="rounded-xl border-2 border-amber-500 bg-gradient-to-br from-amber-100 to-amber-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-bold text-amber-950 mb-1">Tier 5 — Apex Partner</h4>
                  <p className="text-sm text-amber-800">$250,000+ monthly referred revenue</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-amber-700">23%</div>
                  <p className="text-xs text-amber-700">commission + NET-7 payouts</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-amber-950">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  Maximum commission tier
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  Custom promotional opportunities
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  Exclusive campaign eligibility
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  Highest payout priority
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  NET-7 payout eligibility (subject to approval)
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Compliance & Abuse Prevention */}
      <div className="space-y-4">
        <div
          onClick={() => setExpanded(expanded === 'compliance' ? null : 'compliance')}
          className="cursor-pointer rounded-xl border border-slate-200 hover:border-red-300 transition-colors bg-white p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-slate-900">Compliance & Abuse Prevention</h3>
            </div>
            <span className="text-slate-400 text-2xl">{expanded === 'compliance' ? '−' : '+'}</span>
          </div>
        </div>

        {expanded === 'compliance' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-4">
            <div>
              <h4 className="font-bold text-red-900 mb-2">Prohibited Activities</h4>
              <ul className="space-y-1 text-sm text-red-800">
                <li>• Self-referrals or indirect self-purchases</li>
                <li>• Misleading or deceptive promotions</li>
                <li>• Unauthorized advertising methods</li>
                <li>• Fraudulent transactions</li>
                <li>• Artificial traffic generation</li>
                <li>• Misrepresentation of products or policies</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-red-200">
              <h4 className="font-bold text-red-900 mb-2">Suspension & Termination</h4>
              <p className="text-sm text-red-800">
                Viking Labs may suspend or terminate participation at any time for fraud, policy violations, brand protection concerns, or unacceptable promotional practices. Unpaid commissions may be forfeited at Viking Labs discretion.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Program Terms */}
      <div className="space-y-4">
        <div
          onClick={() => setExpanded(expanded === 'terms' ? null : 'terms')}
          className="cursor-pointer rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-white p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Payout Terms & Program Authority</h3>
            </div>
            <span className="text-slate-400 text-2xl">{expanded === 'terms' ? '−' : '+'}</span>
          </div>
        </div>

        {expanded === 'terms' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 space-y-4">
            <div>
              <h4 className="font-bold text-blue-900 mb-2">Standard Payout Cycle</h4>
              <p className="text-sm text-blue-800 mb-2">Monthly cycle with payment issued within 30 days of month-end via verified payment method.</p>
              <p className="text-sm text-blue-800">Minimum payout threshold: $50 USD. Commissions below this may be held and carried forward.</p>
            </div>

            <div className="pt-4 border-t border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">NET-7 Payout Eligibility</h4>
              <p className="text-sm text-blue-800">
                Elite (Tier 4) and Apex (Tier 5) partners are eligible for accelerated NET-7 payouts upon approval. This requires account standing review, traffic quality validation, and fraud-risk assessment. NET-7 payouts may be revoked for policy violations.
              </p>
            </div>

            <div className="pt-4 border-t border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">Viking Labs Authority</h4>
              <p className="text-sm text-blue-800">
                Viking Labs maintains sole authority over attribution decisions, commission calculations, fraud determinations, policy enforcement, and program interpretation. All decisions are final.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-600">
          <strong>Agreement Version 1.0</strong> — Participation in the Viking Labs Partner Program constitutes acceptance of these terms. Viking Labs reserves the right to modify commission rates, tier thresholds, program rules, and partner benefits. Continued participation constitutes acceptance of updates.
        </p>
      </div>
    </div>
  );
}
