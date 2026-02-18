import { NextRequest, NextResponse } from 'next/server';
import { assertMarketingEnabled, assertMarketingKey, respondUnauthorized, respondBadRequest, respondError } from '@/lib/marketingAuth';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const VALID_PLATFORMS = ['tiktok', 'instagram'];
const VALID_STATUSES = ['draft', 'approved', 'posted', 'killed'];

interface ContentPayload {
  platform: string;
  format: string;
  topic: string;
  hook: string;
  script: string[];
  caption: string;
  hashtags: string[];
  cta: string;
  compliance: {
    risk_score: number;
    flags: string[];
    notes: string;
  };
}

function validateContentPayload(body: unknown): body is ContentPayload {
  if (!body || typeof body !== 'object') return false;

  const obj = body as Record<string, unknown>;

  return (
    typeof obj.platform === 'string' &&
    VALID_PLATFORMS.includes(obj.platform) &&
    typeof obj.format === 'string' &&
    typeof obj.topic === 'string' &&
    typeof obj.hook === 'string' &&
    Array.isArray(obj.script) &&
    obj.script.every((s: unknown) => typeof s === 'string') &&
    typeof obj.caption === 'string' &&
    Array.isArray(obj.hashtags) &&
    obj.hashtags.every((h: unknown) => typeof h === 'string') &&
    typeof obj.cta === 'string' &&
    obj.compliance &&
    typeof obj.compliance === 'object' &&
    typeof (obj.compliance as Record<string, unknown>).risk_score === 'number' &&
    Array.isArray((obj.compliance as Record<string, unknown>).flags) &&
    typeof (obj.compliance as Record<string, unknown>).notes === 'string'
  );
}

export async function GET(req: NextRequest) {
  try {
    assertMarketingEnabled();
    assertMarketingKey(req);

    const status = req.nextUrl.searchParams.get('status');
    let query = getSupabaseServer()
      .from('marketing_content_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return respondBadRequest(`Invalid status: ${status}`);
      }
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return respondError(`Failed to fetch content: ${error.message}`);
    }

    return NextResponse.json({ content: data || [] });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return respondUnauthorized();
    }
    if (err instanceof Error && err.message === 'Marketing API is not enabled') {
      return respondError('Marketing API is not enabled', 403);
    }
    return respondError((err instanceof Error ? err.message : 'Unknown error') || 'Failed to fetch content');
  }
}

export async function POST(req: NextRequest) {
  try {
    assertMarketingEnabled();
    assertMarketingKey(req);

    const body = await req.json();

    if (!validateContentPayload(body)) {
      return respondBadRequest(
        'Invalid payload. Required fields: platform (tiktok|instagram), format, topic, hook, script (array), caption, hashtags (array), cta, compliance (object with risk_score, flags, notes)'
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('marketing_content_queue')
      .insert({
        platform: body.platform,
        format: body.format,
        topic: body.topic,
        hook: body.hook,
        script: body.script,
        caption: body.caption,
        hashtags: body.hashtags,
        cta: body.cta,
        compliance: body.compliance,
        status: 'draft',
      })
      .select();

    if (error) {
      return respondError(`Failed to insert content: ${error.message}`);
    }

    return NextResponse.json({ id: data?.[0]?.id, row: data?.[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return respondUnauthorized();
    }
    if (err instanceof Error && err.message === 'Marketing API is not enabled') {
      return respondError('Marketing API is not enabled', 403);
    }
    return respondError((err instanceof Error ? err.message : 'Unknown error') || 'Failed to insert content');
  }
}
