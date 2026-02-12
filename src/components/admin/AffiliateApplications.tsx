'use client';

import { useState } from 'react';
import type { AffiliateApplication, AffiliateStatus } from '@/lib/affiliates';

const statusStyles: Record<AffiliateStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
};

export default function AffiliateApplications({ initialApplications }: { initialApplications: AffiliateApplication[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (id: string, status: AffiliateStatus) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/affiliates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Unable to update application.');
      }

      setApplications((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update application.';
      setError(message);
    } finally {
      setBusyId(null);
    }
  };

  if (!applications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        No pending applications.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
              {app.status.toUpperCase()}
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
              onClick={() => updateStatus(app.id, 'declined')}
              disabled={busyId === app.id}
              className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
