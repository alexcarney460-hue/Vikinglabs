import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getAccountingOrders } from '@/lib/admin/accounting';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const sp = req.nextUrl.searchParams;
    const result = await getAccountingOrders({
      page: parseInt(sp.get('page') ?? '1'),
      limit: parseInt(sp.get('limit') ?? '50'),
      paymentMethod: sp.get('paymentMethod') ?? undefined,
      dateRange: sp.get('from') && sp.get('to') ? { from: sp.get('from')!, to: sp.get('to')! } : undefined,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
