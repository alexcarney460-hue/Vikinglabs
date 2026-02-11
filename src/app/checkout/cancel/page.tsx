import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-lg text-center space-y-6 bg-white rounded-3xl shadow p-10 border border-slate-100">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-3xl font-bold">
          !
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Payment Canceled</h1>
        <p className="text-slate-600">
          Your checkout session was canceled. You can review your cart and try again whenever you’re ready.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/checkout" className="rounded-full bg-slate-900 text-white px-8 py-3 font-bold">
            Return to Checkout
          </Link>
          <Link href="/catalog" className="text-sm text-amber-600 hover:underline">
            Back to Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
