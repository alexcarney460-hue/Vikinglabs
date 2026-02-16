'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { AffiliateApplication } from '@/lib/affiliates';

type AffiliateWithStats = AffiliateApplication & {
  stats: {
    clicks: number;
    orders: number;
    revenueCents: number;
  };
};

type Props = {
  initialApplications: AffiliateWithStats[];
};

export default function ApprovedAffiliatesClient({ initialApplications }: Props) {
  const [affiliates, setAffiliates] = useState(initialApplications);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'orders' | 'expiry'>('revenue');
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [savingRate, setSavingRate] = useState<Record<string, boolean>>({});
  const [welcomeSent, setWelcomeSent] = useState<Record<string, boolean>>({});
  const [sendingWelcome, setSendingWelcome] = useState<Record<string, boolean>>({});

  const handleRateChange = (id: string, value: string) => {
    setEditingRates((prev) => ({ ...prev, [id]: value }));
  };

  const saveCommissionRate = async (id: string) => {
    const rateStr = editingRates[id];
    if (rateStr === undefined) return;
    const rate = parseFloat(rateStr) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) return;

    setSavingRate((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: rate }),
      });
      if (res.ok) {
        setAffiliates((prev) =>
          prev.map((a) => (a.id === id ? { ...a, commissionRate: rate } : a))
        );
        setEditingRates((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } catch (e) {
      console.error('Failed to save commission rate:', e);
    } finally {
      setSavingRate((prev) => ({ ...prev, [id]: false }));
    }
  };

  const sendWelcomeEmail = async (id: string) => {
    setSendingWelcome((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/affiliates/${id}/welcome`, { method: 'POST' });
      if (res.ok) {
        setWelcomeSent((prev) => ({ ...prev, [id]: true }));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to send welcome email');
      }
    } catch (e) {
      console.error('Failed to send welcome email:', e);
      alert('Failed to send welcome email');
    } finally {
      setSendingWelcome((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filtered = useMemo(() => {
    let result = [...affiliates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (aff) =>
          aff.name.toLowerCase().includes(term) ||
          aff.email.toLowerCase().includes(term) ||
          aff.code?.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'revenue') return b.stats.revenueCents - a.stats.revenueCents;
      if (sortBy === 'orders') return b.stats.orders - a.stats.orders;
      if (sortBy === 'expiry') {
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      }
      return 0;
    });

    return result;
  }, [affiliates, searchTerm, sortBy]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, aff) => ({
        clicks: acc.clicks + aff.stats.clicks,
        orders: acc.orders + aff.stats.orders,
        revenueCents: acc.revenueCents + aff.stats.revenueCents,
        commissionCents: acc.commissionCents + Math.round(aff.stats.revenueCents * aff.commissionRate),
      }),
      { clicks: 0, orders: 0, revenueCents: 0, commissionCents: 0 }
    );
  }, [filtered]);

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Code', 'Clicks', 'Orders', 'Revenue', 'Commission Rate', 'Commission Owed', 'Expires'];
    const rows = filtered.map((aff) => [
      aff.name,
      aff.email,
      aff.code || '',
      aff.stats.clicks.toString(),
      aff.stats.orders.toString(),
      `$${(aff.stats.revenueCents / 100).toFixed(2)}`,
      `${(aff.commissionRate * 100).toFixed(0)}%`,
      `$${(aff.stats.revenueCents * aff.commissionRate / 100).toFixed(2)}`,
      aff.expiresAt ? new Date(aff.expiresAt).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliates-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isExpired = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const daysUntilExpiry = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/account/admin/affiliates"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← Back to Applications
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900">Approved Affiliates</h1>
          </div>
          <p className="mt-2 text-slate-600">Manage active affiliate partners and track their performance</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Affiliates</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Clicks</p>
            <p className="mt-2 text-3xl font-extrabold text-blue-600">{totals.clicks.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Orders</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{totals.orders.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Revenue</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">${(totals.revenueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-xs text-slate-500">Commission owed: ${(totals.commissionCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm focus:border-amber-500 focus:outline-none"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="orders">Sort by Orders</option>
              <option value="name">Sort by Name</option>
              <option value="expiry">Sort by Expiry</option>
            </select>
            <button
              onClick={exportCSV}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Affiliates Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Affiliate</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Code</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Expires</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Clicks</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Orders</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Commission</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((aff) => {
                const commission = Math.round(aff.stats.revenueCents * aff.commissionRate);
                const expired = isExpired(aff.expiresAt);
                const days = daysUntilExpiry(aff.expiresAt);

                return (
                  <tr key={aff.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{aff.name}</p>
                        <p className="text-xs text-slate-500">{aff.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-800">{aff.code}</code>
                    </td>
                    <td className="px-6 py-4">
                      {aff.expiresAt ? (
                        <div>
                          <p className={`text-xs font-semibold ${expired ? 'text-red-600' : days && days <= 7 ? 'text-amber-600' : 'text-slate-600'}`}>
                            {expired ? 'EXPIRED' : new Date(aff.expiresAt).toLocaleDateString()}
                          </p>
                          {!expired && days !== null && (
                            <p className="text-xs text-slate-400">{days} day{days !== 1 ? 's' : ''} left</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">—</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">{aff.stats.clicks.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">{aff.stats.orders.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">${(aff.stats.revenueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">
                      <div>
                        <p className="text-sm font-bold text-amber-600">${(commission / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <div className="mt-1 flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            className="w-16 rounded border border-slate-300 px-1 py-0.5 text-right text-xs focus:border-amber-500 focus:outline-none"
                            value={editingRates[aff.id] ?? (aff.commissionRate * 100).toFixed(0)}
                            onChange={(e) => handleRateChange(aff.id, e.target.value)}
                          />
                          <span className="text-xs text-slate-400">%</span>
                          {editingRates[aff.id] !== undefined && (
                            <button
                              onClick={() => saveCommissionRate(aff.id)}
                              disabled={savingRate[aff.id]}
                              className="ml-1 rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                            >
                              {savingRate[aff.id] ? '...' : 'Save'}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => sendWelcomeEmail(aff.id)}
                        disabled={sendingWelcome[aff.id] || welcomeSent[aff.id]}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {welcomeSent[aff.id] ? 'Sent ✓' : sendingWelcome[aff.id] ? 'Sending...' : 'Send Welcome'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">No approved affiliates found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
