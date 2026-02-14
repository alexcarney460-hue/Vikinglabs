import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { getAccountingSummary } from '@/lib/admin/accounting';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const summary = await getAccountingSummary();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
