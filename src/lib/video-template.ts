/**
 * Video Template System
 * Bold + Minimalist templates for Instagram Reels/TikTok
 * Generates MP4 videos from briefs (script, colors, music)
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface TemplateConfig {
  template: 'bold_minimal_v1' | 'bold_minimal_v2' | 'bold_minimal_v3';
  text: string; // Main text (hook + key message)
  primaryColor?: string; // Hex color (default: #000000)
  accentColor?: string; // Hex color (default: #FFFFFF)
  duration?: number; // Video duration in seconds (default: 15)
  musicFile?: string; // Path to music file (optional)
  voiceoverFile: string; // Path to voiceover MP3
}

interface VideoGenerationResult {
  success: boolean;
  videoPath?: string;
  error?: string;
  duration?: number;
}

/**
 * Template 1: Bold Text Center + Minimalist Background
 * - Full screen text overlay
 * - Solid color background with subtle animation
 * - Text fades in/out
 */
export async function generateBoldMinimalV1(
  config: TemplateConfig
): Promise<VideoGenerationResult> {
  const outputPath = join(tmpdir(), `vl-video-${randomBytes(8).toString('hex')}.mp4`);
  const filterscript = join(tmpdir(), `vl-filter-${randomBytes(8).toString('hex')}.txt`);

  try {
    const primaryColor = config.primaryColor || '#000000';
    const accentColor = config.accentColor || '#FFFFFF';
    const duration = config.duration || 15;

    // Create FFmpeg filter script for text overlay + fading
    const ffmpegFilter = `
color=c=${primaryColor}:s=1080x1920:d=${duration}[bg];
[bg]drawtext=
  textfile='${config.voiceoverFile}':
  fontsize=80:
  fontcolor=${accentColor}:
  x=(w-text_w)/2:
  y=(h-text_h)/2:
  fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:
  enable='between(t,0,${duration})'[text];
[text]fade=t=in:st=0:d=1,fade=t=out:st=${duration - 1}:d=1[out]
`;

    // Write filter script
    writeFileSync(filterscript, ffmpegFilter);

    // Run FFmpeg
    const ffmpegCommand = `ffmpeg -f lavfi -i "${primaryColor}" -i "${config.voiceoverFile}" -filter_complex "${ffmpegFilter}" -c:v libx264 -preset fast -c:a aac "${outputPath}" -y`;

    execSync(ffmpegCommand, { stdio: 'pipe' });

    return {
      success: true,
      videoPath: outputPath,
      duration: duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video',
    };
  } finally {
    try {
      unlinkSync(filterscript);
    } catch {}
  }
}

/**
 * Template 2: Side-by-side Layout
 * - Text on left, graphics/color block on right
 * - Dual color scheme
 * - Modern, clean aesthetic
 */
export async function generateBoldMinimalV2(
  config: TemplateConfig
): Promise<VideoGenerationResult> {
  const outputPath = join(tmpdir(), `vl-video-${randomBytes(8).toString('hex')}.mp4`);

  try {
    const primaryColor = config.primaryColor || '#000000';
    const accentColor = config.accentColor || '#FFFFFF';
    const duration = config.duration || 15;

    // Create two color blocks side-by-side
    const ffmpegFilter = `
color=c=${primaryColor}:s=1920x1080:d=${duration}[left];
color=c=${accentColor}:s=1920x1080:d=${duration}[right];
[left][right]hstack=inputs=2[bg];
[bg]drawtext=
  text='${config.text}':
  fontsize=60:
  fontcolor=${accentColor}:
  x=100:
  y=400:
  fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf[out]
`;

    // Run FFmpeg (simplified)
    const ffmpegCommand = `ffmpeg -f lavfi -i "color=${primaryColor}:s=1080x1920:d=${duration}" -vf "${ffmpegFilter}" -c:v libx264 -preset fast "${outputPath}" -y`;

    execSync(ffmpegCommand, { stdio: 'pipe' });

    return {
      success: true,
      videoPath: outputPath,
      duration: duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video',
    };
  }
}

/**
 * Template 3: Full-screen Minimalist
 * - Centered text, bold typography
 * - Single color background
 * - Smooth fade in/out
 */
export async function generateBoldMinimalV3(
  config: TemplateConfig
): Promise<VideoGenerationResult> {
  const outputPath = join(tmpdir(), `vl-video-${randomBytes(8).toString('hex')}.mp4`);

  try {
    const primaryColor = config.primaryColor || '#000000';
    const accentColor = config.accentColor || '#FFFFFF';
    const duration = config.duration || 15;

    const ffmpegCommand = `ffmpeg -f lavfi -i "color=${primaryColor}:s=1080x1920:d=${duration}" -vf "drawtext=text='${config.text}':fontsize=100:fontcolor=${accentColor}:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,fade=t=in:st=0:d=1,fade=t=out:st=${duration - 1}:d=1" -c:v libx264 -preset fast "${outputPath}" -y`;

    execSync(ffmpegCommand, { stdio: 'pipe' });

    return {
      success: true,
      videoPath: outputPath,
      duration: duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video',
    };
  }
}

/**
 * Route template config to appropriate generator
 */
export async function generateVideoFromTemplate(
  config: TemplateConfig
): Promise<VideoGenerationResult> {
  switch (config.template) {
    case 'bold_minimal_v1':
      return generateBoldMinimalV1(config);
    case 'bold_minimal_v2':
      return generateBoldMinimalV2(config);
    case 'bold_minimal_v3':
      return generateBoldMinimalV3(config);
    default:
      return {
        success: false,
        error: `Unknown template: ${config.template}`,
      };
  }
}
