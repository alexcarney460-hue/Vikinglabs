import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordPageView } from '@/lib/traffic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = (body?.path || '').toString().slice(0, 512);
    const referrer = (body?.referrer || '').toString().slice(0, 512) || null;
    const userAgent = req.headers.get('user-agent');

    if (!path) return NextResponse.json({ ok: false }, { status: 400 });

    await recordPageView({
      id: crypto.randomUUID(),
      path,
      referrer,
      userAgent,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Page view record failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
