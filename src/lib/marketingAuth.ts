import { NextRequest, NextResponse } from 'next/server';

export function assertMarketingEnabled(): void {
  if (process.env.MARKETING_API_ENABLED !== 'true') {
    throw new Error('Marketing API is not enabled');
  }
}

export function assertMarketingKey(req: NextRequest): void {
  const key = req.headers.get('x-marketing-key');
  const expected = process.env.MARKETING_KEY;

  if (!key || !expected || key !== expected) {
    throw new Error('Invalid or missing marketing API key');
  }
}

export function respondUnauthorized(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized: Invalid marketing API key' },
    { status: 401 }
  );
}

export function respondBadRequest(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

export function respondError(message: string, status = 500): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}
