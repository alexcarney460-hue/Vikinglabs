import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordPageView } from '@/lib/traffic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '';
    const ref = req.headers.get('referer');
    const userAgent = req.headers.get('user-agent');

    console.log('[Pixel] Request received:', { path, referer: ref, userAgent: userAgent?.slice(0, 50) });

    if (path) {
      console.log('[Pixel] Recording page view for path:', path);
      await recordPageView({
        id: crypto.randomUUID(),
        path: path.slice(0, 512),
        referrer: ref?.slice(0, 512) ?? null,
        userAgent,
        createdAt: new Date().toISOString(),
      });
      console.log('[Pixel] Page view recorded successfully');
    } else {
      console.warn('[Pixel] No path provided');
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[Pixel] Traffic pixel failed', error);
    return new NextResponse(null, { status: 204 });
  }
}
