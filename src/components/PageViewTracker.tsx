'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const path = pathname;
    const url = `/api/traffic/pixel?path=${encodeURIComponent(path)}&ts=${Date.now()}`;
    
    console.log('[PageViewTracker] Tracking page view:', path);
    
    const img = new Image();
    img.onload = () => console.log('[PageViewTracker] Pixel loaded');
    img.onerror = () => console.error('[PageViewTracker] Pixel failed to load');
    img.src = url;
  }, [pathname]);

  return null;
}
