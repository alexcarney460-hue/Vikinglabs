import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { listAffiliateApplications } from '@/lib/affiliates';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (!user || (user.role ?? 'user') !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await listAffiliateApplications('pending');
  return NextResponse.json({ applications });
}
