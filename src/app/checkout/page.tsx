'use client';

import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe as StripeJs } from '@stripe/stripe-js';

const getStripe: () => Promise<StripeJs | null> = () =>
  typeof window !== 'undefined'
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
    : Promise.resolve(null);

export default function CheckoutPage() {
  const { items, total } = useCart();
  const shippingCost = total > 200 ? 0 : 15;
  const grandTotal = total + shippingCost;
  const hasAutoship = items.some((item) => item.plan === 'autoship');
  const hasOneTime = items.some((item) => item.plan === 'one-time');
  const mixedPlans = hasAutoship && hasOneTime;
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card');
  const [contactEmail, setContactEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
          <Link href="/catalog" className="text-amber-600 hover:underline mt-4 block">Return to Catalog</Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!contactEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setErrorMessage('Stripe is not ready.');
      return;
    }

    if (mixedPlans) {
      setErrorMessage('Split autoship and one-time items into separate orders.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contactEmail,
          shippingCost,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            plan: item.plan,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Checkout failed.' }));
        throw new Error(data.error || 'Checkout failed.');
      }

      const { id } = await response.json();
      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe unavailable.');

      const { error } = await (stripe as any).redirectToCheckout({ sessionId: id });
      if (error) throw error;
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unable to start checkout.';
      setErrorMessage(message);
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  };

  const handleCryptoCheckout = async () => {
    if (!contactEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    if (hasAutoship) {
      setErrorMessage('Autoship subscriptions require card payments.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/checkout/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactEmail,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            plan: item.plan,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Crypto checkout failed.' }));
        throw new Error(data.error || 'Crypto checkout failed.');
      }

      const { hosted_url } = await response.json();
      window.location.href = hosted_url;
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unable to start crypto checkout.';
      setErrorMessage(message);
      setStatus('error');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-slate-900">VIKING LABS</Link>
          <div className="text-sm font-medium text-slate-500">Secure Checkout</div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2">
          
          {/* Left: Forms */}
          <div className="space-y-8">
            
            {/* Contact */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  required
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                  Email me with news and offers
                </label>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Shipping Address</h2>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="First name" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                  <input type="text" placeholder="Last name" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                </div>
                <input type="text" placeholder="Address" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                <input type="text" placeholder="Apartment, suite, etc. (optional)" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="City" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                  <select className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white">
                    <option>State</option>
                    <option>CA</option>
                    <option>TX</option>
                    <option>NY</option>
                  </select>
                  <input type="text" placeholder="ZIP code" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                </div>
                <input type="text" placeholder="Phone" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Payment</h2>
              
              {/* Payment Toggles */}
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg border transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-amber-500 bg-amber-50 text-amber-900' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Credit Card
                </button>
                <button 
                  onClick={() => setPaymentMethod('crypto')}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg border transition-all ${
                    paymentMethod === 'crypto' 
                      ? 'border-amber-500 bg-amber-50 text-amber-900' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Bitcoin / Crypto
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <input type="text" placeholder="Card number" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 pl-10" />
                    <svg className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Expiration (MM / YY)" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                    <input type="text" placeholder="Security code" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                  </div>
                  <input type="text" placeholder="Name on card" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <div className="mx-auto h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-900">You will be redirected to Coinbase Commerce to complete your purchase securely.</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={status === 'loading' || mixedPlans}
                className="w-full rounded-xl bg-slate-900 py-4 text-lg font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {status === 'loading' ? 'Redirecting…' : `Pay with Card $${grandTotal.toFixed(2)}`}
              </button>
              <button
                onClick={handleCryptoCheckout}
                disabled={status === 'loading' || hasAutoship}
                className="w-full rounded-xl border-2 border-slate-300 bg-white py-4 text-lg font-bold text-slate-700 shadow transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                Pay with Crypto via Coinbase
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 text-center">
              Card payments handle autoship subscriptions automatically. Crypto is available for one-time orders only.
            </p>
            {hasAutoship && (
              <p className="text-[11px] text-emerald-600 text-center font-semibold uppercase tracking-[0.2em]">
                Autoship items renew every 30 days · 10% loyalty discount locked in (card payments only)
              </p>
            )}
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900 text-center">
              Research use only · Not evaluated by the FDA · Not for human consumption
            </div>

          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 sticky top-8">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Order Summary</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.plan}`} className="flex gap-4">
                    <div className="relative h-16 w-16 bg-white rounded-lg border border-slate-200 overflow-hidden shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
                      <span className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.size} • {item.plan === 'autoship' ? 'Autoship -10%' : 'One-Time'}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 mt-6 pt-6 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'Free (orders $200+)' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                {hasAutoship && (
                  <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                    <span>Autoship savings</span>
                    <span>10% locked</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200 mt-2">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Orders ship in temperature-stable packaging with tracking and adult signature verification.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
