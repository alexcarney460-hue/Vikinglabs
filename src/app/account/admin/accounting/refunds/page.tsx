'use client';

import { useState } from 'react';
import { useAccountingFetch, fmt, fmtDate } from '@/lib/admin/accounting-hooks';
import Link from 'next/link';

export default function RefundsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '50' });
  if (status) params.set('status', status);

  const { data, loading, refetch } = useAccountingFetch<any>(
    `/api/admin/accounting/refunds?${params}`, [page, status]
  );

  async function handleAction(id: string, newStatus: 'approved' | 'rejected') {
    setActionLoading(id);
    try {
      await fetch('/api/admin/accounting/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      refetch();
    } catch { /* ignore */ }
    setActionLoading(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Refund Management</h2>
        <Link href="/account/admin/accounting" className="text-sm font-bold text-amber-600 hover:text-amber-700">← Dashboard</Link>
      </div>

      <div className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col text-sm font-medium text-slate-600">
          Status
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {data?.refunds && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.refunds.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-700">{r.email ?? '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{fmt(r.amount)}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{r.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleAction(r.id, 'approved')}
                            disabled={actionLoading === r.id}
                            className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200">
                            Approve
                          </button>
                          <button onClick={() => handleAction(r.id, 'rejected')}
                            disabled={actionLoading === r.id}
                            className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-200">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {data.refunds.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No refunds found</td></tr>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
