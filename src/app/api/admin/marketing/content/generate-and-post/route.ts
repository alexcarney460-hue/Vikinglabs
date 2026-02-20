import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getElevenLabsClient } from '@/lib/elevenlabs-tts';
import { generateVideoWithRunway, createVideoPrompt } from '@/lib/runway-video';
import { postToInstagramGraphAPI } from '@/lib/instagram-poster';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for video generation

function log(stage: string, message: string, data?: any) {
  const entry = `[generate-and-post][${stage}] ${message}`;
  if (data) {
    console.log(entry, JSON.stringify(data, null, 2));
  } else {
    console.log(entry);
  }
}

/**
 * POST /api/admin/marketing/content/generate-and-post
 * Auto-generates video from brief + posts to Instagram
 */
export async function POST(req: NextRequest) {
  const stages: string[] = [];
  
  try {
    // ─── Stage 1: Auth ───
    log('auth', 'Checking session...');
    stages.push('auth_start');
    
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    
    log('auth', 'Session result', { 
      hasSession: !!session, 
      hasUser: !!user, 
      role: user?.role, 
      email: user?.email 
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required', stage: 'auth', details: { hasUser: !!user, role: user?.role } },
        { status: 401 }
      );
    }
    stages.push('auth_ok');

    // ─── Stage 2: Parse body ───
    const body = await req.json();
    const { contentId, template = 'bold_minimal_v1', primaryColor = '#000000', accentColor = '#FFFFFF' } = body;
    log('parse', 'Request body', { contentId, template });

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId', stage: 'parse' }, { status: 400 });
    }
    stages.push('parse_ok');

    // ─── Stage 3: Fetch content ───
    log('fetch', 'Fetching content from DB...');
    const supabase = getSupabaseServer();
    const { data: contentData, error: fetchError } = await supabase
      .from('marketing_content_queue')
      .select('*')
      .eq('id', contentId)
      .single();

    log('fetch', 'DB result', { 
      found: !!contentData, 
      error: fetchError?.message,
      hook: contentData?.hook?.substring(0, 50),
      hasScript: !!contentData?.script,
      hasCaption: !!contentData?.caption,
    });

    if (fetchError || !contentData) {
      return NextResponse.json(
        { error: `Content not found: ${fetchError?.message || 'no data'}`, stage: 'fetch' },
        { status: 404 }
      );
    }
    stages.push('fetch_ok');

    // ─── Stage 4: Generate voiceover ───
    log('voiceover', 'Starting ElevenLabs TTS...');
    const elevenLabs = getElevenLabsClient();
    
    let scriptText = contentData.hook || 'Check out Viking Labs';
    if (Array.isArray(contentData.script)) {
      scriptText = contentData.script.join(' ');
    } else if (typeof contentData.script === 'string') {
      scriptText = contentData.script;
    }
    
    log('voiceover', 'Script text', { length: scriptText.length, preview: scriptText.substring(0, 100) });

    const voiceoverResult = await elevenLabs.generateVoiceover({ text: scriptText });

    log('voiceover', 'Result', { 
      success: voiceoverResult.success, 
      error: voiceoverResult.error,
      bufferSize: voiceoverResult.audioBuffer?.length,
      duration: voiceoverResult.duration,
    });

    if (!voiceoverResult.success || !voiceoverResult.audioBuffer) {
      return NextResponse.json(
        { error: `Voiceover failed: ${voiceoverResult.error}`, stage: 'voiceover', stages },
        { status: 500 }
      );
    }
    stages.push('voiceover_ok');

    // ─── Stage 5: Generate video with Runway ───
    log('video', 'Starting Runway video generation...');
    const videoPrompt = createVideoPrompt(
      contentData.hook || 'Viking Labs',
      contentData.caption || '',
      primaryColor,
      accentColor
    );
    
    log('video', 'Prompt preview', { length: videoPrompt.length, preview: videoPrompt.substring(0, 200) });

    const videoResult = await generateVideoWithRunway(videoPrompt, {
      duration: 5,
      width: 1080,
      height: 1920,
    });

    log('video', 'Result', { 
      success: videoResult.success, 
      error: videoResult.error,
      taskId: videoResult.taskId,
      videoUrl: videoResult.videoUrl,
      bufferSize: videoResult.videoBuffer?.length,
    });

    if (!videoResult.success || !videoResult.videoBuffer) {
      return NextResponse.json(
        { error: `Video generation failed: ${videoResult.error}`, stage: 'video', stages },
        { status: 500 }
      );
    }
    stages.push('video_ok');

    // ─── Stage 6: Post to Instagram ───
    log('instagram', 'Starting Instagram post...');
    
    const igAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    log('instagram', 'Config check', { 
      hasAccessToken: !!igAccessToken,
      hasAccountId: !!igAccountId,
      tokenPreview: igAccessToken ? igAccessToken.substring(0, 10) + '...' : 'MISSING',
    });

    if (!igAccessToken || !igAccountId) {
      // If no Graph API creds, skip Instagram posting and just save the video info
      log('instagram', 'No Instagram Graph API credentials - skipping post, saving video only');
      
      const { error: updateError } = await supabase
        .from('marketing_content_queue')
        .update({
          status: 'approved',
          video_generated_at: new Date().toISOString(),
          video_template: template,
        })
        .eq('id', contentId);

      return NextResponse.json({
        success: true,
        partial: true,
        contentId,
        message: 'Video generated successfully but Instagram posting skipped - INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID env vars not configured. Set up Instagram Graph API credentials to enable auto-posting.',
        stages,
        videoGenerated: true,
        instagramPosted: false,
      });
    }

    const fullCaption = `${contentData.caption || ''}\n\n${(contentData.hashtags || []).join(' ')}`;
    
    const postResult = await postToInstagramGraphAPI({
      accessToken: igAccessToken,
      accountId: igAccountId,
      videoUrl: videoResult.videoUrl!, // Runway provides a URL
      caption: fullCaption,
    });

    log('instagram', 'Post result', { 
      success: postResult.success, 
      error: postResult.error,
      postUrl: postResult.postUrl,
      postId: postResult.postId,
    });

    if (!postResult.success) {
      return NextResponse.json(
        { error: `Instagram posting failed: ${postResult.error}`, stage: 'instagram', stages },
        { status: 500 }
      );
    }
    stages.push('instagram_ok');

    // ─── Stage 7: Update database ───
    log('db_update', 'Updating content status...');
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
      log('db_update', 'Update failed', { error: updateError.message });
      return NextResponse.json(
        { error: `Posted but DB update failed: ${updateError.message}`, stage: 'db_update', postUrl: postResult.postUrl, stages },
        { status: 500 }
      );
    }
    stages.push('db_update_ok');

    log('complete', 'All stages complete!');
    return NextResponse.json({
      success: true,
      contentId,
      postUrl: postResult.postUrl,
      postId: postResult.postId,
      message: 'Video generated and posted to Instagram successfully',
      stages,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;
    log('FATAL', 'Unhandled error', { message: errorMsg, stack: errorStack });
    
    return NextResponse.json(
      {
        error: errorMsg,
        stage: 'unhandled_exception',
        stages,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
