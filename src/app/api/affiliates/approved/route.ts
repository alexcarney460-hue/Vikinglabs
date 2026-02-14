import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { listAffiliateApplications, listAffiliateStats } from '@/lib/affiliates';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const approved = await listAffiliateApplications('approved');
    const ids = approved.map((app) => app.id);
    const statsMap = await listAffiliateStats(ids);

    const applicationsWithStats = approved.map((app) => ({
      ...app,
      stats: statsMap[app.id] || { affiliateId: app.id, clicks: 0, orders: 0, revenueCents: 0 },
    }));

    return NextResponse.json({ ok: true, applications: applicationsWithStats });
  } catch (error) {
    console.error('Failed to fetch approved affiliates:', error);
    return NextResponse.json({ ok: false, error: 'Unable to fetch approved affiliates' }, { status: 500 });
  }
}
