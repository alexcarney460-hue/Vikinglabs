import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { listAdminProducts, upsertProductOverride } from '@/lib/products-admin';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  const products = await listAdminProducts();
  return NextResponse.json({ ok: true, products });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const body = await req.json();

    // Support both single update (legacy) and batch updates
    const updates = body.updates || (body.productId ? [body] : []);

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ ok: false, error: 'No updates provided' }, { status: 400 });
    }

    const results = [];

    for (const update of updates) {
      const productId = String(update.productId || update.id || '');
      if (!productId) continue;

      const enabled = update.enabled;
      const price = update.price ?? update.overridePrice;
      const inventory = update.inventory;
      const image = update.image;

      const updated = await upsertProductOverride({
        productId,
        enabled: typeof enabled === 'boolean' ? enabled : undefined,
        price: price === null || price === undefined || price === '' ? null : Number(price),
        inventory: inventory === null || inventory === undefined || inventory === '' ? null : Number(inventory),
        image: image !== undefined ? image : undefined,
      });

      results.push(updated);
    }

    return NextResponse.json({ ok: true, overrides: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update products';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
