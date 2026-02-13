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
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="w-full max-w-3xl px-4 pointer-events-auto">
        <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col md:flex-row items-center gap-3 justify-between shadow-lg">
          <div className="text-sm text-center md:text-left">
            <div className="font-semibold">You must be 21+ to access this site.</div>
            <div className="text-xs text-slate-200 mt-1">For research use only. Not for human consumption.</div>
          </div>
          <div className="ml-0 md:ml-4 flex-shrink-0">
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
