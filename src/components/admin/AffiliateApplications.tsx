'use client';

import { useMemo, useState } from 'react';
import type { AffiliateApplication, AffiliateStatus } from '@/lib/affiliates';

const statusStyles: Record<AffiliateStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
  needs_info: 'bg-slate-100 text-slate-700',
};

type AffiliateApplicationWithStats = AffiliateApplication & {
  stats?: {
    clicks: number;
    orders: number;
    revenueCents: number;
  };
};

export default function AffiliateApplications({ initialApplications }: { initialApplications: AffiliateApplicationWithStats[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoInvite, setAutoInvite] = useState(true);

  const [drafts, setDrafts] = useState(() => {
    const map: Record<string, { signupCredit: string; discordUserId: string }> = {};
    initialApplications.forEach((app) => {
      map[app.id] = {
        signupCredit: (app.signupCreditCents / 100).toFixed(2),
        discordUserId: app.discordUserId || '',
      };
    });
    return map;
  });

  const updateDraft = (id: string, field: 'signupCredit' | 'discordUserId', value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        signupCredit: prev[id]?.signupCredit ?? '0.00',
        discordUserId: prev[id]?.discordUserId ?? '',
        [field]: value,
      },
    }));
  };

  const parseSignupCredit = (id: string) => {
    const raw = drafts[id]?.signupCredit ?? '0';
    const numeric = Number.parseFloat(raw);
    if (Number.isNaN(numeric)) return 0;
    return Math.max(0, Math.round(numeric * 100));
  };

  const updateStatus = async (id: string, status: AffiliateStatus) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          signupCreditCents: parseSignupCredit(id),
          discordUserId: drafts[id]?.discordUserId || null,
          autoInvite,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Unable to update application.');
      }

      const payload = await res.json();
      const updated = payload.application as AffiliateApplicationWithStats | undefined;
      setApplications((prev) => prev.map((app) => (app.id === id && updated ? { ...app, ...updated } : app)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update application.';
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const saveDetails = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signupCreditCents: parseSignupCredit(id),
          discordUserId: drafts[id]?.discordUserId || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Unable to update application.');
      }

      const payload = await res.json();
      const updated = payload.application as AffiliateApplicationWithStats | undefined;
      setApplications((prev) => prev.map((app) => (app.id === id && updated ? { ...app, ...updated } : app)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update application.';
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  const statsSummary = useMemo(() => {
    return applications.reduce(
      (acc, app) => {
        acc.clicks += app.stats?.clicks ?? 0;
        acc.orders += app.stats?.orders ?? 0;
        acc.revenueCents += app.stats?.revenueCents ?? 0;
        return acc;
      },
      { clicks: 0, orders: 0, revenueCents: 0 }
    );
  }, [applications]);

  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        No applications yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Affiliate analytics</p>
            <p className="text-xs text-slate-500">Totals across listed applications</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
            <span><strong>{statsSummary.clicks}</strong> clicks</span>
            <span><strong>{statsSummary.orders}</strong> orders</span>
            <span><strong>${(statsSummary.revenueCents / 100).toFixed(2)}</strong> revenue</span>
            <a
              href="/api/affiliates/payouts"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
            >
              Export CSV
            </a>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <input
            type="checkbox"
            checked={autoInvite}
            onChange={(event) => setAutoInvite(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
          />
          Auto-invite approved affiliates in Discord
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {applications.map((app) => (
        <div key={app.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">{app.name}</p>
              <p className="text-sm text-slate-600">{app.email}</p>
              <p className="text-xs text-slate-400 mt-1">Submitted {new Date(app.createdAt).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[app.status]}`}>
              {app.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-400">Handle</p>
              <p>{app.socialHandle || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Audience</p>
              <p>{app.audienceSize || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Channels</p>
              <p>{app.channels || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Notes</p>
              <p>{app.notes || '—'}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Clicks</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{app.stats?.clicks ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Orders</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{app.stats?.orders ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Revenue</p>
              <p className="mt-1 text-lg font-bold text-slate-900">${((app.stats?.revenueCents ?? 0) / 100).toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase text-slate-400">Signup credit ($)</label>
              <input
                type="text"
                value={drafts[app.id]?.signupCredit ?? '0.00'}
                onChange={(event) => updateDraft(app.id, 'signupCredit', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-slate-400">Discord User ID</label>
              <input
                type="text"
                value={drafts[app.id]?.discordUserId ?? ''}
                onChange={(event) => updateDraft(app.id, 'discordUserId', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {app.code && (
            <p className="mt-4 text-sm text-slate-700">
              Affiliate code: <span className="font-semibold text-slate-900">{app.code}</span>
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => updateStatus(app.id, 'approved')}
              disabled={busyId === app.id}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => updateStatus(app.id, 'needs_info')}
              disabled={busyId === app.id}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              Request Info
            </button>
            <button
              type="button"
              onClick={() => updateStatus(app.id, 'declined')}
              disabled={busyId === app.id}
              className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => saveDetails(app.id)}
              disabled={busyId === app.id}
              className="rounded-full border border-amber-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              Save Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
