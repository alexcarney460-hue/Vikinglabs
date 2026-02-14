'use client';

import { useEffect, useState } from 'react';
import type { AdminAnalytics } from '@/lib/admin/analytics';

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function SimpleLineChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No data available.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const barWidth = Math.max(8, 100 / data.length);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${Math.max(400, data.length * 20)} ${chartHeight + 50}`}
        className="w-full h-auto"
        style={{ minHeight: '300px' }}
      >
        {/* Y-axis line */}
        <line x1="40" y1="20" x2="40" y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />

        {/* X-axis line */}
        <line x1="40" y1={chartHeight} x2={40 + data.length * 20} y2={chartHeight} stroke="#e2e8f0" strokeWidth="1" />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent) => {
          const value = Math.round(maxCount * percent);
          const y = chartHeight - percent * (chartHeight - 40);
          return (
            <g key={percent}>
              <line x1="35" y1={y} x2="40" y2={y} stroke="#cbd5e1" strokeWidth="1" />
              <text x="30" y={y + 4} fontSize="11" fill="#64748b" textAnchor="end">
                {value}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.count / maxCount) * (chartHeight - 40);
          const x = 40 + i * 20 + 5;
          const y = chartHeight - barHeight;
          const showLabel = i % Math.ceil(data.length / 8) === 0;

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width="10"
                height={barHeight}
                fill="#f59e0b"
                rx="2"
              />
              {showLabel && (
                <text
                  x={x + 5}
                  y={chartHeight + 20}
                  fontSize="11"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function AnalyticsClient() {
  const [windowDays, setWindowDays] = useState(30);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/analytics?windowDays=${windowDays}`);
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = await res.json();
        if (data.ok) {
          setAnalytics(data.analytics);
        } else {
          throw new Error(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [windowDays]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="text-sm font-bold text-red-900">Error loading analytics</div>
        <div className="mt-1 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <p className="mt-2 text-sm text-slate-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Analytics</h2>
          <p className="mt-2 text-slate-600">Traffic (affiliate clicks) + transactions (Stripe/Coinbase) + revenue.</p>
        </div>

        <div className="flex gap-2">
          {[7, 14, 21, 30].map((days) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                windowDays === days
                  ? 'bg-amber-500 text-white'
                  : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Traffic (daily)</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{analytics.traffic.day}</div>
          <div className="mt-1 text-sm text-slate-600">Page views in the last 24 hours.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Traffic (weekly)</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{analytics.traffic.week}</div>
          <div className="mt-1 text-sm text-slate-600">Page views in the last 7 days.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Traffic (monthly)</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{analytics.traffic.month}</div>
          <div className="mt-1 text-sm text-slate-600">Page views in the last 30 days.</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Orders (last {analytics.windowDays}d)</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{analytics.orders.count}</div>
          <div className="mt-1 text-sm text-slate-600">Recorded checkout sessions / crypto charges created.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Revenue (last {analytics.windowDays}d)</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{money(analytics.orders.revenueCents)}</div>
          <div className="mt-1 text-sm text-slate-600">Gross amount captured at checkout creation time.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Affiliate clicks (last {analytics.windowDays}d)</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{analytics.affiliates.clicks}</div>
          <div className="mt-1 text-sm text-slate-600">
            Affiliate orders: {analytics.affiliates.orders} · Affiliate revenue: {money(analytics.affiliates.revenueCents)}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Traffic trend (last {analytics.windowDays} days)</h3>
          <div className="text-xs text-slate-500">Daily page views</div>
        </div>
        <div className="mt-4">
          <SimpleLineChart data={analytics.traffic.daily} />
        </div>
        {analytics.traffic.daily.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 mt-4">
            No traffic yet.
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Provider breakdown</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.entries(analytics.orders.byProvider).map(([provider, stats]) => (
            <div key={provider} className="rounded-xl border border-slate-200 p-4">
              <div className="text-sm font-black text-slate-900">{provider}</div>
              <div className="mt-1 text-sm text-slate-600">
                {stats.count} orders · {money(stats.revenueCents)}
              </div>
            </div>
          ))}
          {Object.keys(analytics.orders.byProvider).length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No orders recorded in the last {analytics.windowDays} days.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Recent orders</h3>
        <div className="mt-4 grid gap-2">
          {analytics.orders.recent.slice(0, 20).map((o) => (
            <div
              key={o.id}
              className="flex flex-col gap-1 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-sm font-black text-slate-900">{o.provider.toUpperCase()} · {money(o.amountCents)}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {o.providerOrderId} · {o.email} · {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-600">{o.autoship ? 'AUTOSHIP' : 'ONE-TIME'}</div>
            </div>
          ))}
          {analytics.orders.recent.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No recent orders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
