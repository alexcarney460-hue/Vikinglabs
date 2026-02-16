import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';
import { readdirSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

export const dynamic = 'force-dynamic';

// Preloaded shareable videos (3 default)
const DEFAULT_VIDEOS = [
  {
    id: 'promo-1',
    name: 'Viking Labs Introduction',
    description: 'Official brand introduction video',
    url: '/affiliate-videos/promo-1.mp4',
    duration: 60,
    uploadedBy: 'system',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'promo-2',
    name: 'Quality & Testing Process',
    description: 'Deep dive into our lab testing procedures',
    url: '/affiliate-videos/promo-2.mp4',
    duration: 120,
    uploadedBy: 'system',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'promo-3',
    name: 'Affiliate Program Benefits',
    description: 'What you earn and how the program works',
    url: '/affiliate-videos/promo-3.mp4',
    duration: 90,
    uploadedBy: 'system',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
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
  const bearerToken = getAuthToken(req);
  let userEmail: string | undefined;

  if (bearerToken) {
    console.warn(
      '[toolkit/videos] Bearer token auth not fully implemented, falling back to session'
    );
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
    const affiliate = await getAffiliateByEmail(userEmail);
    if (!affiliate) {
      return NextResponse.json(
        { ok: false, error: 'Not an approved affiliate' },
        { status: 403 }
      );
    }

    // Get default videos + affiliate's uploaded videos
    const uploadedDir = join(process.cwd(), 'public', 'affiliate-videos');
    let affiliateVideos: any[] = [];

    if (existsSync(uploadedDir)) {
      try {
        const files = readdirSync(uploadedDir);
        affiliateVideos = files
          .filter((file) => file.startsWith(affiliate.id + '_'))
          .map((file) => {
            // Parse video info from filename
            const parts = file.split('_');
            const randomId = parts[parts.length - 1].split('.')[0];
            const sanitized = parts.slice(1, -2).join('-');
            const timestamp = parts[parts.length - 2];

            return {
              id: randomId,
              name: sanitized.replace(/-/g, ' '),
              description: 'Affiliate uploaded video',
              url: `/affiliate-videos/${file}`,
              uploadedBy: affiliate.id,
              createdAt: new Date(parseInt(timestamp)).toISOString(),
              filename: file,
            };
          });
      } catch (error) {
        console.error('[toolkit/videos] Error reading uploaded videos:', error);
      }
    }

    // Combine and return all videos
    const allVideos = [...DEFAULT_VIDEOS, ...affiliateVideos].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      ok: true,
      videos: allVideos,
      affiliateUploadedCount: affiliateVideos.length,
    });
  } catch (error) {
    console.error('[affiliate/toolkit/videos] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch videos' },
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

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { ok: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const filepath = join(process.cwd(), 'public', 'affiliate-videos', filename);

    if (!existsSync(filepath)) {
      return NextResponse.json(
        { ok: false, error: 'Video file not found' },
        { status: 404 }
      );
    }

    await unlink(filepath);

    return NextResponse.json({
      ok: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('[affiliate/toolkit/videos] Delete error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
