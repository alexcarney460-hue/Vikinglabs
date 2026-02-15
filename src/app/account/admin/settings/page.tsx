import { listAdminProducts } from '@/lib/products-admin';
import AdminProductsClient from './AdminProductsClient';

export const revalidate = 0; // No caching - always fetch fresh data
export const dynamic = 'force-dynamic'; // Force dynamic rendering

export default async function AdminSettingsPage() {
  console.log('[AdminSettingsPage] Loading products...');
  const products = await listAdminProducts();
  console.log('[AdminSettingsPage] Loaded', products.length, 'products');

  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Admin Settings</h2>
        <p className="mt-2 text-slate-600">Manage product pricing, inventory, and availability.</p>
      </div>

      <div className="mt-8">
        <AdminProductsClient initialProducts={products} />
      </div>
    </div>
  );
}
