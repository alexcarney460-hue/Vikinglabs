import Link from 'next/link';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-lg text-center space-y-6 bg-white rounded-3xl shadow-lg p-10 border border-slate-100">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl font-bold">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Payment Confirmed</h1>
        <p className="text-slate-600">
          Thank you for your order. You’ll receive an email confirmation once the payment clears. Autoship subscriptions will renew every 30 days.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/catalog" className="rounded-full bg-slate-900 text-white px-8 py-3 font-bold">
            Continue Shopping
          </Link>
          <Link href="/" className="text-sm text-amber-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
