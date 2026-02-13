'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV_ITEMS, isActiveAdminPath } from '@/lib/admin/nav';

export default function AdminNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="Admin" className="flex flex-wrap items-center gap-2">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActiveAdminPath(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white'
                : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300'
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
