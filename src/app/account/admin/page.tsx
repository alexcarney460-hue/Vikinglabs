import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin</h1>
        <p className="mt-2 text-slate-600">Please sign in.</p>
        <div className="mt-6">
          <Link href="/account/login" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-amber-600">Sign in</Link>
        </div>
      </div>
    );
  }

  if ((user?.role ?? 'user') !== 'admin') {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin</h1>
        <p className="mt-2 text-slate-600">You don’t have access to this page.</p>
        <div className="mt-6">
          <Link href="/account" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-700">Back to account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin profile</h1>
          <p className="mt-2 text-slate-600">Backend + analytics (MVP scaffold). Same site login button routes admins here.</p>
        </div>
        <Link href="/account" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300">Back to account</Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Library Admin</h2>
          <p className="mt-2 text-sm text-slate-600">Create/edit research items, upload PDFs/COAs, publish.</p>
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Next: admin upload UI + publish workflow.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Affiliate Applications</h2>
          <p className="mt-2 text-sm text-slate-600">Review pending affiliate requests and approve or decline.</p>
          <div className="mt-5">
            <Link href="/account/admin/affiliates" className="text-sm font-semibold text-amber-600 hover:text-amber-700">Open affiliate queue →</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Analytics</h2>
          <p className="mt-2 text-sm text-slate-600">Views/downloads by item, product-level engagement, invite redemption.</p>
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Next: lightweight event log + dashboard.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Admin settings</h2>
          <p className="mt-2 text-sm text-slate-600">Manage admin users, roles, and access policies.</p>
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Next: admin user management UI.
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Implementation notes</h2>
        <ul className="mt-4 list-disc pl-5 space-y-2 text-sm text-slate-700">
          <li>Default library visibility: <span className="font-semibold">Public</span></li>
          <li>Saved items: <span className="font-semibold">Private per user</span></li>
          <li>Auth: same login button → routes admins to this page based on role</li>
        </ul>
      </div>
    </div>
  );
}
