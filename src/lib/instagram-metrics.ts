/**
 * Instagram Metrics Scraper
 * Scrapes public Instagram posts for @vikinglabs.co using Playwright
 * Extracts likes, comments, saves (if available), and engagement metrics
 * 
 * PHASE 2: Performance Analysis System
 */

import { chromium, Browser, Page } from 'playwright';

export interface InstagramMetrics {
  likes: number;
  comments: number;
  saves: number; // Not always visible publicly
  views: number; // For reels
  timestamp: string;
  postUrl: string;
  postId: string;
}

export interface InstagramScraperConfig {
  username?: string;
  password?: string;
  useAuth?: boolean; // Set to true if you need logged-in metrics (saves, detailed insights)
}

/**
 * Scrape metrics for a specific Instagram post
 * @param postUrl - Full Instagram post URL (e.g., https://www.instagram.com/p/ABC123/)
 * @param config - Optional auth config for authenticated scraping
 */
export async function scrapeInstagramPostMetrics(
  postUrl: string,
  config?: InstagramScraperConfig
): Promise<InstagramMetrics> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // Login if credentials provided
    if (config?.useAuth && config.username && config.password) {
      await loginToInstagram(page, config.username, config.password);
    }

    // Navigate to post
    await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // Let content load

    // Extract post ID from URL
    const postId = extractPostIdFromUrl(postUrl);

    // Extract metrics
    const metrics = await extractMetricsFromPage(page);

    return {
      ...metrics,
      postUrl,
      postId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[instagram-metrics] Scraping failed:', error);
    throw new Error(
      `Failed to scrape Instagram metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape metrics for all recent posts from a profile
 * @param username - Instagram username (without @)
 * @param limit - Maximum number of posts to scrape
 */
export async function scrapeInstagramProfilePosts(
  username: string,
  limit: number = 10
): Promise<InstagramMetrics[]> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // Navigate to profile
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Extract post URLs from grid
    const postUrls = await page.$$eval(
      'article a[href*="/p/"]',
      (elements, limitNum) => {
        return elements
          .slice(0, limitNum)
          .map((el) => (el as HTMLAnchorElement).href)
          .filter((href) => href.includes('/p/'));
      },
      limit
    );

    // Scrape each post
    const results: InstagramMetrics[] = [];
    for (const postUrl of postUrls) {
      try {
        const metrics = await scrapeInstagramPostMetrics(postUrl);
        results.push(metrics);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limit
      } catch (err) {
        console.error(`[instagram-metrics] Failed to scrape ${postUrl}:`, err);
      }
    }

    return results;
  } catch (error) {
    console.error('[instagram-metrics] Profile scraping failed:', error);
    throw new Error(
      `Failed to scrape Instagram profile: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Extract metrics from Instagram post page
 */
async function extractMetricsFromPage(page: Page): Promise<Omit<InstagramMetrics, 'postUrl' | 'postId' | 'timestamp'>> {
  const metrics = {
    likes: 0,
    comments: 0,
    saves: 0,
    views: 0,
  };

  try {
    // Try to extract likes
    // Instagram shows likes in multiple formats: "X likes", "Liked by X and Y others"
    const likeSelectors = [
      'button:has-text("likes") span',
      'a:has-text("likes")',
      'section span:has-text("likes")',
      'article section button span', // Generic like counter
    ];

    for (const selector of likeSelectors) {
      try {
        const likeText = await page.locator(selector).first().textContent({ timeout: 2000 });
        if (likeText) {
          const likeMatch = likeText.match(/([0-9,]+)\s*like/i);
          if (likeMatch) {
            metrics.likes = parseInt(likeMatch[1].replace(/,/g, ''), 10);
            break;
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    // Try to extract comments
    const commentSelectors = [
      'a:has-text("comments")',
      'a:has-text("comment")',
      'span:has-text("comments")',
    ];

    for (const selector of commentSelectors) {
      try {
        const commentText = await page.locator(selector).first().textContent({ timeout: 2000 });
        if (commentText) {
          const commentMatch = commentText.match(/([0-9,]+)\s*comment/i);
          if (commentMatch) {
            metrics.comments = parseInt(commentMatch[1].replace(/,/g, ''), 10);
            break;
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    // Try to extract views (for Reels)
    const viewSelectors = [
      'span:has-text("views")',
      'video ~ div span',
    ];

    for (const selector of viewSelectors) {
      try {
        const viewText = await page.locator(selector).first().textContent({ timeout: 2000 });
        if (viewText) {
          const viewMatch = viewText.match(/([0-9,]+)\s*view/i);
          if (viewMatch) {
            metrics.views = parseInt(viewMatch[1].replace(/,/g, ''), 10);
            break;
          }
        }
      } catch {
        // Continue to next selector
      }
    }

    // Saves are not publicly visible without auth, would need logged-in session
    // For now, we'll leave saves at 0 for public scraping

    return metrics;
  } catch (error) {
    console.error('[instagram-metrics] Metrics extraction failed:', error);
    return metrics;
  }
}

/**
 * Login to Instagram (for authenticated scraping)
 */
async function loginToInstagram(page: Page, username: string, password: string): Promise<void> {
  try {
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });

    // Check if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('/accounts/login/')) {
      throw new Error('Login failed - still on login page');
    }
  } catch (error) {
    throw new Error(`Instagram login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract post ID from Instagram URL
 */
function extractPostIdFromUrl(url: string): string {
  const match = url.match(/\/p\/([a-zA-Z0-9_-]+)\//);
  return match ? match[1] : '';
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  views: number
): number {
  const totalEngagement = likes + comments + shares + saves;
  if (views === 0) return 0;
  return totalEngagement / views;
}

/**
 * Parse Instagram shorthand numbers (e.g., "1.2K", "500M")
 */
export function parseInstagramNumber(text: string): number {
  const cleaned = text.replace(/,/g, '').trim();
  const multipliers: Record<string, number> = {
    K: 1000,
    M: 1000000,
    B: 1000000000,
  };

  const match = cleaned.match(/^([\d.]+)([KMB])?$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const multiplier = match[2] ? multipliers[match[2].toUpperCase()] : 1;

  return Math.round(value * multiplier);
}
