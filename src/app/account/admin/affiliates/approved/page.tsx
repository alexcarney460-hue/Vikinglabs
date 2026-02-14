import { requireAdmin } from '@/lib/admin/requireAdmin';
import { listAffiliateApplications, listAffiliateStats } from '@/lib/affiliates';
import ApprovedAffiliatesClient from './ApprovedAffiliatesClient';

export default async function ApprovedAffiliatesPage() {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-600">Unauthorized</p>
          <p className="mt-1 text-xs text-slate-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  const approved = await listAffiliateApplications('approved');
  const ids = approved.map((app) => app.id);
  const statsMap = await listAffiliateStats(ids);

  const applicationsWithStats = approved.map((app) => ({
    ...app,
    stats: statsMap[app.id] || { affiliateId: app.id, clicks: 0, orders: 0, revenueCents: 0 },
  }));

  return <ApprovedAffiliatesClient initialApplications={applicationsWithStats} />;
}
