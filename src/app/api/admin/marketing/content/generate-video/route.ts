import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { getElevenLabsClient } from '@/lib/elevenlabs-tts';
import { generateVideoFromTemplate } from '@/lib/video-template';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/marketing/content/generate-video/{id}
 * Generates video from brief using ElevenLabs TTS + template system
 * 
 * Body:
 * - template: 'bold_minimal_v1' | 'bold_minimal_v2' | 'bold_minimal_v3'
 * - primaryColor?: string (hex)
 * - accentColor?: string (hex)
 * - duration?: number (seconds, default 15)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const contentId = id;
    const body = await req.json();
    const { template = 'bold_minimal_v1', primaryColor, accentColor, duration } = body;

    // Fetch content from database
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

    // Generate voiceover from script
    const elevenLabs = getElevenLabsClient();
    const scriptText = contentData.script || contentData.hook || 'Check out Viking Labs';

    const voiceoverResult = await elevenLabs.generateVoiceover({
      text: scriptText,
    });

    if (!voiceoverResult.success || !voiceoverResult.audioBuffer) {
      return NextResponse.json(
        { error: `Failed to generate voiceover: ${voiceoverResult.error}` },
        { status: 500 }
      );
    }

    // Save voiceover temporarily
    const voiceoverPath = join(tmpdir(), `vl-voiceover-${contentId}.mp3`);
    writeFileSync(voiceoverPath, voiceoverResult.audioBuffer);

    try {
      // Generate video
      const videoResult = await generateVideoFromTemplate({
        template: template as any,
        text: contentData.hook || 'Viking Labs',
        primaryColor: primaryColor || '#000000',
        accentColor: accentColor || '#FFFFFF',
        duration: duration || 15,
        voiceoverFile: voiceoverPath,
      });

      if (!videoResult.success || !videoResult.videoPath) {
        return NextResponse.json(
          { error: `Failed to generate video: ${videoResult.error}` },
          { status: 500 }
        );
      }

      // Update content with video generation metadata
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
      // Clean up voiceover
      try {
        unlinkSync(voiceoverPath);
      } catch {}
    }
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to generate video',
      },
      { status: 500 }
    );
  }
}
