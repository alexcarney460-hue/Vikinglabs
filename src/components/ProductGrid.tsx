'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductImage from './ProductImage.jsx';
import { products as defaultProducts, type Product } from '../app/catalog/data';

interface ProductGridProps {
  limit?: number;
}

export default function ProductGrid({ limit = 9 }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.ok && data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const gridItems = products.slice(0, limit);

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {gridItems.map((product) => {
        const CACHE_BUST = process.env.NEXT_PUBLIC_ASSET_VERSION || '1';
        const base = product.image.replace(/^\/products\//, '').replace(/\.(png|webp)$/,'');
        const candidates = [
          `/products/${base}.png?v=${CACHE_BUST}`,
          `/products/${base}.v2.png?v=${CACHE_BUST}`,
          `/products/${base}.webp?v=${CACHE_BUST}`,
          `/products/${base}-label.png?v=${CACHE_BUST}`
        ];

        return (
          <Link
            key={product.slug}
            href={`/catalog/${product.slug}`}
            className="group block rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <article>
              <div className="relative aspect-square bg-slate-50 rounded-t-2xl p-6 overflow-hidden">
                <ProductImage candidates={candidates} alt={`${product.name} research vial`} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm border border-slate-100">
                  Top Seller
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">{product.category}</p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">COA Ready</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">{product.desc}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-900">${product.price.toFixed(2)}+</span>
                  <span className="text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform bg-slate-100 px-3 py-1 rounded-full">View</span>
                </div>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
