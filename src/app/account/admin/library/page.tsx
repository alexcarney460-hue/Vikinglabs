import Link from 'next/link';
import { researchItems } from '@/lib/research/items';

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export default function LibraryAdminPage() {
  const total = researchItems.length;
  const pdfCount = researchItems.filter((i) => Boolean(i.publicUrl)).length;
  const productLinked = researchItems.filter((i) => Boolean(i.productSlug)).length;

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Library Admin</h2>
          <p className="mt-2 text-slate-600">Manage the Research Library index (currently file-backed).</p>
        </div>
        <Link
          href="/research"
          className="text-sm font-bold text-amber-700 hover:text-amber-800"
        >
          View public Research Library →
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Entries</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{total}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">With PDFs</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{pdfCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Linked to products</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{productLinked}</div>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-black uppercase tracking-wide text-slate-900">Research items</div>
          <div className="mt-1 text-sm text-slate-600">{plural(total, 'item')} in the index.</div>
        </div>

        <ul className="divide-y divide-slate-100">
          {researchItems.map((item) => (
            <li key={item.id} className="px-6 py-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.summary}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/research/${item.id}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
                  >
                    View page
                  </Link>
                  {item.publicUrl ? (
                    <a
                      href={item.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900 hover:bg-emerald-200"
                    >
                      Open PDF
                    </a>
                  ) : null}
                  {item.productSlug ? (
                    <Link
                      href={`/catalog/${item.productSlug}`}
                      className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-black text-amber-900 hover:bg-amber-200"
                    >
                      Product
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Where this data comes from</h3>
        <p className="mt-2 text-sm text-slate-700">
          Entries are currently defined in <span className="font-mono">src/lib/research/items.ts</span>.
          This page is intentionally read-only until the upload/publish workflow is implemented.
        </p>
      </div>
    </div>
  );
}
