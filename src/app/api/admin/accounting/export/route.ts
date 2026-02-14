import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { exportAccountingData } from '@/lib/admin/accounting';

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const body = await req.json();
    const { from, to, format } = body;
    if (!from || !to) return NextResponse.json({ ok: false, error: 'from and to required' }, { status: 400 });

    const result = await exportAccountingData(from, to, format === 'pdf' ? 'pdf' : 'csv');

    if (result.contentType === 'text/csv') {
      return new NextResponse(result.data, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${result.filename}"`,
        },
      });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
