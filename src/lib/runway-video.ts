/**
 * Runway ML Video Generation
 * Generates videos from text prompts using Runway's Gen-3 API
 */

const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

interface RunwayGenerationRequest {
  prompt: string;
  duration?: number;
  width?: number;
  height?: number;
}

interface RunwayGenerationResult {
  success: boolean;
  videoUrl?: string;
  videoBuffer?: Buffer;
  error?: string;
  duration?: number;
  taskId?: string;
}

/**
 * Generate video using Runway Gen-3 API
 */
export async function generateVideoWithRunway(
  prompt: string,
  options?: {
    duration?: number;
    width?: number;
    height?: number;
  }
): Promise<RunwayGenerationResult> {
  try {
    const apiKey = process.env.RUNWAY_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'Runway API key not configured',
      };
    }

    const duration = options?.duration || 5;
    const width = options?.width || 1080;
    const height = options?.height || 1920;

    // Submit generation task
    const taskResponse = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration,
        width,
        height,
        model: 'gen3',
      }),
    });

    if (!taskResponse.ok) {
      const error = await taskResponse.text();
      return {
        success: false,
        error: `Runway API error: ${taskResponse.status} - ${error}`,
      };
    }

    const taskData = await taskResponse.json() as any;
    const taskId = taskData.id;

    if (!taskId) {
      return {
        success: false,
        error: 'No task ID returned from Runway',
      };
    }

    // Poll for completion (max 5 minutes)
    let completed = false;
    let videoUrl: string | undefined;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second polling

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      const statusResponse = await fetch(
        `${RUNWAY_API_URL}/image_to_video/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json() as any;

        if (statusData.status === 'SUCCEEDED') {
          completed = true;
          videoUrl = statusData.output?.[0]; // First output video
        } else if (statusData.status === 'FAILED') {
          return {
            success: false,
            error: `Runway generation failed: ${statusData.error}`,
          };
        }
      }
    }

    if (!completed || !videoUrl) {
      return {
        success: false,
        error: 'Runway video generation timed out or no output URL',
      };
    }

    // Download the video
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return {
        success: false,
        error: `Failed to download generated video: ${videoResponse.status}`,
      };
    }

    const videoBuffer = await videoResponse.arrayBuffer();

    return {
      success: true,
      videoUrl,
      videoBuffer: Buffer.from(videoBuffer),
      duration,
      taskId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate video with Runway',
    };
  }
}

/**
 * Create optimized prompt for Viking Labs videos
 */
export function createVideoPrompt(
  hook: string,
  caption: string,
  primaryColor: string,
  accentColor: string
): string {
  return `
Create a 5-second Instagram Reel video with these specifications:

TEXT CONTENT: "${hook}"

VISUAL STYLE:
- Bold and minimalist design
- Primary color background: ${primaryColor}
- Text color: ${accentColor}
- Professional, lab-grade aesthetic
- Modern typography, clean lines
- No people, no faces, focus on product/abstract concepts

BRANDING:
- Viking Labs - premium peptide research
- Scientific, trustworthy, innovative vibe
- High quality, professional production

ANIMATION:
- Subtle fade in/out transitions
- Text appears at 0.5s, stays visible, fades at 4.5s
- Smooth, elegant motion
- No text-to-speech voiceover needed

ASPECT RATIO: 9:16 (vertical for Instagram Reels)
DURATION: 5 seconds
QUALITY: High definition, 1080x1920
`;
}
