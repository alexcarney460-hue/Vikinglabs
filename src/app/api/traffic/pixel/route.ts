import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordPageView } from '@/lib/traffic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '';
    const ref = req.headers.get('referer');
    const userAgent = req.headers.get('user-agent');

    if (path) {
      await recordPageView({
        id: crypto.randomUUID(),
        path: path.slice(0, 512),
        referrer: ref?.slice(0, 512) ?? null,
        userAgent,
        createdAt: new Date().toISOString(),
      });
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Traffic pixel failed', error);
    return new NextResponse(null, { status: 204 });
  }
}
