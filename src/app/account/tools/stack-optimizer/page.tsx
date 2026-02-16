import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import dynamic from 'next/dynamic';

const StackOptimizer = dynamic(() => import('@/components/tools/StackOptimizer'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="text-slate-600">Loading Stack Optimizer…</div>
    </div>
  ),
});

export const metadata = {
  title: 'Stack Optimizer - Research Protocol Scheduling',
  description: 'Plan and optimize your research protocol administration schedule.',
};

export default async function StackOptimizerPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/account/login');
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
