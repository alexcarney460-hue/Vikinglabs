import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getElevenLabsClient } from '@/lib/elevenlabs-tts';
import { generateVideoFromTemplate } from '@/lib/video-template';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { role?: string; email?: string } | undefined;
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { contentId, template = 'bold_minimal_v1', primaryColor = '#000000', accentColor = '#FFFFFF', duration = 15 } = body;

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: contentData, error: fetchError } = await supabase
      .from('marketing_content_queue')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !contentData) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    let voiceoverPath = '';

    try {
      const elevenLabs = getElevenLabsClient();
      const scriptText = contentData.script || contentData.hook || 'Check out Viking Labs';

      const voiceoverResult = await elevenLabs.generateVoiceover({ text: scriptText });

      if (!voiceoverResult.success || !voiceoverResult.audioBuffer) {
        return NextResponse.json(
          { error: `Failed to generate voiceover: ${voiceoverResult.error}` },
          { status: 500 }
        );
      }

      voiceoverPath = join(tmpdir(), `vl-voiceover-${contentId}-${Date.now()}.mp3`);
      writeFileSync(voiceoverPath, voiceoverResult.audioBuffer);

      const videoResult = await generateVideoFromTemplate({
        template: template as any,
        text: contentData.hook || 'Viking Labs',
        primaryColor,
        accentColor,
        duration,
        voiceoverFile: voiceoverPath,
      });

      if (!videoResult.success || !videoResult.videoPath) {
        return NextResponse.json(
          { error: `Failed to generate video: ${videoResult.error}` },
          { status: 500 }
        );
      }

      const { error: updateError } = await supabase
        .from('marketing_content_queue')
        .update({
          video_template: template,
          video_generated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (updateError) {
        return NextResponse.json(
          { error: `Video generated but database update failed: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        contentId,
        videoPath: videoResult.videoPath,
        duration: videoResult.duration,
        message: 'Video generated successfully',
      });
    } finally {
      if (voiceoverPath) {
        try {
          unlinkSync(voiceoverPath);
        } catch {}
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate video' },
      { status: 500 }
    );
  }
}
