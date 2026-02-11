'use client';

import Link from 'next/link';
import { useState } from 'react';
// replaced next/image with native img to avoid runtime Image constructor issues

import { useCart } from '../context/CartContext';

const mobileLinks = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/research', label: 'Research Library' },
  { href: '/lab-tests', label: 'Lab Reports' },
  { href: '/account', label: 'Account' },
  { href: '/contact', label: 'Support' },
];

export default function Header() {
  const { count, total } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white shadow-sm">
      <div className="container mx-auto flex h-24 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
          <div className="relative -mt-1 h-16 w-56 shrink-0 transition-transform group-hover:scale-105">
            <img
              src="/logo-header.png"
              alt="Viking Labs"
              width={260}
              height={80}
              className="object-contain"
            />
          </div>
        </Link>

        {/* Navigation (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/catalog"
            className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors"
          >
            Catalog
          </Link>
          <Link
            href="/lab-tests"
            className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors"
          >
            Lab Reports
          </Link>
          <Link
            href="/research"
            className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors"
          >
            Research
          </Link>
          <Link
            href="/affiliates"
            className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors"
          >
            Affiliates
          </Link>
          <Link
            href="/contact"
            className="text-sm font-bold uppercase tracking-wide text-slate-700 hover:text-amber-500 transition-colors"
          >
            Support
          </Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            className="inline-flex md:hidden items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:border-slate-300"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <Link
            href="/account"
            className="hidden md:inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:border-slate-300 hover:text-amber-600 transition-colors"
          >
            Account
          </Link>

          <button className="text-slate-600 hover:text-amber-500 transition-colors" aria-label="Search">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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
            <span className="hidden lg:block text-sm font-semibold">${total.toFixed(2)}</span>
          </Link>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <nav className="container mx-auto px-6 py-4">
            <div className="grid gap-2">
              {mobileLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-800 hover:border-slate-300"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
