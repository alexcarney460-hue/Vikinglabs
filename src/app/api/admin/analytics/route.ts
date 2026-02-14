import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getAdminAnalytics } from '@/lib/admin/analytics';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const windowDays = parseInt(req.nextUrl.searchParams.get('windowDays') ?? '30', 10);
    if (windowDays < 1 || windowDays > 365) {
      return NextResponse.json(
        { ok: false, error: 'windowDays must be between 1 and 365' },
        { status: 400 }
      );
    }

    const analytics = await getAdminAnalytics(windowDays);
    return NextResponse.json({ ok: true, analytics });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch analytics';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
