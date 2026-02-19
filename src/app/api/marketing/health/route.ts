import { NextResponse } from 'next/server';

export async function GET() {
  const enabled = process.env.MARKETING_API_ENABLED === 'true';
  const keySet = !!process.env.MARKETING_KEY;

  return NextResponse.json({
    status: 'ok',
    marketing_api_enabled: enabled,
    marketing_key_set: keySet,
    timestamp: new Date().toISOString(),
  });
}
