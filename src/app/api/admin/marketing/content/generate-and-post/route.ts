import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getElevenLabsClient } from '@/lib/elevenlabs-tts';
import { generateVideoWithRunway, createVideoPrompt } from '@/lib/runway-video';
import { postToInstagram } from '@/lib/instagram-poster';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/marketing/content/generate-and-post
 * Auto-generates video from brief + posts to Instagram
 * 
 * Body:
 * - contentId: string (UUID)
 * - template?: string (default: 'bold_minimal_v1')
 * - primaryColor?: string (hex)
 * - accentColor?: string (hex)
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

    const body = await req.json();
    const {
      contentId,
      template = 'bold_minimal_v1',
      primaryColor = '#000000',
      accentColor = '#FFFFFF',
    } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing contentId' },
        { status: 400 }
      );
    }

    // Fetch content
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

    let voiceoverPath = '';
    let videoPath = '';

    try {
      // Step 1: Generate voiceover
      const elevenLabs = getElevenLabsClient();
      let scriptText = contentData.hook || 'Check out Viking Labs';
      
      // If script is an array, join it into a single string
      if (Array.isArray(contentData.script)) {
        scriptText = contentData.script.join(' ');
      } else if (typeof contentData.script === 'string') {
        scriptText = contentData.script;
      }

      const voiceoverResult = await elevenLabs.generateVoiceover({
        text: scriptText,
      });

      if (!voiceoverResult.success || !voiceoverResult.audioBuffer) {
        return NextResponse.json(
          {
            error: `Failed to generate voiceover: ${voiceoverResult.error}`,
            stage: 'voiceover_generation',
          },
          { status: 500 }
        );
      }

      // Save voiceover
      voiceoverPath = join(tmpdir(), `vl-voiceover-${contentId}-${Date.now()}.mp3`);
      writeFileSync(voiceoverPath, voiceoverResult.audioBuffer);

      // Step 2: Generate video with Runway
      const videoPrompt = createVideoPrompt(
        contentData.hook || 'Viking Labs',
        contentData.caption || '',
        primaryColor,
        accentColor
      );

      const videoResult = await generateVideoWithRunway(videoPrompt, {
        duration: 5,
        width: 1080,
        height: 1920,
      });

      if (!videoResult.success || !videoResult.videoBuffer) {
        return NextResponse.json(
          {
            error: `Failed to generate video: ${videoResult.error}`,
            stage: 'video_generation',
          },
          { status: 500 }
        );
      }

      // Save video buffer to temp file for Instagram posting
      videoPath = join(tmpdir(), `vl-video-${contentId}-${Date.now()}.mp4`);
      writeFileSync(videoPath, videoResult.videoBuffer);

      // Step 3: Post to Instagram
      const igUsername = process.env.INSTAGRAM_USERNAME;
      const igPassword = process.env.INSTAGRAM_PASSWORD;

      if (!igUsername || !igPassword) {
        return NextResponse.json(
          {
            error: 'Instagram credentials not configured',
            stage: 'instagram_posting',
          },
          { status: 400 }
        );
      }

      const postResult = await postToInstagram({
        username: igUsername,
        password: igPassword,
        videoPath,
        caption: contentData.caption || '',
        hashtags: contentData.hashtags || [],
      });

      if (!postResult.success) {
        return NextResponse.json(
          {
            error: `Failed to post to Instagram: ${postResult.error}`,
            stage: 'instagram_posting',
          },
          { status: 500 }
        );
      }

      // Step 4: Update database
      const { error: updateError } = await supabase
        .from('marketing_content_queue')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          platform_post_id: postResult.postId,
          platform_post_url: postResult.postUrl,
          video_template: template,
          video_generated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (updateError) {
        return NextResponse.json(
          {
            error: `Posted to Instagram but failed to update database: ${updateError.message}`,
            postUrl: postResult.postUrl,
            stage: 'database_update',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        contentId,
        postUrl: postResult.postUrl,
        postId: postResult.postId,
        message: 'Video generated and posted to Instagram successfully',
      });
    } finally {
      // Clean up temp files
      if (voiceoverPath) {
        try {
          unlinkSync(voiceoverPath);
        } catch {}
      }
      if (videoPath) {
        try {
          unlinkSync(videoPath);
        } catch {}
      }
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to generate and post video',
      },
      { status: 500 }
    );
  }
}
