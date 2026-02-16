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
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversions' | 'payouts' | 'toolkit' | 'api-keys'>('overview');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, conversionsRes, payoutsRes, toolkitRes, keysRes] = await Promise.all([
          fetch('/api/affiliate/summary'),
          fetch('/api/affiliate/conversions?limit=20'),
          fetch('/api/affiliate/payouts?limit=10'),
          fetch('/api/affiliate/toolkit'),
          fetch('/api/affiliate/keys'),
        ]);

        if (summaryRes.ok) setSummary((await summaryRes.json()).summary);
        if (conversionsRes.ok) setConversions((await conversionsRes.json()).conversions);
        if (payoutsRes.ok) setPayouts((await payoutsRes.json()).payouts);
        if (toolkitRes.ok) setToolkit((await toolkitRes.json()).toolkit);
        if (keysRes.ok) setApiKeys((await keysRes.json()).keys || []);
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
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {(['overview', 'conversions', 'payouts', 'toolkit', 'api-keys'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'conversions' && '📈 Conversions'}
            {tab === 'payouts' && '💰 Payouts'}
            {tab === 'toolkit' && '🛠️ Toolkit'}
            {tab === 'api-keys' && '🔑 API Keys'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Last 30 Days</h3>
            <p className="mt-2 text-3xl font-black text-slate-900">{formatCurrency(summary.last30dSalesCents)}</p>
            <p className="mt-1 text-sm text-slate-600">in attributed sales</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-900">Your Affiliate Code</label>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={summary.code || ''}
                  readOnly
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-900"
                />
                <button
                  onClick={() => copyToClipboard(summary.code || '', 'code')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    copiedRef === 'code'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {copiedRef === 'code' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-900">Tracking Link</label>
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={`https://vikinglabs.co?ref=${summary.code}`}
                  readOnly
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-sm text-slate-900"
                />
                <button
                  onClick={() => copyToClipboard(`https://vikinglabs.co?ref=${summary.code}`, 'link')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    copiedRef === 'link'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {copiedRef === 'link' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversions Tab */}
      {activeTab === 'conversions' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Order ID</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-600">Sale Value</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-600">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {conversions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-600">No conversions yet</td>
                </tr>
              ) : (
                conversions.map((conv, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{formatDate(conv.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{conv.orderId.slice(0, 8)}…</td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900 font-semibold">{formatCurrency(conv.amountCents)}</td>
                    <td className="px-6 py-4 text-right text-sm text-emerald-700 font-bold">{formatCurrency(conv.commissionCents)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-600">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-600">No payouts yet</td>
                </tr>
              ) : (
                payouts.map((payout, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{formatDate(payout.createdAt)}</td>
                    <td className="px-6 py-4 text-right text-sm text-slate-900 font-semibold">{formatCurrency(payout.amountCents)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        payout.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{payout.reference || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Toolkit Tab */}
      {activeTab === 'toolkit' && toolkit && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Marketing Templates</h3>
            <div className="mt-6 grid gap-6">
              {toolkit.templates.map((template) => (
                <div key={template.id} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{template.name}</p>
                      <p className="mt-1 text-xs text-slate-600">{template.category}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(template.contentWithLink, template.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                        copiedRef === template.id
                          ? 'bg-emerald-600'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {copiedRef === template.id ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-slate-700">{template.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">Guidelines</h3>
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
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 mb-6">API Keys</h3>
            <p className="text-sm text-slate-600 mb-6">Create and manage API keys for programmatic access to affiliate resources.</p>
            
            {/* Create Key Form */}
            <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
              <h4 className="font-bold text-slate-900 mb-4">Create New Key</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Key name (e.g., 'Dashboard', 'Server')"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  disabled={creatingKey}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
                <button
                  onClick={async () => {
                    if (!newKeyName.trim()) return;
                    setCreatingKey(true);
                    try {
                      const res = await fetch('/api/affiliate/keys', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newKeyName }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setApiKeys([...apiKeys, { ...data.keyRecord, name: newKeyName }]);
                        setNewKeyName('');
                        alert(`Key created! Store it safely:\n\n${data.key}\n\nYou won't be able to see it again.`);
                      } else {
                        const err = await res.json();
                        alert(`Error: ${err.error || 'Failed to create key'}`);
                      }
                    } catch (err) {
                      console.error('Error creating key:', err);
                      alert('Error creating key');
                    } finally {
                      setCreatingKey(false);
                    }
                  }}
                  disabled={creatingKey || !newKeyName.trim()}
                  className="rounded-lg bg-amber-500 px-6 py-2 font-bold text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingKey ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>

            {/* Keys List */}
            {apiKeys.length === 0 ? (
              <p className="text-sm text-slate-600">No API keys yet. Create one above to get started.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase text-slate-600">Your Keys ({apiKeys.length})</p>
                {apiKeys.map((key: any, idx: number) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{key.name || 'Unnamed'}</p>
                      <p className="text-xs text-slate-500">ID: {key.id.slice(0, 12)}…</p>
                      <p className="text-xs text-slate-500">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        if (!confirm('Revoke this key? It cannot be undone.')) return;
                        try {
                          const res = await fetch(`/api/affiliate/keys/${key.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            setApiKeys(apiKeys.filter((k) => k.id !== key.id));
                          }
                        } catch (err) {
                          console.error('Error revoking key:', err);
                        }
                      }}
                      className="rounded-lg bg-red-100 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-200"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Usage Info */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h4 className="font-bold text-slate-900 mb-3">Bearer Token Usage</h4>
              <p className="text-sm text-slate-600 mb-4">
                Include your API key as a Bearer token in the Authorization header:
              </p>
              <code className="block rounded-lg bg-slate-800 px-4 py-3 text-xs font-mono text-slate-100 overflow-x-auto mb-4">
                Authorization: Bearer &lt;your_api_key&gt;
              </code>
              <p className="text-sm text-slate-600 mb-3">Available endpoints:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <code className="bg-slate-200 px-2 py-1 rounded text-xs">/api/affiliate/summary</code></li>
                <li>• <code className="bg-slate-200 px-2 py-1 rounded text-xs">/api/affiliate/conversions</code></li>
                <li>• <code className="bg-slate-200 px-2 py-1 rounded text-xs">/api/affiliate/payouts</code></li>
                <li>• <code className="bg-slate-200 px-2 py-1 rounded text-xs">/api/affiliate/toolkit</code></li>
              </ul>
            </div>
          </div>
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
