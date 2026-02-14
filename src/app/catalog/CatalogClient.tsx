'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { products } from './data';
import ProductImage from '../../components/ProductImage.jsx';

const CATEGORIES = ['TYPE I', 'TYPE II', 'TYPE III', 'BLEND', 'ADVANCED'] as const;

type CatalogClientProps = {
  initialQ?: string;
  initialCategory?: string;
};

export default function CatalogClient({ initialQ = '', initialCategory = '' }: CatalogClientProps) {
  const [search, setSearch] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState('featured');

  const filteredProducts = useMemo(() => {
    let result = products;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q) ||
          p.research.toLowerCase().includes(q)
      );
    }

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    if (sort === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name-desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [search, category, sort]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Hero - Clean White/Slate */}
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">CATALOG</h1>
          <div className="mx-auto my-6 h-1 w-24 bg-amber-500"></div>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Browse research compounds by category, search by name, and view details instantly.
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md py-6 shadow-sm">
        <div className="container mx-auto flex flex-col gap-4 px-6 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="search" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="w-full space-y-2 lg:w-48">
            <label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full space-y-2 lg:w-48">
            <label htmlFor="sort" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sort
            </label>
            <div className="relative">
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="price-asc">Price (Low–High)</option>
                <option value="price-desc">Price (High–Low)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSearch('');
              setCategory('');
              setSort('featured');
            }}
            className="h-[50px] whitespace-nowrap rounded-lg border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition-colors hover:border-amber-500 hover:text-amber-600"
          >
            Clear
          </button>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> compounds
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/catalog/${product.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] bg-slate-50 p-8 overflow-hidden">
                  {(() => {
                    const CACHE_BUST = process.env.NEXT_PUBLIC_ASSET_VERSION || '1';
                    const normalize = (path: string) => path.replace(/\?(.*)$/,'');
                    const base = normalize(product.image);
                    const withoutExt = base.replace(/\.(png|webp)$/,'');
                    // prefer optimized assets if available
                    const optimizedBase = `/optimized${base}`;
                    const optimizedWebp = `/optimized${withoutExt}.webp`;
                    const optimizedAvif = `/optimized${withoutExt}.avif`;
                    const candidates = [
                      `${optimizedAvif}?v=${CACHE_BUST}`,
                      `${optimizedWebp}?v=${CACHE_BUST}`,
                      `${optimizedBase}?v=${CACHE_BUST}`,
                      `${base}?v=${CACHE_BUST}`,
                      `${withoutExt}.v2.png?v=${CACHE_BUST}`,
                    ].filter((value, index, self) => value && self.indexOf(value) === index);
                    return <ProductImage candidates={candidates} alt={product.name} />;
                  })()}

                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full bg-white/90 backdrop-blur border border-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors">
                      {product.name}
                    </h3>
                    <span className="shrink-0 text-sm font-bold text-amber-600">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="mb-6 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {product.desc}
                  </p>

                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <span className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:border-amber-500 hover:text-amber-600">
                      View Lab Data
                    </span>
                    <span className="flex items-center justify-center rounded-lg bg-amber-500 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-transform hover:bg-amber-600 active:scale-95 shadow-md shadow-amber-500/20">
                      Add to Cart
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
