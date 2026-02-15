import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { listAdminProducts, upsertProductOverride } from '@/lib/products-admin';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  console.log('[GET] Fetching products...');
  const products = await listAdminProducts();
  console.log('[GET] Returning products:', products.slice(0, 2)); // Log first 2 products
  return NextResponse.json({ ok: true, products });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: guard.status });

  try {
    const body = await req.json();
    console.log('[PATCH] Raw request body:', JSON.stringify(body, null, 2));

    // Support both single update (legacy) and batch updates
    const updates = body.updates || (body.productId ? [body] : []);

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ ok: false, error: 'No updates provided' }, { status: 400 });
    }

    console.log(`[PATCH] Processing ${updates.length} updates`);

    const results = [];

    for (const update of updates) {
      const productId = String(update.productId || update.id || '');
      if (!productId) continue;

      const enabled = update.enabled;
      const price = update.price ?? update.overridePrice;
      const inventory = update.inventory;
      const image = update.image;

      console.log(`[PATCH] Updating product ${productId}:`, { enabled, price, inventory, image });

      const upsertInput = {
        productId,
        enabled: typeof enabled === 'boolean' ? enabled : undefined,
        price: price === null || price === undefined || price === '' ? null : Number(price),
        inventory: inventory === null || inventory === undefined || inventory === '' ? null : Number(inventory),
        image: image !== undefined ? image : undefined,
      };
      
      console.log(`[PATCH] Upserting with input:`, upsertInput);

      const updated = await upsertProductOverride(upsertInput);

      console.log(`[PATCH] Updated result:`, updated);
      results.push(updated);
    }

    console.log(`[PATCH] Returning results:`, results);
    return NextResponse.json({ ok: true, overrides: results });
  } catch (error) {
    console.error('[PATCH] Error:', error);
    const message = error instanceof Error ? error.message : 'Unable to update products';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
