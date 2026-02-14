'use client';

import { useAccountingFetch, fmt, fmtNum } from '@/lib/admin/accounting-hooks';
import Link from 'next/link';

export default function CustomersPage() {
  const { data, loading } = useAccountingFetch<any>('/api/admin/accounting/customers');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Customer Metrics</h2>
        <Link href="/account/admin/accounting" className="text-sm font-bold text-amber-600 hover:text-amber-700">← Dashboard</Link>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Total Customers</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{fmtNum(data.totalCustomers)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{fmtNum(data.totalOrders)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Repeat Rate</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{data.repeatRate}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Avg LTV</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{fmt(data.avgLTV)}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">LTV</th>
                  <th className="px-4 py-3">First Order</th>
                  <th className="px-4 py-3">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.customers?.map((c: any) => (
                  <tr key={c.email} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{c.email}</td>
                    <td className="px-4 py-3 text-slate-700">{c.orderCount}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{fmt(c.lifetimeValue)}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.firstOrder).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.lastOrder).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
