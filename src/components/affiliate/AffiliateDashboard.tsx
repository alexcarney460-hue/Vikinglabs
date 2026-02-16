'use client';

import { useEffect, useState } from 'react';
import { AffiliateSummary, AffiliateConversion, AffiliatePayout } from '@/lib/affiliates';

type ToolkitTemplate = {
  id: string;
  name: string;
  category: string;
  content: string;
  contentWithLink: string;
};

type Toolkit = {
  version: string;
  brandAssets: any[];
  colorPalette: Record<string, string>;
  templates: ToolkitTemplate[];
  guidelines: any;
  affiliateCode: string | null;
};

export default function AffiliateDashboard() {
  const [summary, setSummary] = useState<AffiliateSummary | null>(null);
  const [conversions, setConversions] = useState<AffiliateConversion[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [toolkit, setToolkit] = useState<Toolkit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversions' | 'payouts' | 'toolkit'>('overview');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, conversionsRes, payoutsRes, toolkitRes] = await Promise.all([
          fetch('/api/affiliate/summary'),
          fetch('/api/affiliate/conversions?limit=20'),
          fetch('/api/affiliate/payouts?limit=10'),
          fetch('/api/affiliate/toolkit'),
        ]);

        if (summaryRes.ok) setSummary((await summaryRes.json()).summary);
        if (conversionsRes.ok) setConversions((await conversionsRes.json()).conversions);
        if (payoutsRes.ok) setPayouts((await payoutsRes.json()).payouts);
        if (toolkitRes.ok) setToolkit((await toolkitRes.json()).toolkit);
      } catch (error) {
        console.error('[AffiliateDashboard] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function copyToClipboard(text: string, ref: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedRef(ref);
      setTimeout(() => setCopiedRef(null), 1500);
    });
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Loading dashboard…</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-amber-900 font-semibold">Unable to load affiliate data. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        {(['overview', 'conversions', 'payouts', 'toolkit'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'conversions' && '📈 Conversions'}
            {tab === 'payouts' && '💰 Payouts'}
            {tab === 'toolkit' && '🛠️ Toolkit'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Sales"
              value={formatCurrency(summary.totalSalesCents)}
              detail={`${summary.conversionCount} conversions`}
              color="bg-blue-50"
            />
            <KpiCard
              label="Commission Earned"
              value={formatCurrency(summary.totalCommissionCents)}
              detail={`${(summary.commissionRate * 100).toFixed(0)}% rate`}
              color="bg-emerald-50"
            />
            <KpiCard
              label="Paid"
              value={formatCurrency(summary.paidCommissionCents)}
              detail="Completed payouts"
              color="bg-amber-50"
            />
            <KpiCard
              label="Pending"
              value={formatCurrency(summary.pendingCommissionCents)}
              detail="Next payout"
              color="bg-orange-50"
            />
          </div>

          {/* Last 30 Days */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Last 30 Days</h3>
            <p className="mt-2 text-3xl font-black text-slate-900">{formatCurrency(summary.last30dSalesCents)}</p>
            <p className="mt-1 text-sm text-slate-600">in attributed sales</p>
          </div>

          {/* Affiliate Link & Code */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-900">Your Affiliate Code</label>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={summary.code || ''}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-900"
                />
                <button
                  onClick={() => copyToClipboard(summary.code || '', 'code')}
                  className={`rounded-xl px-4 py-3 font-bold text-white transition-all ${
                    copiedRef === 'code'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {copiedRef === 'code' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600">Share this code with your audience for trackable sales.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-900">Your Affiliate Link</label>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://vikinglabs.co'}?ref=${summary.code || 'code'}`}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-900 overflow-hidden"
                />
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vikinglabs.co'}?ref=${summary.code || 'code'}`,
                      'link'
                    )
                  }
                  className={`rounded-xl px-4 py-3 font-bold text-white transition-all ${
                    copiedRef === 'link'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {copiedRef === 'link' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600">Direct link to the store with your referral tracking.</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversions Tab */}
      {activeTab === 'conversions' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Recent Conversions</h3>
            <p className="mt-1 text-slate-600">Orders attributed to your referral link or code.</p>
          </div>
          {conversions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-900">Date</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-900">Order ID</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-900">Commission</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-700">{formatDate(c.createdAt)}</td>
                      <td className="px-6 py-4 font-mono text-slate-700">{c.orderId.slice(0, 12)}</td>
                      <td className="px-6 py-4 text-right text-slate-700 font-bold">{formatCurrency(c.amountCents)}</td>
                      <td className="px-6 py-4 text-right text-emerald-700 font-bold">{formatCurrency(c.commissionCents)}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-600">
              <p>No conversions yet. Start sharing your code and link!</p>
            </div>
          )}
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Payout History</h3>
            <p className="mt-1 text-slate-600">Track your commission payouts and status.</p>
          </div>
          {payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-900">Date</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-900">Amount</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-900">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-700">{formatDate(p.createdAt)}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(p.amountCents)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            p.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'processing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{p.reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-600">
              <p>No payouts yet. Earn commissions and request a payout!</p>
            </div>
          )}
        </div>
      )}

      {/* Toolkit Tab */}
      {activeTab === 'toolkit' && (
        <div className="space-y-8">
          {toolkit && (
            <>
              {/* Brand Assets */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Brand Assets</h3>
                <p className="mt-1 text-sm text-slate-600">Use these assets to promote Viking Labs professionally.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {toolkit.brandAssets.map((asset) => (
                    <div key={asset.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-bold text-slate-900">{asset.name}</p>
                      <p className="mt-1 text-xs text-slate-600">{asset.description}</p>
                      <a
                        href={`/affiliate-toolkit/${asset.filename}`}
                        download
                        className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Templates */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Copy Templates</h3>
                <p className="mt-1 text-sm text-slate-600">Ready-made messages you can customize and share.</p>
                <div className="mt-6 space-y-4">
                  {toolkit.templates.map((template) => (
                    <div key={template.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900">{template.name}</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{template.contentWithLink}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(template.contentWithLink, template.id)}
                          className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition-all whitespace-nowrap ${
                            copiedRef === template.id
                              ? 'bg-emerald-600'
                              : 'bg-amber-500 hover:bg-amber-600'
                          }`}
                        >
                          {copiedRef === template.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guidelines */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Guidelines</h3>
                <p className="mt-1 text-sm text-slate-600">Promotion best practices to keep content professional.</p>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">✓ Do</p>
                    <ul className="mt-3 space-y-2">
                      {toolkit.guidelines.do.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-red-700">✗ Don't</p>
                    <ul className="mt-3 space-y-2">
                      {toolkit.guidelines.dont.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return (
    <div className={`rounded-2xl ${color} border border-slate-200 p-6`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-900">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </div>
  );
}
