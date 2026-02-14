'use client';

import { useState } from 'react';
import { useAccountingFetch, fmt, fmtNum } from '@/lib/admin/accounting-hooks';
import Link from 'next/link';

export default function ProductsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const { data, loading } = useAccountingFetch<any>(
    `/api/admin/accounting/products?${params}`, [from, to]
  );

  const products = data?.products ?? [];
  const totalRevenue = products.reduce((s: number, p: any) => s + p.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Product Revenue</h2>
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
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {products.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Products</h3>
            <span className="text-sm text-slate-500">Total: {fmt(totalRevenue)}</span>
          </div>
          <div className="space-y-3">
            {products.map((p: any, i: number) => {
              const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-48 flex-shrink-0 truncate font-medium text-slate-700">{p.productId}</span>
                  <div className="flex-1">
                    <div className="h-5 rounded-full bg-slate-100">
                      <div className="h-5 rounded-full bg-amber-500" style={{ width: `${Math.max(pct, 1)}%` }} />
                    </div>
                  </div>
                  <span className="w-20 text-right text-sm font-bold text-slate-900">{fmt(p.revenue)}</span>
                  <span className="w-16 text-right text-xs text-slate-400">{fmtNum(p.unitsSold)} sold</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && products.length === 0 && (
        <p className="text-slate-400">No product revenue data found. Product data is parsed from order items.</p>
      )}
    </div>
  );
}
