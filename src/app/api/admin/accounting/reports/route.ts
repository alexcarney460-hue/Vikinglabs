import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getAccountingReports } from '@/lib/admin/accounting';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get('from') ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const to = sp.get('to') ?? new Date().toISOString().slice(0, 10);
    const granularity = (sp.get('granularity') ?? 'day') as 'day' | 'week' | 'month';
    const result = await getAccountingReports(from, to, granularity);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
