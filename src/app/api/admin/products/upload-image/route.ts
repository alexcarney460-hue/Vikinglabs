import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    const productId = formData.get('productId') as string;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No image file provided' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ ok: false, error: 'No productId provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'products');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedProductId = productId.replace(/[^a-z0-9-]/gi, '_');
    const filename = `${sanitizedProductId}_${timestamp}.${ext}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/uploads/products/${filename}`;

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    const message = error instanceof Error ? error.message : 'Image upload failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
