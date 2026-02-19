/**
 * Test script for Instagram metrics scraper
 * Usage: npx tsx scripts/test-metrics-scraper.ts
 */

import { scrapeInstagramPostMetrics, scrapeInstagramProfilePosts } from '../src/lib/instagram-metrics';

async function testSinglePost() {
  console.log('🧪 Testing single post scraping...\n');
  
  // Test with a public Instagram post (replace with actual vikinglabs.co post)
  const testPostUrl = 'https://www.instagram.com/p/EXAMPLE/';
  
  try {
    console.log(`Scraping: ${testPostUrl}`);
    const metrics = await scrapeInstagramPostMetrics(testPostUrl);
    
    console.log('✅ Metrics scraped successfully:');
    console.log(JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('❌ Scraping failed:', error);
  }
}

async function testProfileScraping() {
  console.log('\n🧪 Testing profile scraping...\n');
  
  const username = 'vikinglabs.co';
  
  try {
    console.log(`Scraping recent posts from @${username}`);
    const posts = await scrapeInstagramProfilePosts(username, 3);
    
    console.log(`✅ Scraped ${posts.length} posts:`);
    posts.forEach((post, index) => {
      console.log(`\nPost ${index + 1}:`);
      console.log(`  Post ID: ${post.postId}`);
      console.log(`  Likes: ${post.likes}`);
      console.log(`  Comments: ${post.comments}`);
      console.log(`  Views: ${post.views}`);
      console.log(`  URL: ${post.postUrl}`);
    });
  } catch (error) {
    console.error('❌ Profile scraping failed:', error);
  }
}

async function main() {
  console.log('Instagram Metrics Scraper Test\n');
  console.log('================================\n');
  
  // Uncomment the test you want to run:
  
  // await testSinglePost();
  await testProfileScraping();
}

main().catch(console.error);
