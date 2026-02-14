'use client';

import { useMemo, useState } from 'react';

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  basePrice: number;
  adminPrice: number;
  overridePrice: number | null;
  enabled: boolean;
  inventory: number | null;
  updatedAt?: string | null;
};

type EditedProduct = {
  id: string;
  enabled?: boolean;
  overridePrice?: number | null;
  inventory?: number | null;
  image?: string | null;
};

type Props = {
  initialProducts: AdminProduct[];
};

export default function AdminProductsClient({ initialProducts }: Props) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [edited, setEdited] = useState<Map<string, EditedProduct>>(new Map());
  const [priceInput, setPriceInput] = useState<Map<string, string>>(new Map());
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    id: '',
    slug: '',
    name: '',
    price: '',
    category: 'TYPE I' as AdminProduct['category'],
    image: '',
    desc: '',
    research: '',
  });

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const hasChanges = edited.size > 0;

  function updateLocal(productId: string, patch: Partial<Pick<AdminProduct, 'enabled' | 'overridePrice' | 'inventory'>> & { image?: string | null }) {
    const existing = edited.get(productId) || { id: productId };
    const updated = { ...existing, ...patch };
    const newEdited = new Map(edited);
    newEdited.set(productId, updated);
    setEdited(newEdited);
    setStatus('idle');
  }

  async function handleImageUpload(productId: string, file: File) {
    setUploadingImage(productId);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productId', productId);

      const res = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Upload failed');

      updateLocal(productId, { image: data.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(null);
    }
  }

  async function handleCreateProduct() {
    setStatus('saving');
    setError('');

    try {
      // Validate required fields
      if (!newProduct.id || !newProduct.slug || !newProduct.name || !newProduct.price || !newProduct.category) {
        throw new Error('Please fill in all required fields (ID, slug, name, price, category)');
      }

      const res = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newProduct.id,
          slug: newProduct.slug,
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          image: newProduct.image || '/products/placeholder.png',
          desc: newProduct.desc,
          research: newProduct.research,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create product');

      // Add new product to local state
      const created: AdminProduct = {
        ...data.product,
        enabled: true,
        inventory: null,
        basePrice: data.product.price,
        overridePrice: null,
        adminPrice: data.product.price,
        updatedAt: null,
      };

      setProducts([...products, created]);
      setShowCreateForm(false);
      setNewProduct({
        id: '',
        slug: '',
        name: '',
        price: '',
        category: 'TYPE I',
        image: '',
        desc: '',
        research: '',
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to create product');
    }
  }

  async function saveChanges() {
    if (!hasChanges) return;

    setStatus('saving');
    setError('');

    try {
      const updates = Array.from(edited.values()).map((edit) => ({
        productId: edit.id,
        enabled: edit.enabled,
        overridePrice: edit.overridePrice,
        inventory: edit.inventory,
        image: edit.image,
      }));

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed');

      // Update local products with new data
      const updatedProducts = products.map((p) => {
        const edit = edited.get(p.id);
        if (!edit) return p;
        return {
          ...p,
          enabled: edit.enabled !== undefined ? edit.enabled : p.enabled,
          overridePrice: edit.overridePrice !== undefined ? edit.overridePrice : p.overridePrice,
          inventory: edit.inventory !== undefined ? edit.inventory : p.inventory,
          image: edit.image !== undefined ? edit.image || p.image : p.image,
          updatedAt: new Date().toISOString(),
        };
      });

      setProducts(updatedProducts);
      setEdited(new Map());
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to save changes');
    }
  }

  function discardChanges() {
    setEdited(new Map());
    setStatus('idle');
    setError('');
  }

  const getDisplayValue = (product: AdminProduct, field: keyof EditedProduct) => {
    const edit = edited.get(product.id);
    if (edit && field in edit && edit[field as keyof EditedProduct] !== undefined) {
      return edit[field as keyof EditedProduct];
    }
    return product[field as keyof AdminProduct];
  };

  const hasProductChanges = (productId: string) => edited.has(productId);

  return (
    <div className="grid gap-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
      )}

      {status === 'success' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Changes saved successfully!
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Products</h3>
            <p className="mt-2 text-sm text-slate-600">
              Update pricing, enable/disable items, and track inventory. (Checkout currently trusts client totals; pricing here is for admin controls + future validation.)
            </p>
          </div>
          <div className="flex gap-2">
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                + New Product
              </button>
            )}
            {hasChanges && (
              <>
                <button
                  onClick={discardChanges}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Discard
                </button>
                <button
                  onClick={saveChanges}
                  disabled={status === 'saving'}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {status === 'saving' ? 'Saving...' : `Save Changes (${edited.size})`}
                </button>
              </>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-wide text-emerald-900">Create New Product</h4>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold text-slate-700">
                Product ID <span className="text-red-500">*</span> (lowercase, no spaces)
                <input
                  type="text"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={newProduct.id}
                  onChange={(e) => setNewProduct({ ...newProduct, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="e.g. mk-677"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-slate-700">
                URL Slug <span className="text-red-500">*</span> (lowercase, no spaces)
                <input
                  type="text"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={newProduct.slug}
                  onChange={(e) => setNewProduct({ ...newProduct, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="e.g. mk-677"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-slate-700">
                Product Name <span className="text-red-500">*</span>
                <input
                  type="text"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. MK-677 (Ibutamoren)"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-slate-700">
                Price <span className="text-red-500">*</span> ($)
                <input
                  type="text"
                  inputMode="decimal"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={newProduct.price}
                  onChange={(e) => {
                    const raw = e.target.value;
                    // Allow digits, decimal point
                    if (raw === '' || /^\d+(\.\d{0,2})?$/.test(raw)) {
                      setNewProduct({ ...newProduct, price: raw });
                    }
                  }}
                  placeholder="49.99"
                  required
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-slate-700">
                Category <span className="text-red-500">*</span>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as AdminProduct['category'] })}
                  required
                >
                  <option value="TYPE I">TYPE I</option>
                  <option value="TYPE II">TYPE II</option>
                  <option value="TYPE III">TYPE III</option>
                  <option value="BLEND">BLEND</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </label>

              <label className="grid gap-1 text-xs font-bold text-slate-700">
                Image URL
                <input
                  type="text"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="/products/your-image.png"
                />
              </label>

              <label className="md:col-span-2 grid gap-1 text-xs font-bold text-slate-700">
                Description
                <textarea
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  rows={3}
                  value={newProduct.desc}
                  onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
                  placeholder="Brief product description..."
                />
              </label>

              <label className="md:col-span-2 grid gap-1 text-xs font-bold text-slate-700">
                Research Notes
                <textarea
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  rows={2}
                  value={newProduct.research}
                  onChange={(e) => setNewProduct({ ...newProduct, research: e.target.value })}
                  placeholder="What research areas is this studied for?"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreateProduct}
                disabled={status === 'saving'}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {status === 'saving' ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          {sorted.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-4 transition-colors ${
                hasProductChanges(p.id)
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {(getDisplayValue(p, 'image') as string || p.image) ? (
                      <img
                        src={getDisplayValue(p, 'image') as string || p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No image</div>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-slate-900">
                      {p.name}
                      {hasProductChanges(p.id) && <span className="ml-2 text-xs font-bold text-amber-600">● UNSAVED</span>}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">ID: {p.id} · /catalog/{p.slug} · {p.category}</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Base: ${p.basePrice.toFixed(2)}{' '}
                      {getDisplayValue(p, 'overridePrice') !== null ? (
                        <span className="font-bold text-emerald-700">
                          → Override: ${Number(getDisplayValue(p, 'overridePrice')).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500">(no override)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-4 md:items-end">
                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Enabled
                    <input
                      type="checkbox"
                      checked={Boolean(getDisplayValue(p, 'enabled') ?? p.enabled)}
                      onChange={(e) => updateLocal(p.id, { enabled: e.target.checked })}
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Price override ($)
                    <input
                      type="text"
                      inputMode="decimal"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={priceInput.get(p.id) ?? (getDisplayValue(p, 'overridePrice') !== null ? String(getDisplayValue(p, 'overridePrice')) : '')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setPriceInput(new Map(priceInput).set(p.id, raw));
                        
                        if (!raw) {
                          updateLocal(p.id, { overridePrice: null });
                        } else {
                          const parsed = parseFloat(raw);
                          if (!isNaN(parsed) && parsed >= 0) {
                            updateLocal(p.id, { overridePrice: parsed });
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value;
                        if (raw && !isNaN(parseFloat(raw))) {
                          const newInput = new Map(priceInput);
                          newInput.delete(p.id);
                          setPriceInput(newInput);
                        }
                      }}
                      placeholder={p.basePrice.toFixed(2)}
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Inventory (nullable)
                    <input
                      type="number"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={getDisplayValue(p, 'inventory') !== null ? String(getDisplayValue(p, 'inventory')) : ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!raw) {
                          updateLocal(p.id, { inventory: null });
                        } else {
                          updateLocal(p.id, { inventory: Number(raw) });
                        }
                      }}
                      placeholder="e.g. 25"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Product Image
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-semibold hover:file:bg-slate-200"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(p.id, file);
                        }
                      }}
                      disabled={uploadingImage === p.id}
                    />
                    {uploadingImage === p.id && (
                      <span className="text-xs text-amber-600">Uploading...</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Last updated: {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'} · Status:{' '}
                {Boolean(getDisplayValue(p, 'enabled') ?? p.enabled) ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
