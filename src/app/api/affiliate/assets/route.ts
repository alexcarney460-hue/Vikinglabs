import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { hasUserEmail } from '@/lib/session-guards';
import {
  listAffiliateApplications,
  getAffiliateApiKeyByHash,
} from '@/lib/affiliates';

function extractApiKey(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Marketing assets toolkit manifest.
 * Defines branding, templates, and downloadable assets.
 */
const TOOLKIT_MANIFEST = {
  version: '1.0.0',
  lastUpdated: '2024-01-01T00:00:00Z',
  branding: {
    logo: {
      full: '/assets/logo-full.svg',
      icon: '/assets/logo-icon.svg',
      description: 'Full logo with text',
    },
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#f59e0b',
      neutral: '#64748b',
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      headingSize: '32px',
      bodySize: '16px',
    },
  },
  captionTemplates: [
    {
      id: 'intro',
      title: 'Intro to Viking Labs',
      template:
        'Discover premium research-grade supplements at Viking Labs. Use my affiliate code {{AFFILIATE_CODE}} for exclusive benefits.',
    },
    {
      id: 'product-highlight',
      title: 'Product Highlight',
      template:
        'Loving {{PRODUCT_NAME}} from Viking Labs. Top quality, lab-verified. Check it out with code {{AFFILIATE_CODE}}.',
    },
    {
      id: 'limited-offer',
      title: 'Limited Offer',
      template:
        'My followers get special treatment at Viking Labs. Use {{AFFILIATE_CODE}} for your next order.',
    },
  ],
  layouts: [
    {
      id: 'story-carousel',
      title: 'Instagram Story Carousel',
      description: '5-slide carousel template for Instagram Stories',
      slides: [
        { title: 'Intro', dimensions: '1080x1920px' },
        { title: 'Product', dimensions: '1080x1920px' },
        { title: 'Benefits', dimensions: '1080x1920px' },
        { title: 'Code', dimensions: '1080x1920px' },
        { title: 'CTA', dimensions: '1080x1920px' },
      ],
    },
    {
      id: 'tiktok-post',
      title: 'TikTok Post',
      description: 'Vertical video template',
      dimensions: '1080x1920px',
    },
    {
      id: 'instagram-post',
      title: 'Instagram Feed Post',
      description: 'Square post for grid',
      dimensions: '1080x1080px',
    },
  ],
  downloadableAssets: [
    {
      id: 'logo-full',
      name: 'Full Logo',
      format: 'SVG',
      size: '250 KB',
      url: '/assets/downloads/logo-full.svg',
    },
    {
      id: 'logo-icon',
      name: 'Logo Icon',
      format: 'PNG',
      size: '50 KB',
      url: '/assets/downloads/logo-icon.png',
    },
    {
      id: 'brand-guidelines',
      name: 'Brand Guidelines PDF',
      format: 'PDF',
      size: '2 MB',
      url: '/assets/downloads/brand-guidelines.pdf',
    },
    {
      id: 'story-template',
      name: 'Instagram Story Template',
      format: 'PSD',
      size: '45 MB',
      url: '/assets/downloads/story-template.psd',
    },
  ],
  socialMediaGuide: {
    instagram: {
      bestTimes: ['Tuesday-Thursday, 10-11 AM'],
      hashtagSuggestions: [
        '#VikingLabs',
        '#ResearchSupplements',
        '#LabVerified',
        '#AffiliatePartner',
      ],
      caption: 'Keep captions 125-150 characters for best engagement',
    },
    tiktok: {
      bestTimes: ['Thursday-Saturday, 6-10 PM'],
      soundSuggestions: ['Trending audio clips during posting'],
      hashtagSuggestions: [
        '#VikingLabs',
        '#Supplements',
        '#ResearchBackedWellness',
      ],
    },
    twitter: {
      characterLimit: 280,
      hashtags: ['#VikingLabs', '#ResearchSupplements'],
    },
  },
};

/**
 * GET /api/affiliate/assets
 * Get marketing toolkit manifest and asset URLs.
 * Auth: Session or API key
 */
export async function GET(request: NextRequest) {
  try {
    let affiliateId: string | null = null;

    // Try API key auth first
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const apiKey = extractApiKey(authHeader);
      if (apiKey) {
        const crypto = require('crypto');
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const keyRecord = await getAffiliateApiKeyByHash(keyHash);
        
        if (!keyRecord || keyRecord.revokedAt) {
          return NextResponse.json(
            { ok: false, error: 'Invalid or revoked API key' },
            { status: 401 }
          );
        }

        affiliateId = keyRecord.affiliateId;
      }
    }

    // Fall back to session auth
    if (!affiliateId) {
      const session = await getServerSession(authOptions);
      if (!hasUserEmail(session)) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const allAffiliates = await listAffiliateApplications('approved');
      const affiliate = allAffiliates.find((a) => a.email === session.user.email);

      if (!affiliate) {
        return NextResponse.json(
          { ok: false, error: 'Not an approved affiliate' },
          { status: 403 }
        );
      }

      affiliateId = affiliate.id;
    }

    return NextResponse.json({
      ok: true,
      toolkit: TOOLKIT_MANIFEST,
      note: 'All asset URLs are relative to the site domain. Prepend the site URL when downloading.',
    });
  } catch (error) {
    console.error('Failed to fetch toolkit assets:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
