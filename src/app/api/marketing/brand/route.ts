import { NextRequest, NextResponse } from 'next/server';
import { assertMarketingEnabled, assertMarketingKey, respondUnauthorized, respondError } from '@/lib/marketingAuth';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    assertMarketingEnabled();
    assertMarketingKey(req);

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('marketing_brand_docs')
      .select('type, version, content_md, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      return respondError(`Failed to fetch brand docs: ${error.message}`);
    }

    return NextResponse.json({ docs: data || [] });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid or missing')) {
      return respondUnauthorized();
    }
    if (err instanceof Error && err.message === 'Marketing API is not enabled') {
      return respondError('Marketing API is not enabled', 403);
    }
    return respondError((err instanceof Error ? err.message : 'Unknown error') || 'Failed to fetch brand docs');
  }
}
