'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

const NewsletterForm = dynamic(() => import('./forms/NewsletterForm'), { ssr: false });

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-12 text-sm text-slate-500">
      <div className="container mx-auto grid gap-12 px-6 lg:grid-cols-4">
        {/* About */}
        <div className="space-y-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-slate-900 hover:text-amber-600 transition-colors">
            VIKING LABS
          </Link>
          <p className="max-w-xs leading-relaxed text-slate-600">
            Premium research peptides for laboratory use only. Analytically verified for purity and consistency.
          </p>
        </div>

        {/* Shop */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Shop</h4>
          <ul className="space-y-2">
            <li><Link href="/catalog" className="hover:text-amber-600 transition-colors">All Products</Link></li>
            <li><Link href="/lab-tests" className="hover:text-amber-600 transition-colors">Lab Reports</Link></li>
            <li><Link href="/wholesale" className="hover:text-amber-600 transition-colors">Wholesale / Bulk</Link></li>
            <li><Link href="/affiliates" className="hover:text-amber-600 transition-colors">Affiliate Program</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Support</h4>
          <ul className="space-y-2">
            <li><Link href="/faq" className="hover:text-amber-600 transition-colors">FAQ</Link></li>
            <li><Link href="/shipping" className="hover:text-amber-600 transition-colors">Shipping Policy</Link></li>
            <li><Link href="/contact" className="hover:text-amber-600 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Stay Updated</h4>
          <NewsletterForm />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              For laboratory research use only · Not for human consumption
            </p>
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Viking Labs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
