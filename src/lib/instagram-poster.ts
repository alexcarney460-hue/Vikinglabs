/**
 * Instagram Auto-Poster
 * Posts content to @vikinglabs.co using browser automation (Playwright)
 * Stores post URL and updates content status
 */

import { chromium } from 'playwright';

interface InstagramPostConfig {
  username: string;
  password: string;
  videoPath: string;
  caption: string;
  hashtags: string[];
}

interface PostResult {
  success: boolean;
  postUrl?: string;
  postId?: string;
  error?: string;
  timestamp?: string;
}

export async function postToInstagram(config: InstagramPostConfig): Promise<PostResult> {
  let browser;
  
  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to Instagram
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle' });

    // Login
    await page.click('[name="username"]');
    await page.fill('[name="username"]', config.username);
    
    await page.click('[name="password"]');
    await page.fill('[name="password"]', config.password);
    
    await page.click('button:has-text("Log in")');
    
    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    
    // Navigate to create post
    await page.click('a[href="#"] >> text=Create');
    
    // Wait for create modal
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    
    // Upload video
    await page.setInputFiles('input[type="file"]', config.videoPath);
    
    // Wait for upload preview
    await page.waitForSelector('button:has-text("Next")', { timeout: 30000 });
    await page.click('button:has-text("Next")');
    
    // Filters/Edit screen
    await page.waitForSelector('button:has-text("Next")', { timeout: 10000 });
    await page.click('button:has-text("Next")');
    
    // Caption screen
    await page.waitForSelector('textarea', { timeout: 10000 });
    
    // Add caption
    const fullCaption = `${config.caption}\n\n${config.hashtags.join(' ')}`;
    await page.fill('textarea', fullCaption);
    
    // Share post
    await page.click('button:has-text("Share")');
    
    // Wait for success confirmation
    await page.waitForSelector('text=Your post has been shared', { timeout: 30000 });
    
    // Extract post URL from redirect or page content
    const postUrl = page.url();
    
    return {
      success: true,
      postUrl,
      postId: extractPostId(postUrl),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error posting to Instagram',
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract Instagram post ID from URL
 * URL format: https://www.instagram.com/p/{POST_ID}/
 */
function extractPostId(url: string): string {
  const match = url.match(/\/p\/([a-zA-Z0-9_-]+)\//);
  return match ? match[1] : '';
}

/**
 * Validate Instagram credentials (optional - check login works)
 */
export async function validateInstagramCredentials(
  username: string,
  password: string
): Promise<boolean> {
  let browser;
  
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://www.instagram.com/');
    await page.click('[name="username"]');
    await page.fill('[name="username"]', username);
    
    await page.click('[name="password"]');
    await page.fill('[name="password"]', password);
    
    await page.click('button:has-text("Log in")');
    
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
