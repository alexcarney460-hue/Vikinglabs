import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';
import Link from 'next/link';
import { MarketingClient } from './MarketingClient';

export const metadata = {
  title: 'Marketing Hub | Admin',
  description: 'Manage marketing content queue',
};

export default async function MarketingAdminPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;

  // Check admin role
  if (!user || (user?.role ?? 'user') !== 'admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
        <h2 className="text-lg font-bold text-red-900">Access Denied</h2>
        <p className="mt-2 text-sm text-red-700">You don't have permission to access the marketing hub.</p>
        <Link
          href="/account"
          className="mt-4 inline-block rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Back to Account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Marketing Content Hub</h2>
        <p className="mt-2 text-sm text-slate-600">
          Review and manage content drafts from the agent marketing system. Copy captions and hashtags, update status, or kill content.
        </p>
      </div>

      <MarketingClient />

      {/* API Documentation */}
      <div className="mt-12 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-bold text-slate-900">API Integration</h3>
        <p className="mt-2 text-sm text-slate-600">
          The marketing API is available at <code className="font-mono text-xs">/api/marketing/*</code>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Requires <code className="font-mono">x-marketing-key</code> header and{' '}
          <code className="font-mono">MARKETING_API_ENABLED=true</code> env var.
        </p>
      </div>
    </div>
  );
}
