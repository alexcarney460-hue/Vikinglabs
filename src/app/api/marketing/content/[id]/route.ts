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
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  engagement_rate?: number | null;
  posted_at?: string | null;
  platform_post_id?: string | null;
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

    // Metrics fields validation
    const metricFields = ['views', 'likes', 'comments', 'shares', 'saves', 'engagement_rate'] as const;
    for (const field of metricFields) {
      if (field in body) {
        const value = body[field as keyof typeof body];
        if (value !== null && value !== undefined) {
          if (typeof value !== 'number') {
            return respondBadRequest(`${field} must be a number or null`);
          }
          if (value < 0) {
            return respondBadRequest(`${field} cannot be negative`);
          }
        }
        update[field] = value;
      }
    }

    if ('posted_at' in body) {
      const value = body.posted_at;
      if (value !== null && value !== undefined) {
        if (typeof value !== 'string') {
          return respondBadRequest('posted_at must be an ISO timestamp string or null');
        }
        const timestamp = Date.parse(value);
        if (isNaN(timestamp)) {
          return respondBadRequest('posted_at must be a valid ISO timestamp');
        }
      }
      update.posted_at = value;
    }

    if ('platform_post_id' in body) {
      const value = body.platform_post_id;
      if (value !== null && value !== undefined) {
        if (typeof value !== 'string') {
          return respondBadRequest('platform_post_id must be a string or null');
        }
      }
      update.platform_post_id = value;
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
