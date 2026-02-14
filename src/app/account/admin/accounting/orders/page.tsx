'use client';

import { useState } from 'react';
import { useAccountingFetch, fmt, fmtDate } from '@/lib/admin/accounting-hooks';
import Link from 'next/link';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (method) params.set('paymentMethod', method);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const { data, loading } = useAccountingFetch<any>(`/api/admin/accounting/orders?${params}`, [page, method, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Orders</h2>
        <Link href="/account/admin/accounting" className="text-sm font-bold text-amber-600 hover:text-amber-700">
          ← Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col text-sm font-medium text-slate-600">
          From
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-600">
          To
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-600">
          Payment
          <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="stripe">Stripe</option>
            <option value="coinbase">Coinbase</option>
          </select>
        </label>
        <button onClick={() => { setFrom(''); setTo(''); setMethod(''); setPage(1); }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
          Clear
        </button>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {data?.orders && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-700">{o.email}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{o.provider}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{fmt(o.amountCents / 100)}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
                {data.orders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Page {data.page} of {data.totalPages} ({data.total} total)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="rounded-lg border px-3 py-1 disabled:opacity-40">Prev</button>
              <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}
                className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
