export default function AdminAnalyticsPage() {
  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Analytics</h2>
        <p className="mt-2 text-slate-600">Views/downloads by item, product-level engagement, invite redemption.</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">MVP placeholder</h3>
        <p className="mt-2 text-sm text-slate-700">
          Dashboard wiring comes next. Recommended: lightweight event log + aggregated rollups.
        </p>
      </div>
    </div>
  );
}
