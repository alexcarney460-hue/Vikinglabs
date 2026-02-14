import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getCustomerMetrics } from '@/lib/admin/accounting';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '100');
    const result = await getCustomerMetrics(limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
