'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'vl_age_shown';

export default function AgeVerify() {
  // show once per browser session using sessionStorage
  const [shown, setShown] = useState(false);

  useEffect(() => {
    try {
      const shownFlag = typeof window !== 'undefined' ? window.sessionStorage.getItem(SESSION_KEY) : null;
      if (!shownFlag) setShown(true);
    } catch {
      // if sessionStorage inaccessible, fall back to showing
      setShown(true);
    }
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
              onClick={() => { try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch {} setShown(false); }}
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
