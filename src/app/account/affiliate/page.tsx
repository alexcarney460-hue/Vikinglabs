import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authjs/options';
import { listAffiliateApplications } from '@/lib/affiliates';
import AffiliateApiDashboard from '@/components/affiliate/AffiliateApiDashboard';

export const metadata = {
  title: 'Affiliate Dashboard',
  description: 'Manage your affiliate account and API key',
};

export default async function AffiliateDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    redirect('/account/login');
  }

  const userEmail: string = session.user.email;

  // Check if user is an approved affiliate
  const allAffiliates = await listAffiliateApplications('approved');
  const affiliate = allAffiliates.find((a) => a.email === userEmail);

  if (!affiliate) {
    return (
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Affiliate Dashboard</h1>
        <p className="mt-4 text-slate-600">
          You are not currently an approved affiliate. Please{' '}
          <a href="/affiliates/apply" className="text-blue-600 hover:underline">
            apply to our affiliate program
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Affiliate Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome, {affiliate.name}! Manage your API key, track stats, and access marketing tools.
        </p>
      </div>

      {/* Main Content */}
      <AffiliateApiDashboard />
    </div>
  );
}

