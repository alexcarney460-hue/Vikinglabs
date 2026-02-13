export default function LibraryAdminPage() {
  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Library Admin</h2>
        <p className="mt-2 text-slate-600">Create/edit research items, upload PDFs/COAs, and publish.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">MVP placeholder</h3>
        <p className="mt-2 text-sm text-slate-700">
          This route exists so the admin nav is fully functional in production. Next step: implement the
          upload + publish workflow.
        </p>
      </div>
    </div>
  );
}
