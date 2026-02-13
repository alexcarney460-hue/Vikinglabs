import Link from 'next/link';
import { listAffiliateApplications, listAffiliateStats } from '@/lib/affiliates';

function formatUsd(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function AdminAnalyticsPage() {
  // Use existing affiliate telemetry as the first analytics surface.
  const applications = await listAffiliateApplications();
  const statsById = await listAffiliateStats(applications.map((a) => a.id));

  const totals = applications.reduce(
    (acc, app) => {
      const s = statsById[app.id];
      acc.clicks += s?.clicks ?? 0;
      acc.orders += s?.orders ?? 0;
      acc.revenueCents += s?.revenueCents ?? 0;
      acc.total += 1;
      acc.approved += app.status === 'approved' ? 1 : 0;
      acc.pending += app.status === 'pending' ? 1 : 0;
      return acc;
    },
    { total: 0, approved: 0, pending: 0, clicks: 0, orders: 0, revenueCents: 0 }
  );

  const leaderboard = [...applications]
    .filter((a) => a.status === 'approved')
    .map((a) => ({
      app: a,
      stats: statsById[a.id] ?? { affiliateId: a.id, clicks: 0, orders: 0, revenueCents: 0 },
    }))
    .sort((a, b) => b.stats.revenueCents - a.stats.revenueCents)
    .slice(0, 20);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Analytics</h2>
          <p className="mt-2 text-slate-600">Current: Affiliate program performance (clicks, orders, revenue).</p>
        </div>
        <Link href="/account/admin/affiliates" className="text-sm font-bold text-amber-700 hover:text-amber-800">
          Manage affiliates →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Approved</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totals.approved}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Pending</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totals.pending}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Clicks</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totals.clicks}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Revenue</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{formatUsd(totals.revenueCents)}</div>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-black uppercase tracking-wide text-slate-900">Top affiliates</div>
          <div className="mt-1 text-sm text-slate-600">Sorted by revenue. (Approved only.)</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-6 py-3">Affiliate</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Clicks</th>
                <th className="px-6 py-3">Orders</th>
                <th className="px-6 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map(({ app, stats }) => (
                <tr key={app.id}>
                  <td className="px-6 py-3">
                    <div className="font-bold text-slate-900">{app.name}</div>
                    <div className="text-slate-600">{app.email}</div>
                  </td>
                  <td className="px-6 py-3 font-mono font-bold text-slate-800">{app.code ?? '—'}</td>
                  <td className="px-6 py-3 font-bold text-slate-800">{stats.clicks}</td>
                  <td className="px-6 py-3 font-bold text-slate-800">{stats.orders}</td>
                  <td className="px-6 py-3 font-bold text-slate-900">{formatUsd(stats.revenueCents)}</td>
                </tr>
              ))}

              {leaderboard.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-slate-600" colSpan={5}>
                    No approved affiliates yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Data source</h3>
        <p className="mt-2 text-sm text-slate-700">
          This page uses existing affiliate functions (<span className="font-mono">listAffiliateApplications</span>,
          <span className="font-mono"> listAffiliateStats</span>) backed by Postgres when configured, or file storage
          fallback in local/dev.
        </p>
      </div>
    </div>
  );
}
