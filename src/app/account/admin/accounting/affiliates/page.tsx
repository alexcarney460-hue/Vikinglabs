'use client';

import { useState } from 'react';
import { useAccountingFetch, fmt, fmtDate } from '@/lib/admin/accounting-hooks';
import Link from 'next/link';

export default function AffiliatesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (status) params.set('status', status);

  const { data, loading } = useAccountingFetch<any>(
    `/api/admin/accounting/affiliates?${params}`, [page, status]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Affiliate Payouts</h2>
        <Link href="/account/admin/accounting" className="text-sm font-bold text-amber-600 hover:text-amber-700">← Dashboard</Link>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Total Paid</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{fmt(data.totalPaid)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-black text-amber-600">{fmt(data.pendingAmount)}</p>
            </div>
          </div>

          <div className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <label className="flex flex-col text-sm font-medium text-slate-600">
              Status
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Affiliate</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payouts?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-700">{p.affiliateId}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.periodStart && p.periodEnd
                        ? `${fmtDate(p.periodStart)} – ${fmtDate(p.periodEnd)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
                {data.payouts?.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No payouts found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Page {data.page} of {data.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                  className="rounded-lg border px-3 py-1 disabled:opacity-40">Prev</button>
                <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}
                  className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
