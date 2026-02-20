/**
 * Instagram Auto-Poster via Graph API
 * Posts content to Instagram using the official Instagram Graph API
 * 
 * Required env vars:
 * - INSTAGRAM_ACCESS_TOKEN: Long-lived Facebook/Instagram access token
 * - INSTAGRAM_ACCOUNT_ID: Instagram Business Account ID
 * 
 * Setup: https://developers.facebook.com/docs/instagram-api/getting-started
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

interface InstagramGraphAPIConfig {
  accessToken: string;
  accountId: string;
  videoUrl: string; // Must be a publicly accessible URL
  caption: string;
}

interface PostResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Post a video (Reel) to Instagram via Graph API
 * 
 * Flow:
 * 1. Create a media container with the video URL
 * 2. Wait for the container to finish processing
 * 3. Publish the container
 */
export async function postToInstagramGraphAPI(config: InstagramGraphAPIConfig): Promise<PostResult> {
  try {
    console.log('[instagram-poster] Starting Graph API post...');
    console.log('[instagram-poster] Account ID:', config.accountId);
    console.log('[instagram-poster] Video URL:', config.videoUrl?.substring(0, 100));
    
    // Step 1: Create media container
    const createUrl = `${GRAPH_API_BASE}/${config.accountId}/media`;
    const createParams = new URLSearchParams({
      media_type: 'REELS',
      video_url: config.videoUrl,
      caption: config.caption,
      access_token: config.accessToken,
    });

    console.log('[instagram-poster] Creating media container...');
    const createRes = await fetch(createUrl, {
      method: 'POST',
      body: createParams,
    });

    const createData = await createRes.json() as any;
    console.log('[instagram-poster] Create response:', JSON.stringify(createData));

    if (createData.error) {
      return {
        success: false,
        error: `Graph API create error: ${createData.error.message} (code: ${createData.error.code})`,
      };
    }

    const containerId = createData.id;
    if (!containerId) {
      return {
        success: false,
        error: 'No container ID returned from Graph API',
      };
    }

    // Step 2: Wait for video processing (poll status)
    console.log('[instagram-poster] Waiting for video processing, container:', containerId);
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;

      const statusUrl = `${GRAPH_API_BASE}/${containerId}?fields=status_code,status&access_token=${config.accessToken}`;
      const statusRes = await fetch(statusUrl);
      const statusData = await statusRes.json() as any;
      
      console.log(`[instagram-poster] Status check ${attempts}:`, JSON.stringify(statusData));
      
      if (statusData.status_code === 'FINISHED') {
        status = 'FINISHED';
      } else if (statusData.status_code === 'ERROR') {
        return {
          success: false,
          error: `Video processing failed: ${statusData.status || 'unknown error'}`,
        };
      }
    }

    if (status !== 'FINISHED') {
      return {
        success: false,
        error: 'Video processing timed out after 5 minutes',
      };
    }

    // Step 3: Publish
    console.log('[instagram-poster] Publishing...');
    const publishUrl = `${GRAPH_API_BASE}/${config.accountId}/media_publish`;
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: config.accessToken,
    });

    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      body: publishParams,
    });

    const publishData = await publishRes.json() as any;
    console.log('[instagram-poster] Publish response:', JSON.stringify(publishData));

    if (publishData.error) {
      return {
        success: false,
        error: `Graph API publish error: ${publishData.error.message}`,
      };
    }

    const postId = publishData.id;
    
    // Try to get the permalink
    let postUrl = `https://www.instagram.com/p/${postId}/`;
    try {
      const permalinkRes = await fetch(
        `${GRAPH_API_BASE}/${postId}?fields=permalink&access_token=${config.accessToken}`
      );
      const permalinkData = await permalinkRes.json() as any;
      if (permalinkData.permalink) {
        postUrl = permalinkData.permalink;
      }
    } catch {
      // Use default URL format
    }

    console.log('[instagram-poster] Successfully posted!', { postId, postUrl });

    return {
      success: true,
      postUrl,
      postId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[instagram-poster] Fatal error:', msg);
    return {
      success: false,
      error: msg,
    };
  }
}

// Keep old export for backwards compat but mark as deprecated
/** @deprecated Use postToInstagramGraphAPI instead - Playwright doesn't work on Vercel */
export async function postToInstagram(config: {
  username: string;
  password: string;
  videoPath: string;
  caption: string;
  hashtags: string[];
}): Promise<PostResult> {
  return {
    success: false,
    error: 'Playwright-based Instagram posting is deprecated. Use Graph API (postToInstagramGraphAPI) instead. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID env vars.',
  };
}
