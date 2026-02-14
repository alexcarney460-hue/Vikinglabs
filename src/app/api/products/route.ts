import { NextResponse } from 'next/server';
import { listAllProducts } from '@/lib/products-storage';
import { listProductOverrides } from '@/lib/products-admin';

export async function GET() {
  try {
    const allProducts = await listAllProducts();
    const overrides = await listProductOverrides();

    // Apply overrides (enabled status, price, image)
    const products = allProducts.map((p) => {
      const ov = overrides[p.id];
      
      // Only return enabled products
      if (ov && !ov.enabled) {
        return null;
      }

      return {
        ...p,
        price: ov?.price ?? p.price,
        image: ov?.image ?? p.image,
      };
    }).filter(Boolean);

    return NextResponse.json({ ok: true, products });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
