'use client';

import Link from 'next/link';
// replaced next/image with native img to avoid runtime Image constructor issues

import { useCart } from '../context/CartContext';

export default function Header() {
  const { count, total } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white shadow-sm">
      <div className="container mx-auto flex h-24 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-16 w-40 shrink-0 transition-transform group-hover:scale-105">
            <picture>
              <source srcSet="/optimized/logo-primary-640.webp" type="image/webp" />
              <source srcSet="/optimized/logo-primary-640.avif" type="image/avif" />
              <img src="/logo-primary.png" alt="Viking Labs" width={200} height={80} className="object-contain" />
            </picture>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors">
            Home
          </Link>
          <Link href="/catalog" className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors">
            Catalog
          </Link>
          <Link href="/lab-tests" className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors">
            Lab Reports
          </Link>
          <Link href="/research" className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors">
            Research
          </Link>
          <Link href="/affiliates" className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors">
            Affiliates
          </Link>
          <Link href="/contact" className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors">
            Support
          </Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-6">
          <Link
            href="/account"
            className="hidden md:inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:border-slate-300 hover:text-amber-600 transition-colors"
          >
            Account
          </Link>
          <button className="text-slate-600 hover:text-amber-500 transition-colors" aria-label="Search">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <Link href="/cart" className="group relative flex items-center gap-2 text-slate-600 hover:text-amber-500 transition-colors">
            <div className="relative">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm group-hover:bg-amber-600 animate-in zoom-in">
                  {count}
                </span>
              )}
            </div>
            <span className="hidden lg:block text-sm font-semibold">
              ${total.toFixed(2)}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
