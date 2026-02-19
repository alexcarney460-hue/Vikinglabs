import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { assertMarketingKey } from '@/lib/marketingAuth';
import { decryptToken } from '@/lib/tokenEncryption';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertMarketingKey(req);

    const { id } = await params;
    const supabase = getSupabaseServer();

    // Fetch draft
    const { data: draft, error: draftError } = await supabase
      .from('marketing_content_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.status !== 'approved') {
      return NextResponse.json(
        { error: 'Draft must be approved before publishing' },
        { status: 400 }
      );
    }

    if ((draft.risk_score || 0) > 0.4) {
      return NextResponse.json(
        { error: 'Draft risk score exceeds threshold' },
        { status: 400 }
      );
    }

    // Fetch connected accounts
    const { data: connections } = await supabase
      .from('social_connections')
      .select('*')
      .eq('status', 'active');

    const results: Record<string, any> = {};

    // Publish to Instagram
    const igConnection = connections?.find((c) => c.platform === 'instagram');
    if (igConnection && draft.platform === 'instagram') {
      try {
        const accessToken = decryptToken(igConnection.access_token_enc);
        const igResult = await publishToInstagram(draft, accessToken, igConnection.account_id);

        const { error: postError } = await supabase
          .from('social_posts')
          .insert({
            marketing_content_id: id,
            platform: 'instagram',
            platform_post_id: igResult.post_id,
            status: 'posted',
            posted_at: new Date().toISOString(),
          });

        results.instagram = {
          status: 'posted',
          post_id: igResult.post_id,
        };
      } catch (err) {
        results.instagram = {
          status: 'failed',
          error: (err instanceof Error ? err.message : 'Unknown error'),
        };
      }
    }

    // Publish to TikTok
    const ttConnection = connections?.find((c) => c.platform === 'tiktok');
    if (ttConnection && draft.platform === 'tiktok') {
      try {
        const accessToken = decryptToken(ttConnection.access_token_enc);
        const ttResult = await publishToTikTok(draft, accessToken);

        const { error: postError } = await supabase
          .from('social_posts')
          .insert({
            marketing_content_id: id,
            platform: 'tiktok',
            platform_post_id: ttResult.post_id,
            status: 'posted',
            posted_at: new Date().toISOString(),
          });

        results.tiktok = {
          status: 'posted',
          post_id: ttResult.post_id,
        };
      } catch (err) {
        results.tiktok = {
          status: 'failed',
          error: (err instanceof Error ? err.message : 'Unknown error'),
        };
      }
    }

    return NextResponse.json({
      draft_id: id,
      published_results: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

async function publishToInstagram(
  draft: any,
  accessToken: string,
  accountId: string
): Promise<{ post_id: string }> {
  const caption = `${draft.caption}\n\n${draft.hashtags?.join(' ') || ''}`;

  const response = await fetch(
    `https://graph.instagram.com/v18.0/${accountId}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: new URLSearchParams({
        image_url: draft.media_url || '',
        caption,
        media_type: 'IMAGE',
      }),
    }
  );

  if (!response.ok) throw new Error('Instagram API error');
  const data = await response.json();
  return { post_id: data.id };
}

async function publishToTikTok(draft: any, accessToken: string): Promise<{ post_id: string }> {
  const response = await fetch('https://open.tiktokapis.com/v1/post/publish/action/upload/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: draft.video_size || 1024000,
        chunk_size: 5242880,
        total_chunk_count: 1,
      },
      post_info: {
        title: draft.caption,
        description: `${draft.hook}\n\n${draft.script?.join('\n') || ''}`,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 0,
      },
    }),
  });

  if (!response.ok) throw new Error('TikTok API error');
  const data = await response.json();
  return { post_id: data.data?.video_id || 'pending' };
}
