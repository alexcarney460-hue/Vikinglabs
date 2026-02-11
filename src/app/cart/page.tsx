'use client';

/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';

export default function CartPage() {
  const { items, removeItem, total, clearCart } = useCart();
  const hasAutoship = items.some((item) => item.plan === 'autoship');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <div className="text-center p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
          <p className="mt-2 text-slate-500">Looks like you haven't added any research compounds yet.</p>
          <Link 
            href="/catalog" 
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-amber-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:-translate-y-0.5"
          >
            Start Browsing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Shopping Cart</h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}-${item.plan}`} className="flex gap-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{item.name}</h3>
                      <p className="text-sm text-slate-500 font-medium">{item.size} Vial</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-slate-200">
                        {item.plan === 'autoship' ? 'Autoship · 10% Off' : 'One-Time'}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-500">
                      Quantity: <span className="font-bold text-slate-900">{item.quantity}</span>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id, item.size, item.plan)}
                      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={clearCart}
              className="text-sm font-medium text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-4"
            >
              Clear Shopping Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm border-b border-slate-100 pb-6 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  {total > 200 ? (
                    <span className="font-bold text-green-600">Free</span>
                  ) : (
                    <span className="font-medium text-slate-900">$15.00</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-2xl font-extrabold text-amber-600">
                  ${(total + (total > 200 ? 0 : 15)).toFixed(2)}
                </span>
              </div>
              
              <Link 
                href="/checkout"
                className="block w-full rounded-xl bg-slate-900 py-4 text-center text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5"
              >
                Proceed to Checkout
              </Link>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure 256-bit SSL Encrypted Payment
              </div>

              <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-900 text-center font-semibold uppercase tracking-wide">
                Laboratory research use only · Not for human consumption · Adult signature required on delivery
                {hasAutoship && (
                  <span className="block text-[11px] text-amber-800 normal-case mt-2 font-normal">
                    Autoship items renew every 30 days. 10% loyalty discount stays active until you cancel.
                  </span>
                )}
              </div>
              <p className="mt-4 text-[11px] text-slate-400 text-center">
                Orders over $200 ship free via insured Priority Mail. Standard shipping is a flat $15 and includes discreet packaging.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
