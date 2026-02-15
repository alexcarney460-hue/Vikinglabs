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

type Props = {
  initialProducts: AdminProduct[];
};

export default function AdminProductsClient({ initialProducts }: Props) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [changes, setChanges] = useState<Record<string, { overridePrice?: number | null; inventory?: number | null; enabled?: boolean }>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const hasChanges = Object.keys(changes).length > 0;

  async function saveChanges() {
    if (!hasChanges) return;

    setStatus('saving');
    setError('');

    try {
      const updates = Object.entries(changes).map(([productId, change]) => ({
        productId,
        overridePrice: change.overridePrice,
        inventory: change.inventory,
        enabled: change.enabled,
      }));

      console.log('[Save] Sending:', updates);

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      console.log('[Save] Response:', { status: res.status, ok: res.ok, data });
      if (!res.ok || !data.ok) throw new Error(data.error || 'Save failed');

      // Update products with new prices/inventory
      const updatedProducts = products.map((p) => {
        const change = changes[p.id];
        if (!change) return p;
        return {
          ...p,
          overridePrice: change.overridePrice !== undefined ? change.overridePrice : p.overridePrice,
          inventory: change.inventory !== undefined ? change.inventory : p.inventory,
          enabled: change.enabled !== undefined ? change.enabled : p.enabled,
          updatedAt: new Date().toISOString(),
        };
      });

      setProducts(updatedProducts);
      setChanges({});
      setStatus('success');
      
      // Force page reload after 1 second to guarantee fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to save changes');
    }
  }

  function discardChanges() {
    setChanges({});
    setStatus('idle');
    setError('');
  }

  function updateProduct(productId: string, field: 'overridePrice' | 'inventory' | 'enabled', value: any) {
    setChanges((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  }

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
              Update pricing, enable/disable items, and track inventory.
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
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
                {status === 'saving' ? 'Saving...' : `Save Changes (${Object.keys(changes).length})`}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3">
          {sorted.map((p) => {
            const change = changes[p.id];
            const overridePrice = change?.overridePrice !== undefined ? change.overridePrice : p.overridePrice;
            const inventory = change?.inventory !== undefined ? change.inventory : p.inventory;
            const enabled = change?.enabled !== undefined ? change.enabled : p.enabled;

            return (
              <div
                key={p.id}
                className={`rounded-xl border p-4 transition-colors ${
                  change ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-black text-slate-900">
                      {p.name}
                      {change && <span className="ml-2 text-xs font-bold text-amber-600">● UNSAVED</span>}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">ID: {p.id} · /catalog/{p.slug}</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Base: ${p.basePrice.toFixed(2)}{' '}
                      {overridePrice !== null ? (
                        <span className="font-bold text-emerald-700">→ Override: ${overridePrice.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-500">(no override)</span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <label className="grid gap-1 text-xs font-bold text-slate-600">
                      Enabled
                      <input
                        type="checkbox"
                        checked={Boolean(enabled)}
                        onChange={(e) => updateProduct(p.id, 'enabled', e.target.checked)}
                      />
                    </label>

                    <label className="grid gap-1 text-xs font-bold text-slate-600">
                      Price override ($)
                      <input
                        type="text"
                        inputMode="decimal"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={overridePrice !== null ? String(overridePrice) : ''}
                        onChange={(e) => {
                          const raw = e.currentTarget.value.trim();
                          if (raw === '') {
                            updateProduct(p.id, 'overridePrice', null);
                          } else if (/^[\d.]*$/.test(raw)) {
                            // Allow any digits/decimals during typing
                            const num = parseFloat(raw);
                            if (!isNaN(num)) {
                              updateProduct(p.id, 'overridePrice', num);
                            }
                          }
                        }}
                        placeholder={p.basePrice.toFixed(2)}
                      />
                    </label>

                    <label className="grid gap-1 text-xs font-bold text-slate-600">
                      Inventory
                      <input
                        type="number"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={inventory !== null ? String(inventory) : ''}
                        onChange={(e) => {
                          const raw = e.currentTarget.value;
                          if (raw === '') {
                            updateProduct(p.id, 'inventory', null);
                          } else {
                            updateProduct(p.id, 'inventory', parseInt(raw, 10));
                          }
                        }}
                        placeholder="e.g. 25"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
