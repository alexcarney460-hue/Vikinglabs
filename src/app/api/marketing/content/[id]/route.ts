import { NextRequest, NextResponse } from 'next/server';
import { assertMarketingEnabled, assertMarketingKey, respondUnauthorized, respondBadRequest, respondError } from '@/lib/marketingAuth';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['draft', 'approved', 'posted', 'killed'];

interface UpdatePayload {
  status?: string;
  caption?: string;
  script?: string[];
  hashtags?: string[];
  compliance?: {
    risk_score?: number;
    flags?: string[];
    notes?: string;
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertMarketingEnabled();
    assertMarketingKey(req);

    const { id } = await params;
    const body = (await req.json()) as UpdatePayload;

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return respondBadRequest('Request body cannot be empty');
    }

    // Build update object
    const update: Record<string, unknown> = {};

    if ('status' in body) {
      if (!VALID_STATUSES.includes(body.status || '')) {
        return respondBadRequest(`Invalid status: ${body.status}`);
      }
      update.status = body.status;
    }

    if ('caption' in body && typeof body.caption === 'string') {
      update.caption = body.caption;
    }

    if ('script' in body && Array.isArray(body.script)) {
      update.script = body.script;
    }

    if ('hashtags' in body && Array.isArray(body.hashtags)) {
      update.hashtags = body.hashtags;
    }

    if ('compliance' in body && typeof body.compliance === 'object') {
      const { compliance } = body;
      if (compliance) {
        const complianceUpdate: Record<string, unknown> = {};
        if (typeof (compliance as Record<string, unknown>).risk_score === 'number') {
          complianceUpdate.risk_score = (compliance as Record<string, unknown>).risk_score;
        }
        if (Array.isArray((compliance as Record<string, unknown>).flags)) {
          complianceUpdate.flags = (compliance as Record<string, unknown>).flags;
        }
        if (typeof (compliance as Record<string, unknown>).notes === 'string') {
          complianceUpdate.notes = (compliance as Record<string, unknown>).notes;
        }
        if (Object.keys(complianceUpdate).length > 0) {
          update.compliance = complianceUpdate;
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return respondBadRequest('No valid fields to update');
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('marketing_content_queue')
      .update(update)
      .eq('id', id)
      .select();

    if (error) {
      return respondError(`Failed to update content: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return respondError('Content not found', 404);
    }

    return NextResponse.json({ row: data[0] });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return respondUnauthorized();
    }
    if (err instanceof Error && err.message === 'Marketing API is not enabled') {
      return respondError('Marketing API is not enabled', 403);
    }
    return respondError((err instanceof Error ? err.message : 'Unknown error') || 'Failed to update content');
  }
}
