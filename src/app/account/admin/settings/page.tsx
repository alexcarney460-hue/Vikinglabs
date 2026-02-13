export default function AdminSettingsPage() {
  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Admin Settings</h2>
        <p className="mt-2 text-slate-600">Manage admin users, roles, and access policies.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">MVP placeholder</h3>
        <p className="mt-2 text-sm text-slate-700">
          This route exists so the admin nav is fully functional in production. Next step: admin user
          management UI.
        </p>
      </div>
    </div>
  );
}
