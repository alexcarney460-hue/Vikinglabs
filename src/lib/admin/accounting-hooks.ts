'use client';

import { useState, useEffect, useCallback } from 'react';

export function useAccountingFetch<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) throw new Error(json.error || 'Failed');
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

export function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtNum(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}
