import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Inline toolkit manifest to avoid file I/O during build
const TOOLKIT_MANIFEST = {
  version: '1.0',
  brandAssets: [
    {
      id: 'logo-primary',
      name: 'Viking Labs Logo (Primary)',
      description: 'Full-color Viking Labs logo',
      filename: 'logo-primary.png',
      type: 'image/png',
      url: '/public/logos/logo-primary.png',
    },
    {
      id: 'logo-transparent',
      name: 'Viking Labs Logo (Transparent)',
      description: 'Logo with transparent background',
      filename: 'logo-transparent.png',
      type: 'image/png',
      url: '/public/logos/logo-transparent.png',
    },
    {
      id: 'logo-header',
      name: 'Viking Labs Header Logo',
      description: 'Wide header logo for banners and websites',
      filename: 'logo-header.png',
      type: 'image/png',
      url: '/public/logos/logo-header.png',
    },
  ],
  colorPalette: {
    primary: '#f59e0b',
    dark: '#1e293b',
    light: '#f1f5f9',
    accent: '#fbbf24',
  },
  templates: [
    {
      id: 'instagram-caption',
      name: 'Instagram Caption',
      category: 'social',
      content:
        '🧪 Peptide research just got serious.\n\nVikingLabs.co is the lab-grade resource for premium peptide compounds. Discreet shipping. Verified quality. Zero hype.\n\nGet 10% off your first order with code: [YOUR_CODE]\n\nLink in bio 🔗',
    },
    {
      id: 'facebook-post',
      name: 'Facebook Post',
      category: 'social',
      content:
        'Looking for reliable peptide research compounds?\n\nViking Labs delivers premium, lab-tested products with transparent sourcing. Fast, discreet shipping and a team that actually cares.\n\nTrust the lab-grade standard: vikinglabs.co\n\nAffiliate? Get your custom code and earn 10% on every sale.',
    },
    {
      id: 'short-bio',
      name: 'Short Bio',
      category: 'bio',
      content:
        'I recommend Viking Labs for premium peptide research compounds. Lab-grade quality, transparent sourcing, and trusted shipping. Use my code for 10% off.',
    },
    {
      id: 'email-intro',
      name: 'Email Intro Template',
      category: 'email',
      content:
        'Subject: Premium Peptide Research Compounds\n\nHey [Name],\n\nI\'ve been using Viking Labs for research compounds, and they\'re legit. Lab-tested, transparent, fast shipping.\n\nThey\'re running an affiliate program if you want to earn on sales. Here\'s my link if you want to check them out:\n\n[YOUR_AFFILIATE_LINK]\n\nUse code [YOUR_CODE] for 10% off.\n\nTalk soon,\n[Your Name]',
    },
  ],
  guidelines: {
    do: [
      'Link to vikinglabs.co with your affiliate code',
      'Mention lab-grade quality and testing',
      'Highlight fast, discreet shipping',
      'Use authentic testimonials from your audience',
      'Provide your unique discount code',
    ],
    dont: [
      'Make medical claims or suggest health benefits',
      'Imply peptides treat, cure, or prevent disease',
      'Target minors or restricted audiences',
      'Spam or use aggressive tactics',
      'Mislead about product source or quality',
    ],
    bannedWords: [
      'cure',
      'treat',
      'prevent',
      'medical',
      'therapeutic',
      'prescription',
      'FDA approved',
      'miracle',
      'breakthrough',
    ],
  },
};

