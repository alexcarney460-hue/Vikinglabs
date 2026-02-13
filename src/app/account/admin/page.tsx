import Link from 'next/link';

export default function AdminPage() {
  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Admin profile</h2>
        <p className="mt-2 text-slate-600">
          Backend + analytics (MVP scaffold). Use the nav above to jump between admin areas.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Library Admin</h3>
          <p className="mt-2 text-sm text-slate-600">Create/edit research items, upload PDFs/COAs, publish.</p>
          <div className="mt-5">
            <Link
              href="/account/admin/library"
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Open Library Admin →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Affiliate Applications</h3>
          <p className="mt-2 text-sm text-slate-600">Review pending affiliate requests and approve or decline.</p>
          <div className="mt-5">
            <Link
              href="/account/admin/affiliates"
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Open affiliate queue →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Analytics</h3>
          <p className="mt-2 text-sm text-slate-600">Views/downloads by item, product-level engagement, invite redemption.</p>
          <div className="mt-5">
            <Link
              href="/account/admin/analytics"
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Open analytics →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Admin settings</h3>
          <p className="mt-2 text-sm text-slate-600">Manage admin users, roles, and access policies.</p>
          <div className="mt-5">
            <Link
              href="/account/admin/settings"
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Open settings →
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Implementation notes</h3>
        <ul className="mt-4 list-disc pl-5 space-y-2 text-sm text-slate-700">
          <li>Default library visibility: <span className="font-semibold">Public</span></li>
          <li>Saved items: <span className="font-semibold">Private per user</span></li>
          <li>Auth: all <span className="font-semibold">/account/admin</span> routes are guarded by role</li>
        </ul>
      </div>
    </div>
  );
}
