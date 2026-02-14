'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const path = pathname;
    const img = new Image();
    img.src = `/api/traffic/pixel?path=${encodeURIComponent(path)}&ts=${Date.now()}`;
  }, [pathname]);

  return null;
}
