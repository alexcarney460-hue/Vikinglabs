import { listUsers } from '@/lib/users';

export default async function AdminSettingsPage() {
  const users = await listUsers();
  const admins = users.filter((u) => u.role === 'admin');

  // Avoid leaking secrets; only show whether key settings are present.
  const env = {
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
  };

  return (
    <div>
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Admin Settings</h2>
        <p className="mt-2 text-slate-600">Admin users + environment configuration status.</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Users</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{users.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase tracking-wide text-slate-500">Admins</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{admins.length}</div>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-black uppercase tracking-wide text-slate-900">Admin users</div>
          <div className="mt-1 text-sm text-slate-600">Accounts are stored via the existing users module.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users
                .slice()
                .sort((a, b) => a.email.localeCompare(b.email))
                .map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-3 font-mono text-slate-900">{u.email}</td>
                    <td className="px-6 py-3 text-slate-700">{u.name ?? '—'}</td>
                    <td className="px-6 py-3 font-bold text-slate-800">{u.role}</td>
                    <td className="px-6 py-3 text-slate-700">{new Date(u.createdAt).toLocaleString()}</td>
                  </tr>
                ))}

              {users.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-slate-600" colSpan={4}>
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Environment checks</h3>
        <p className="mt-2 text-sm text-slate-700">
          These are presence checks only (no secrets displayed).
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {Object.entries(env).map(([key, ok]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="font-mono">{key}</span>
              <span className={ok ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>
                {ok ? 'set' : 'missing'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
