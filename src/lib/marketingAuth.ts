import { NextRequest, NextResponse } from 'next/server';

export function assertMarketingEnabled(): void {
  // Marketing API enabled by default when key is present
  // Can be explicitly disabled with env var set to 'false'
  if (process.env.MARKETING_API_ENABLED === 'false') {
    throw new Error('Marketing API is not enabled');
  }
}

export function assertMarketingKey(req: NextRequest): void {
  // Try multiple header formats for compatibility
  let key = req.headers.get('x-marketing-key') || 
            req.headers.get('MARKETING_KEY') || 
            req.headers.get('marketing-key');
  
  const expected = process.env.MARKETING_KEY;

  if (!key || !expected) {
    console.error('[AUTH] Missing key. Received:', key ? 'key present' : 'no key', 'Expected:', expected ? 'set' : 'not set');
    throw new Error('Invalid or missing marketing API key');
  }
  
  if (key !== expected) {
    console.error('[AUTH] Key mismatch. Received:', key.slice(0, 10) + '...', 'Expected:', expected.slice(0, 10) + '...');
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
