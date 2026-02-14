import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResearchItem } from '@/lib/research';

export default async function ResearchDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getResearchItem(id);
  if (!item) return notFound();

  return (
    <div className="container mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/research" className="text-sm font-bold text-slate-600 hover:text-amber-600">
          ← Back to Research Library
        </Link>
        {item.productSlug && (
          <Link
            href={`/catalog/${item.productSlug}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
          >
            View product
          </Link>
        )}
      </div>

      <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900">{item.title}</h1>
      <p className="mt-4 text-base text-slate-700 leading-relaxed">{item.summary}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {item.tags.map((t) => (
          <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {t}
          </span>
        ))}
      </div>

      {item.publicUrl ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-sm font-black text-slate-900">Source document</div>
          <div className="mt-2 text-sm text-slate-600">This item links to a PDF stored on our site.</div>
          <a
            href={item.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900 hover:bg-emerald-200"
          >
            Open PDF
          </a>
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No external document is attached to this entry yet.
        </div>
      )}
    </div>
  );
}
