import { listLibraryArticles } from '@/lib/library';
import LibraryAdminClient from './LibraryAdminClient';

export default async function LibraryAdminPage() {
  const articles = await listLibraryArticles();

  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Library Admin</h2>
        <p className="mt-2 text-slate-600">Create research library articles (public), attach PDFs, and manage entries.</p>
      </div>

      <div className="mt-8">
        <LibraryAdminClient initialArticles={articles} />
      </div>
    </div>
  );
}
