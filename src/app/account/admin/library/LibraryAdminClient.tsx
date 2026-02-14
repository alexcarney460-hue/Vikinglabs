'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type LibraryArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  publicUrl?: string | null;
  productSlug?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialArticles: LibraryArticle[];
};

export default function LibraryAdminClient({ initialArticles }: Props) {
  const [articles, setArticles] = useState<LibraryArticle[]>(initialArticles);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [productSlug, setProductSlug] = useState('');

  const sorted = useMemo(() => {
    return [...articles].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [articles]);

  async function refresh() {
    const res = await fetch('/api/admin/library', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok && data.ok) setArticles(data.articles);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError('');

    try {
      const res = await fetch('/api/admin/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          summary,
          tags,
          publicUrl,
          productSlug,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Create failed');

      setTitle('');
      setSlug('');
      setSummary('');
      setTags('');
      setPublicUrl('');
      setProductSlug('');

      await refresh();
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to create article');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this article?')) return;
    setStatus('saving');
    setError('');

    try {
      const res = await fetch(`/api/admin/library/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Delete failed');
      await refresh();
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to delete article');
    }
  }

  return (
    <div className="grid gap-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Create article</h3>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-slate-700">Title</span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-slate-700">Slug (optional)</span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. semaglutide-coa-2026"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-bold text-slate-700">Summary</span>
            <textarea
              className="min-h-[100px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-slate-700">Tags (comma-separated)</span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="COA, HPLC, Storage"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-slate-700">Public URL (optional)</span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={publicUrl}
                onChange={(e) => setPublicUrl(e.target.value)}
                placeholder="/research/file.pdf"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-slate-700">Product slug (optional)</span>
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={productSlug}
                onChange={(e) => setProductSlug(e.target.value)}
                placeholder="semaglutide"
              />
            </label>
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">Articles publish immediately in /research.</div>
            <button
              disabled={status === 'saving'}
              className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {status === 'saving' ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Articles</h3>
          <Link href="/research" className="text-sm font-bold text-amber-700 hover:text-amber-800">
            Open public library →
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {sorted.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-black text-slate-900">{a.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{a.summary}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">/{a.slug}</span>
                    {a.productSlug && (
                      <Link
                        href={`/catalog/${a.productSlug}`}
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800"
                      >
                        Product: {a.productSlug}
                      </Link>
                    )}
                    {a.tags.map((t) => (
                      <span key={t} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <Link href={`/research/${a.slug}`} className="font-bold text-slate-700 hover:text-amber-700">
                      View page
                    </Link>
                    {a.publicUrl && (
                      <a href={a.publicUrl} target="_blank" rel="noreferrer" className="font-bold text-slate-700 hover:text-amber-700">
                        Open doc
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={status === 'saving'}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black uppercase tracking-wide text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {sorted.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No admin articles yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
