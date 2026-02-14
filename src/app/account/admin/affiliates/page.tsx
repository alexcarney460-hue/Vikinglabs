import { listAffiliateApplications, listAffiliateStats } from '@/lib/affiliates';
import AffiliateApplications from '@/components/admin/AffiliateApplications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AffiliateAdminPage() {
  const applications = await listAffiliateApplications();
  const stats = await listAffiliateStats(applications.map((app) => app.id));
  const enriched = applications.map((app) => ({
    ...app,
    stats: stats[app.id],
  }));

  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Affiliate Applications</h2>
        <p className="mt-2 text-slate-600">Review affiliate requests, manage approvals, and monitor performance.</p>
      </div>

      <div className="mt-8">
        <AffiliateApplications initialApplications={enriched} />
      </div>
    </div>
  );
}
