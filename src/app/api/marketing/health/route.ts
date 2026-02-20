import { NextResponse } from 'next/server';
import { validateMCAuth } from '@/lib/mcAuth';

export async function GET(req: Request) {
  const headersObj = Object.fromEntries(req.headers.entries()) as Record<string,string|undefined>;
  const auth = validateMCAuth(headersObj);
  if (!auth.ok) return NextResponse.json(auth.json, { status: auth.code });

  const env = (process.env.VERCEL_ENV === 'production') ? 'prod' : 'dev';
  return NextResponse.json({ ok: true, time: new Date().toISOString(), env }, { status: 200 });
}
