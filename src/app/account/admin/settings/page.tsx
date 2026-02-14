import { listAdminProducts } from '@/lib/products-admin';
import AdminProductsClient from './AdminProductsClient';

export default async function AdminSettingsPage() {
  const products = await listAdminProducts();

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
