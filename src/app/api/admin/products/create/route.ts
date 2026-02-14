import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createProduct } from '@/lib/products-storage';
import type { Product } from '@/app/catalog/data';

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const body = await req.json();

    const { id, slug, name, price, category, image, desc, research } = body;

    // Validate required fields
    if (!id || !slug || !name || price === undefined || !category) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: id, slug, name, price, category' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: Product['category'][] = ['TYPE I', 'TYPE II', 'TYPE III', 'BLEND', 'ADVANCED'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { ok: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate ID format (lowercase letters, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(id)) {
      return NextResponse.json(
        { ok: false, error: 'Product ID must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Validate slug format (same as ID)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { ok: false, error: 'Product slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const product = await createProduct({
      id,
      slug,
      name,
      price: Number(price),
      category,
      image: image || '/products/placeholder.png',
      desc: desc || '',
      research: research || '',
    });

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create product';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
