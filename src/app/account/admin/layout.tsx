import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin</h1>
        <p className="mt-2 text-slate-600">Please sign in.</p>
        <div className="mt-6">
          <Link
            href="/account/login"
            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-amber-600"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if ((user?.role ?? 'user') !== 'admin') {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin</h1>
        <p className="mt-2 text-slate-600">You don’t have access to this page.</p>
        <div className="mt-6">
          <Link
            href="/account"
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-700"
          >
            Back to account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-slate-900">Admin</h1>
          <span className="hidden text-slate-300 md:inline">|</span>
          <AdminNav />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
          >
            Back to account
          </Link>
        </div>
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
