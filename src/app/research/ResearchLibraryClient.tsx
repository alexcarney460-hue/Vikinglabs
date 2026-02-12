'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { researchItems } from '@/lib/research/items';
import { useSearchParams } from 'next/navigation';

function safeKey(email: string, suffix: string) {
  return `vl_${suffix}_${email.toLowerCase().trim()}`;
}

function loadSaved(email: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(safeKey(email, 'research_saved'));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { ids?: string[] };
    return Array.isArray(parsed.ids) ? parsed.ids : [];
  } catch {
    return [];
  }
}

function storeSaved(email: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(safeKey(email, 'research_saved'), JSON.stringify({ ids }));
}

export default function ResearchLibraryClient() {
  const { data: session } = useSession();
  const user = session?.user as any | undefined;
  const email = (user?.email as string | undefined) || '';

  const params = useSearchParams();
  const defaultSavedOnly = params.get('saved') === '1';

  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(defaultSavedOnly);
  const [savedIds, setSavedIds] = useState<string[]>(() => (email ? loadSaved(email) : []));

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return researchItems.filter((it) => {
      if (savedOnly && !savedIds.includes(it.id)) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.summary.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, savedOnly, savedIds]);

  function toggleSave(id: string) {
    if (!email) return;
    const next = savedIds.includes(id) ? savedIds.filter((x) => x !== id) : [...savedIds, id];
    setSavedIds(next);
    storeSaved(email, next);
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Research Library</h1>
          <p className="mt-2 text-slate-600">Public references + product research notes. Save items for quick access.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/catalog"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
          >
            Catalog
          </Link>
          <Link
            href="/account"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
          >
            Account
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Search: COA, HPLC, Semaglutide, storage…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
          <label className="flex items-center justify-between gap-3">
            <span className="font-bold text-slate-900">Saved only</span>
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
            />
          </label>
          <div className="mt-2 text-xs text-slate-500">
            {email ? 'Saved items are stored in this browser (MVP).' : 'Sign in to save items.'}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {items.map((it) => {
          const isSaved = savedIds.includes(it.id);
          return (
            <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{it.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{it.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {it.tags.map((t) => (
                      <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {t}
                      </span>
                    ))}
                    {it.productSlug && (
                      <Link
                        href={`/catalog/${it.productSlug}`}
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 hover:bg-amber-200"
                      >
                        View product
                      </Link>
                    )}
                    <Link
                      href={`/research/${it.id}`}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-200"
                    >
                      Open doc
                    </Link>
                  </div>
                </div>

                <button
                  disabled={!email}
                  onClick={() => toggleSave(it.id)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wide ${
                    !email
                      ? 'bg-slate-100 text-slate-400'
                      : isSaved
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
            No research items match that search.
          </div>
        )}
      </div>
    </div>
  );
}
