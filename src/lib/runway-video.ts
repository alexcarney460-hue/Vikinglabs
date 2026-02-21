/**
 * Runway ML Video Generation
 * Generates videos using Runway's API (Gen-4.5 / Gen-3)
 * Docs: https://docs.dev.runwayml.com/
 */

const RUNWAY_API_URL = process.env.RUNWAY_API_URL || 'https://api.dev.runwayml.com/v1';

type RunwayHeaderConfig = {
  headerName?: string;
  headerValue?: string;
};

function getRunwayVersionHeader(): RunwayHeaderConfig {
  const headerValue = process.env.RUNWAY_API_VERSION?.trim();
  if (!headerValue) return {};
  const headerName = (
    process.env.RUNWAY_VERSION_HEADER ||
    process.env.RUNWAY_API_VERSION_HEADER ||
    'X-Runway-Version'
  ).trim();
  return { headerName, headerValue };
}

function buildRunwayHeaders(
  apiKey: string,
  options?: { includeContentType?: boolean; omitVersion?: boolean }
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };

  if (options?.includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const { headerName, headerValue } = getRunwayVersionHeader();
  if (headerName && headerValue && !options?.omitVersion) {
    headers[headerName] = headerValue;
  }

  return { headers, hasVersionHeader: !!(headerName && headerValue) };
}

function shouldRetryWithoutVersion(status: number, responseText: string) {
  if (status < 400 || status >= 500) return false;
  return /version|x-runway-version|runway-version|unsupported header|invalid header/i.test(
    responseText
  );
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
 * Generate video using Runway API
 * Uses image_to_video endpoint with promptText (text-only, no image required)
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
        error: 'RUNWAY_API_KEY not configured in environment variables',
      };
    }

    const duration = options?.duration || 5;
    // Use ratio format for Runway API (vertical for Reels)
    const ratio = '720:1280'; // 9:16 vertical

    console.log('[runway-video] Submitting generation task...');
    console.log('[runway-video] Prompt length:', prompt.length);
    console.log('[runway-video] Duration:', duration, 'Ratio:', ratio);

    // Submit generation task (version header configurable; retry without it if rejected)
    const submitBody = JSON.stringify({
      model: 'gen-4.5',
      promptText: prompt,
      ratio,
      duration,
    });

    const { headers: submitHeaders, hasVersionHeader } = buildRunwayHeaders(apiKey, {
      includeContentType: true,
    });

    let taskResponse = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
      method: 'POST',
      headers: submitHeaders,
      body: submitBody,
    });

    let responseText = await taskResponse.text();

    if (!taskResponse.ok && hasVersionHeader && shouldRetryWithoutVersion(taskResponse.status, responseText)) {
      console.warn('[runway-video] Version header rejected; retrying without version header...');
      const { headers: retryHeaders } = buildRunwayHeaders(apiKey, {
        includeContentType: true,
        omitVersion: true,
      });
      taskResponse = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
        method: 'POST',
        headers: retryHeaders,
        body: submitBody,
      });
      responseText = await taskResponse.text();
    }

    console.log('[runway-video] Task response status:', taskResponse.status);
    console.log('[runway-video] Task response body:', responseText);

    if (!taskResponse.ok) {
      return {
        success: false,
        error: `Runway API error: ${taskResponse.status} - ${responseText}`,
      };
    }

    let taskData: any;
    try {
      taskData = JSON.parse(responseText);
    } catch {
      return {
        success: false,
        error: `Runway returned non-JSON response: ${responseText.substring(0, 200)}`,
      };
    }

    const taskId = taskData.id;
    if (!taskId) {
      return {
        success: false,
        error: `No task ID returned from Runway. Response: ${JSON.stringify(taskData)}`,
      };
    }

    console.log('[runway-video] Task created:', taskId);

    // Poll for completion (max 5 minutes)
    let completed = false;
    let videoUrl: string | undefined;
    let attempts = 0;
    const maxAttempts = 60;

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      attempts++;

      const { headers: statusHeaders, hasVersionHeader: statusHasVersion } = buildRunwayHeaders(apiKey);
      let statusResponse = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
        headers: statusHeaders,
      });

      let statusText: string | undefined;

      if (!statusResponse.ok && statusHasVersion) {
        statusText = await statusResponse.text();
        if (shouldRetryWithoutVersion(statusResponse.status, statusText)) {
          console.warn('[runway-video] Version header rejected on status poll; retrying without version header...');
          const { headers: retryHeaders } = buildRunwayHeaders(apiKey, { omitVersion: true });
          statusResponse = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
            headers: retryHeaders,
          });
          statusText = undefined;
        }
      }

      if (statusResponse.ok) {
        const statusData = (await statusResponse.json()) as any;
        console.log(`[runway-video] Poll ${attempts}: status=${statusData.status}`);

        if (statusData.status === 'SUCCEEDED') {
          completed = true;
          videoUrl = statusData.output?.[0];
          console.log('[runway-video] Success! Video URL:', videoUrl);
        } else if (statusData.status === 'FAILED') {
          console.error('[runway-video] Generation failed:', JSON.stringify(statusData));
          return {
            success: false,
            error: `Runway generation failed: ${statusData.failure || statusData.failureCode || 'unknown'}`,
          };
        }
        // THROTTLED, RUNNING, PENDING - keep polling
      } else {
        if (!statusText) statusText = await statusResponse.text().catch(() => '');
        console.warn(`[runway-video] Status poll failed: ${statusResponse.status} ${statusText ? `- ${statusText}` : ''}`);
      }
    }

    if (!completed || !videoUrl) {
      return {
        success: false,
        error: `Runway video generation timed out after ${attempts * 5}s (${attempts} polls)`,
      };
    }

    // Download the video
    console.log('[runway-video] Downloading video...');
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return {
        success: false,
        error: `Failed to download video: ${videoResponse.status}`,
      };
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    console.log('[runway-video] Downloaded', videoBuffer.byteLength, 'bytes');

    return {
      success: true,
      videoUrl,
      videoBuffer: Buffer.from(videoBuffer),
      duration,
      taskId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[runway-video] Fatal error:', msg);
    return {
      success: false,
      error: msg,
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
  // Keep prompts concise for Runway - they work better with visual descriptions
  return `Cinematic 5-second vertical video. Bold text "${hook}" appearing with smooth animation on a ${primaryColor} background. Professional, minimalist design with ${accentColor} accents. Clean typography, lab-grade scientific aesthetic. Subtle particle effects and elegant motion. Premium peptide research brand feel.`;
}
