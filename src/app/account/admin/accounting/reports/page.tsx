'use client';

import { useState } from 'react';
import { useAccountingFetch, fmt, fmtNum } from '@/lib/admin/accounting-hooks';
import Link from 'next/link';

export default function ReportsPage() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [exporting, setExporting] = useState(false);

  const { data, loading } = useAccountingFetch<any>(
    `/api/admin/accounting/reports?from=${from}&to=${to}&granularity=${granularity}`,
    [from, to, granularity]
  );

  async function handleExport(format: 'csv' | 'pdf') {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/accounting/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, format }),
      });
      if (format === 'csv') {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounting-${from}-to-${to}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = await res.json();
        const blob = new Blob([json.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = json.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Reports</h2>
        <Link href="/account/admin/accounting" className="text-sm font-bold text-amber-600 hover:text-amber-700">← Dashboard</Link>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col text-sm font-medium text-slate-600">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-600">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-600">
          Granularity
          <select value={granularity} onChange={(e) => setGranularity(e.target.value as any)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} disabled={exporting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
            Export CSV
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            Export PDF Data
          </button>
        </div>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {data?.revenue && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Revenue by Period</h3>
            {data.revenue.length === 0 ? (
              <p className="text-slate-400">No data for this range</p>
            ) : (
              <div className="space-y-2">
                {data.revenue.map((r: any, i: number) => {
                  const maxRev = Math.max(...data.revenue.map((x: any) => x.revenue));
                  const pct = maxRev > 0 ? (r.revenue / maxRev) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-28 flex-shrink-0 text-xs text-slate-500">
                        {new Date(r.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1">
                        <div className="h-6 rounded-full bg-slate-100">
                          <div className="h-6 rounded-full bg-amber-500 transition-all"
                            style={{ width: `${Math.max(pct, 1)}%` }} />
                        </div>
                      </div>
                      <span className="w-24 text-right text-sm font-bold text-slate-900">{fmt(r.revenue)}</span>
                      <span className="w-16 text-right text-xs text-slate-400">{r.orders} orders</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {data.refunds?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Refunds by Period</h3>
              <div className="space-y-2">
                {data.refunds.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {new Date(r.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-slate-700">{r.count} refunds — {fmt(r.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {fmt(data.revenue.reduce((s: number, r: any) => s + r.revenue, 0))}
                </p>
                <p className="text-sm text-slate-500">Total Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {fmtNum(data.revenue.reduce((s: number, r: any) => s + r.orders, 0))}
                </p>
                <p className="text-sm text-slate-500">Total Orders</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{data.revenue.length}</p>
                <p className="text-sm text-slate-500">Periods</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
