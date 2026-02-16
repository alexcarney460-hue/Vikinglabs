import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import { getAffiliateByEmail } from '@/lib/affiliates';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function POST(req: NextRequest) {
  const bearerToken = getAuthToken(req);
  let userEmail: string | undefined;

  if (bearerToken) {
    console.warn(
      '[toolkit/videos/upload] Bearer token auth not fully implemented, falling back to session'
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
      'application/octet-stream', // Some clients send this for .mov
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
        { status: 413 }
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

    // Return response with public URL
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
  } catch (error) {
    console.error('[affiliate/toolkit/videos/upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Video upload failed';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
