import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { postToInstagram } from '@/lib/instagram-poster';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

/**
 * POST /api/admin/marketing/content/upload
 * Upload video + auto-post to Instagram
 * 
 * Body:
 * - videoFile: File (video/mp4, video/quicktime, etc.)
 * - contentId: string (UUID of marketing brief)
 * - scheduleFor?: string (ISO timestamp - optional, for future scheduling)
 */
export async function POST(req: NextRequest) {
  try {
    // Check auth
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const videoFile = formData.get('videoFile') as File | null;
    const contentId = formData.get('contentId') as string | null;
    const igUsername = formData.get('igUsername') as string | null;
    const igPassword = formData.get('igPassword') as string | null;

    if (!videoFile || !contentId) {
      return NextResponse.json(
        { error: 'Missing videoFile or contentId' },
        { status: 400 }
      );
    }

    // Get content from database
    const supabase = getSupabaseServer();
    const { data: contentData, error: fetchError } = await supabase
      .from('marketing_content_queue')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !contentData) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Save video temporarily
    const buffer = await videoFile.arrayBuffer();
    const tempDir = join(tmpdir(), 'vl-uploads');
    await mkdir(tempDir, { recursive: true });
    
    const videoPath = join(tempDir, `${contentId}-${Date.now()}.mp4`);
    await writeFile(videoPath, Buffer.from(buffer));

    // Use stored credentials if not provided
    const username = igUsername || process.env.INSTAGRAM_USERNAME;
    const password = igPassword || process.env.INSTAGRAM_PASSWORD;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Instagram credentials not provided and not found in env' },
        { status: 400 }
      );
    }

    // Auto-post to Instagram
    const postResult = await postToInstagram({
      username,
      password,
      videoPath,
      caption: contentData.caption || '',
      hashtags: contentData.hashtags || [],
    });

    if (!postResult.success) {
      return NextResponse.json(
        { error: `Failed to post to Instagram: ${postResult.error}` },
        { status: 500 }
      );
    }

    // Update content status in database
    const { error: updateError } = await supabase
      .from('marketing_content_queue')
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        platform_post_id: postResult.postId,
        platform_post_url: postResult.postUrl,
      })
      .eq('id', contentId);

    if (updateError) {
      return NextResponse.json(
        { error: `Posted to Instagram but failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contentId,
      postUrl: postResult.postUrl,
      postId: postResult.postId,
      message: 'Video uploaded and posted to Instagram successfully',
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err instanceof Error ? err.message : 'Unknown error') || 'Failed to upload and post' },
      { status: 500 }
    );
  }
}
