import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import SocialConnectionsClient from './SocialConnectionsClient';

export default async function SocialConnectionsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/account/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Connections</h1>
        <p className="text-gray-600 mt-2">Manage your Instagram and TikTok accounts for automated posting</p>
      </div>

      <SocialConnectionsClient />
    </div>
  );
}