// Preloaded shareable videos (3 default)
const DEFAULT_VIDEOS = [
  {
    id: 'promo-1',
    name: 'Viking Labs Introduction',
    description: 'Official brand introduction video',
    url: '/affiliate-videos/promo-1.mp4',
    duration: 60,
    uploadedBy: 'system',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  {
    id: 'promo-2',
    name: 'Quality & Testing Process',
    description: 'Deep dive into our lab testing procedures',
    url: '/affiliate-videos/promo-2.mp4',
    duration: 120,
    uploadedBy: 'system',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
  },
  {
    id: 'promo-3',
    name: 'Affiliate Program Benefits',
    description: 'What you earn and how the program works',
    url: '/affiliate-videos/promo-3.mp4',
    duration: 90,
    uploadedBy: 'system',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
];

function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(req: NextRequest) {
  // Session OR Bearer token auth
  const bearerToken = getAuthToken(req);
  let userEmail: string | undefined;

  if (bearerToken) {
    // For Bearer tokens, we'd need a token validation system
    // For now, we require Session auth, but accept Bearer tokens for API clients
    console.warn('[toolkit] Bearer token auth not fully implemented, falling back to session');
  }

  const session = await getServerSession(authOptions);
  userEmail = session?.user?.email as string | undefined;

  if (!session?.user || !userEmail) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if user is an approved affiliate
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    const manifest = TOOLKIT_MANIFEST;

    // Inject affiliate code into templates
    const enrichedTemplates = manifest.templates.map((t: any) => ({
      ...t,
      content: t.content.replace(/\[YOUR_CODE\]/g, affiliate.code || '[CODE]'),
      contentWithLink: t.content
        .replace(/\[YOUR_CODE\]/g, affiliate.code || '[CODE]')
        .replace(/\[YOUR_AFFILIATE_LINK\]/g, `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vikinglabs.co'}?ref=${affiliate.code || 'code'}`),
    }));

    // Combine default videos with affiliate's uploaded videos
    // Note: In a real implementation, we'd fetch affiliate's uploaded videos from storage
    const videos = [...DEFAULT_VIDEOS];

    return NextResponse.json({
      ok: true,
      toolkit: {
        ...manifest,
        templates: enrichedTemplates,
        videos,
        affiliateCode: affiliate.code,
      },
    });
  } catch (error) {
    console.error('[affiliate/toolkit] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch toolkit' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email as string | undefined;

  if (!session?.user || !userEmail) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    // Check if this is a video upload request
    const url = new URL(req.url);
    if (url.pathname.includes('/videos/upload')) {
      // Handle video upload
      const formData = await req.formData();
      const file = formData.get('video') as File;
      const title = (formData.get('title') as string) || 'Untitled Video';
      const description = (formData.get('description') as string) || '';

      if (!file) {
        return NextResponse.json(
          { ok: false, error: 'No video file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      const validTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
      ];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Invalid file type. Only MP4, WebM, Ogg, and QuickTime are allowed.',
          },
          { status: 400 }
        );
      }

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            ok: false,
            error: 'File too large. Maximum size is 500MB.',
          },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'affiliate-videos');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'mp4';
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(4).toString('hex');
      const sanitizedTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .slice(0, 30);
      const filename = `${affiliate.id}_${sanitizedTitle}_${timestamp}_${randomId}.${ext}`.slice(
        0,
        255
      );
      const filepath = join(uploadsDir, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Return public URL
      const publicUrl = `/affiliate-videos/${filename}`;

      return NextResponse.json({
        ok: true,
        video: {
          id: randomId,
          name: title,
          description,
          url: publicUrl,
          uploadedBy: affiliate.id,
          createdAt: new Date().toISOString(),
          filename,
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[affiliate/toolkit] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email as string | undefined;

  if (!session?.user || !userEmail) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    // Parse request body to get video filename
    const body = await req.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { ok: false, error: 'No filename provided' },
        { status: 400 }
      );
    }

    // Security: ensure the filename belongs to this affiliate
    if (!filename.startsWith(affiliate.id + '_')) {
      return NextResponse.json(
        { ok: false, error: 'Cannot delete videos from other affiliates' },
        { status: 403 }
      );
    }

    const filepath = join(process.cwd(), 'public', 'affiliate-videos', filename);

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { ok: false, error: 'Video file not found' },
        { status: 404 }
      );
    }

    // Delete the file
    await unlink(filepath);

    return NextResponse.json({
      ok: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('[affiliate/toolkit] Delete error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
