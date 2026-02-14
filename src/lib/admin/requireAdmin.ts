import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authjs/options';

export type AdminSession = {
  user: {
    email?: string | null;
    role?: string;
  };
};

export async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as AdminSession | null;
  const role = session?.user?.role ?? 'user';

  if (!session?.user) {
    return { ok: false as const, status: 401 as const, session: null };
  }

  if (role !== 'admin') {
    return { ok: false as const, status: 403 as const, session };
  }

  return { ok: true as const, status: 200 as const, session };
}
