'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const StackOptimizer = dynamic(() => import('@/components/tools/StackOptimizer'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="text-slate-600">Loading Stack Optimizer…</div>
    </div>
  ),
});

export default function StackOptimizerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/account/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-slate-600">Loading…</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-slate-600">Redirecting…</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Stack Optimizer
        </h1>
        <p className="mt-2 text-slate-600">
          Research protocol scheduling and complexity analysis tool
        </p>
      </div>

      <StackOptimizer />
    </div>
  );
}
