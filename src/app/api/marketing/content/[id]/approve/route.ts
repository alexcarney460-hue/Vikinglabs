import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { assertMarketingKey } from '@/lib/marketingAuth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertMarketingKey(req);

    const { id } = await params;
    const supabase = getSupabaseServer();

    // Update draft to approved
    const { data, error } = await supabase
      .from('marketing_content_queue')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Draft not found or failed to approve' },
        { status: 404 }
      );
    }

    // Check compliance
    if ((data.risk_score || 0) > 0.4) {
      return NextResponse.json(
        { error: 'Draft risk score exceeds threshold (0.4)' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: 'approved',
      risk_score: data.risk_score,
      ready_for_publish: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
