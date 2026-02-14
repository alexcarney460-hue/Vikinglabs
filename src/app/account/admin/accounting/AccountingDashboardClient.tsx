'use client';

import { useAccountingFetch, fmt, fmtNum } from '@/lib/admin/accounting-hooks';
import Link from 'next/link';

type Summary = {
  summary: {
    revenueYTD: number;
    revenueMonth: number;
    revenueWeek: number;
    orderCount: number;
    avgOrderValue: number;
    refundRate: number;
    refundTotal: number;
    paymentBreakdown: { method: string; count: number; total: number }[];
  };
};

const subPages = [
  { href: '/account/admin/accounting/orders', label: 'Orders', desc: 'Browse & filter all orders' },
  { href: '/account/admin/accounting/reports', label: 'Reports', desc: 'Generate date-range reports' },
  { href: '/account/admin/accounting/products', label: 'Products', desc: 'Revenue by product' },
  { href: '/account/admin/accounting/customers', label: 'Customers', desc: 'LTV & repeat rate' },
  { href: '/account/admin/accounting/refunds', label: 'Refunds', desc: 'Track & approve refunds' },
  { href: '/account/admin/accounting/affiliates', label: 'Affiliates', desc: 'Earnings & payouts' },
];

export default function AccountingDashboardClient() {
  const { data, loading, error } = useAccountingFetch<Summary>('/api/admin/accounting/summary');
  const s = data?.summary;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Accounting Dashboard</h2>
        <Link
          href="/account/admin/accounting/reports"
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600"
        >
          Generate Report
        </Link>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {s && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card label="Revenue (YTD)" value={fmt(s.revenueYTD)} />
            <Card label="Revenue (Month)" value={fmt(s.revenueMonth)} />
            <Card label="Revenue (Week)" value={fmt(s.revenueWeek)} />
            <Card label="Orders (Month)" value={fmtNum(s.orderCount)} />
            <Card label="Avg Order Value" value={fmt(s.avgOrderValue)} />
            <Card label="Refund Rate" value={`${s.refundRate}%`} accent={s.refundRate > 5} />
            <Card label="Refunds (Month)" value={fmt(s.refundTotal)} />
          </div>

          {/* Payment breakdown */}
          {s.paymentBreakdown.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-bold text-slate-900">Payment Methods</h3>
              <div className="space-y-3">
                {s.paymentBreakdown.map((p) => (
                  <div key={p.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                      <span className="font-semibold capitalize text-slate-700">{p.method}</span>
                      <span className="text-sm text-slate-400">{p.count} orders</span>
                    </div>
                    <span className="font-bold text-slate-900">{fmt(p.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Sub-pages grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {subPages.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-amber-300 hover:bg-amber-50"
          >
            <h3 className="font-bold text-slate-900 group-hover:text-amber-700">{p.label}</h3>
            <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tracking-tight ${accent ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}
