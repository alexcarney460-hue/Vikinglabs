'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

type Profile = {
  displayName?: string;
  company?: string;
  phone?: string;
  shippingAddress?: string;
  notes?: string;
};

type ResearchSaved = {
  ids: string[];
};

function safeKey(email: string, suffix: string) {
  return `vl_${suffix}_${email.toLowerCase().trim()}`;
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

export default function AccountClient() {
  const { data: session, status } = useSession();
  const user = session?.user as any | undefined;

  const email = (user?.email as string | undefined) || '';
  const role = (user?.role as string | undefined) || 'user';

  const profileKey = useMemo(() => (email ? safeKey(email, 'profile') : ''), [email]);
  const savedKey = useMemo(() => (email ? safeKey(email, 'research_saved') : ''), [email]);

  const [profile, setProfile] = useState<Profile>({});
  const [saved, setSaved] = useState<ResearchSaved>({ ids: [] });
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!email) return;
    setProfile(loadJson<Profile>(profileKey, {}));
    setSaved(loadJson<ResearchSaved>(savedKey, { ids: [] }));
  }, [email, profileKey, savedKey]);

  function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    saveJson(profileKey, profile);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1200);
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Your account</h1>
        <p className="mt-2 text-slate-600">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Your account</h1>
        <p className="mt-2 text-slate-600">Please sign in to view your profile and Research Library.</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/account/login"
            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-amber-600"
          >
            Sign in
          </Link>
          <Link
            href="/account/register"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-700 hover:border-slate-300"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-2 text-slate-600">Profile & Research Library (saved items are private to this browser for now).</p>
        </div>
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <Link
              href="/account/admin"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
            >
              Admin
            </Link>
          )}
          <Link
            href="/api/auth/signout"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
          >
            Sign out
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Profile</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              <span className="font-semibold">Email:</span> {email || '(no email)'}
            </div>
            <div>
              <span className="font-semibold">Role:</span> {role}
            </div>
          </div>

          <form onSubmit={onSaveProfile} className="mt-6 space-y-3">
            <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Display name</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
              value={profile.displayName || ''}
              onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Dr. Erik…"
            />

            <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Company / Lab</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
              value={profile.company || ''}
              onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
              placeholder="Viking Bioanalytics"
            />

            <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Phone</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
              value={profile.phone || ''}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              placeholder="(555) 555-5555"
            />

            <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Shipping address</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
              rows={3}
              value={profile.shippingAddress || ''}
              onChange={(e) => setProfile((p) => ({ ...p, shippingAddress: e.target.value }))}
              placeholder="Street\nCity, State ZIP\nCountry"
            />

            <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Notes</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
              rows={3}
              value={profile.notes || ''}
              onChange={(e) => setProfile((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Preferred carrier, delivery instructions, etc."
            />

            <button className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-amber-600">
              Save profile
            </button>
            {justSaved && <div className="text-xs font-bold text-emerald-700">Saved.</div>}
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Research Library</h2>
              <p className="mt-2 text-slate-600">
                Browse public research notes and save items for quick access.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">MVP</span>
              <Link
                href="/research"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
              >
                Open library
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-bold text-slate-900">Saved items</div>
            <p className="mt-1 text-sm text-slate-600">You have {saved.ids.length} saved item{saved.ids.length === 1 ? '' : 's'}.</p>
            <div className="mt-4">
              <Link href="/research?saved=1" className="text-sm font-bold text-amber-700 hover:underline">
                View saved →
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            Next steps (when you want persistence across devices):
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>Move profile + saved library to a real DB (Vercel Postgres or KV)</li>
              <li>Admin upload + publish workflow for PDFs/COAs</li>
              <li>Per-item analytics: views/downloads</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
