import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { exportAffiliatePayoutsCsv } from '@/lib/affiliates';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (!user || (user.role ?? 'user') !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start') || undefined;
  const end = searchParams.get('end') || undefined;

  const rows = await exportAffiliatePayoutsCsv({ start, end });

  const header = ['affiliate_id', 'name', 'email', 'code', 'order_count', 'revenue_usd'];
  const lines = [header.join(',')];

  rows.forEach((row) => {
    const revenueUsd = (row.revenueCents / 100).toFixed(2);
    lines.push(
      [
        row.affiliateId,
        row.name,
        row.email,
        row.code || '',
        row.orderCount.toString(),
        revenueUsd,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );
  });

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="affiliate-payouts.csv"',
    },
  });
}
