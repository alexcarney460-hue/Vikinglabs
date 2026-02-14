export type AdminNavItem = {
  label: string;
  href: string;
  /**
   * If true, the item is only active on an exact pathname match.
   * Defaults to false (prefix match).
   */
  exact?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Library Admin', href: '/account/admin/library' },
  { label: 'Admin Settings', href: '/account/admin/settings' },
  { label: 'Analytics', href: '/account/admin/analytics' },
  { label: 'Accounting', href: '/account/admin/accounting' },
  { label: 'Affiliate Applications', href: '/account/admin/affiliates', exact: true },
  { label: 'Approved Affiliates', href: '/account/admin/affiliates/approved' },
];

export function isActiveAdminPath(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
