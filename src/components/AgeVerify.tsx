'use client';

import { useEffect, useState } from 'react';

const COOKIE_NAME = 'vl_age_verified';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

export default function AgeVerify() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const ok = getCookie(COOKIE_NAME);
    if (!ok) setShown(true);
  }, []);

  if (!shown) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-slate-900 text-white rounded-b-lg p-4 flex items-center justify-between shadow-lg">
          <div className="text-sm">You must be 21+ to access this site. Please confirm you are 21 or older.</div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => { setCookie(COOKIE_NAME, '1', COOKIE_MAX_AGE); setShown(false); }}
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-amber-400"
              aria-label="Confirm you are 21 or older"
            >
              I am 21+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
