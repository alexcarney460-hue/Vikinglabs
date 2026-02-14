import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createLibraryArticle, listLibraryArticles } from '@/lib/library';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  const articles = await listLibraryArticles();
  return NextResponse.json({ ok: true, articles });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const body = await req.json();
    const tags = Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === 'string'
        ? body.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];

    const created = await createLibraryArticle({
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      tags,
      publicUrl: body.publicUrl,
      productSlug: body.productSlug,
    });
    return NextResponse.json({ ok: true, article: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create article';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
