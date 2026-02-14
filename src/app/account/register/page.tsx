import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-lg">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Create account</h1>
      <p className="mt-2 text-slate-600">Accounts are created during sign-in (Google/Apple/Facebook/TikTok).</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          href="/account/login"
          className="inline-flex w-full justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm hover:bg-amber-600"
        >
          Go to sign-in
        </Link>
      </div>
    </div>
  );
}
