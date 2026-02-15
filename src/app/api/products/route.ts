import { NextResponse } from 'next/server';
import { listAllProducts } from '@/lib/products-storage';
import { listProductOverrides } from '@/lib/products-admin';

export const revalidate = 0; // No caching
export const dynamic = 'force-dynamic'; // Always fresh

export async function GET() {
  try {
    console.log('[GET /api/products] Fetching...');
    const allProducts = await listAllProducts();
    console.log('[GET /api/products] Got', allProducts.length, 'products');
    
    const overrides = await listProductOverrides();
    console.log('[GET /api/products] Got overrides for', Object.keys(overrides).length, 'products:', Object.keys(overrides).slice(0, 5));

    // Apply overrides (enabled status, price, image)
    const products = allProducts.map((p) => {
      const ov = overrides[p.id];
      
      if (ov && p.id === 'bpc-157') {
        console.log('[GET /api/products] BPC-157 override:', ov);
      }
      
      // Only return enabled products
      if (ov && !ov.enabled) {
        return null;
      }

      const result = {
        ...p,
        price: ov?.price ?? p.price,
        image: ov?.image ?? p.image,
      };
      
      if (p.id === 'bpc-157') {
        console.log('[GET /api/products] BPC-157 result price:', result.price);
      }
      
      return result;
    }).filter(Boolean);

    console.log('[GET /api/products] Returning', products.length, 'products');
    return NextResponse.json({ ok: true, products });
  } catch (error) {
    console.error('[GET /api/products] Error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
