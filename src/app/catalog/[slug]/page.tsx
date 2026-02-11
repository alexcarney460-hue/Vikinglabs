'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { products } from '../data';
import { notFound } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import ProductImage from '../../../components/ProductImage.jsx';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = products.find((p) => p.slug === slug);
  const { addItem } = useCart();

  if (!product) {
    notFound();
  }

  const [selectedSize, setSelectedSize] = useState('10mL');
  const [activeTab, setActiveTab] = useState('description');
  const [isAdded, setIsAdded] = useState(false);
  const [purchasePlan, setPurchasePlan] = useState<'one-time' | 'autoship'>('one-time');

  // Calculate price based on size selection
  const basePrice = selectedSize === '15mL' ? product.price + 20 : product.price;
  const planMultiplier = purchasePlan === 'autoship' ? 0.9 : 1;
  const displayPrice = basePrice * planMultiplier;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(displayPrice.toFixed(2)),
      size: selectedSize,
      image: product.image,
      plan: purchasePlan,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white py-4">
        <div className="container mx-auto px-6 text-sm font-medium text-slate-500">
          <Link href="/" className="hover:text-amber-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/catalog" className="hover:text-amber-600">Catalog</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          
          {/* Left: Image Gallery */}
          <div className="space-y-6">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-white border border-slate-100 p-12 shadow-sm">
              {
                (() => {
                  const CACHE_BUST = process.env.NEXT_PUBLIC_ASSET_VERSION || '1';
                  const normalize = (p: string) => p.replace(/\?.*$/,'');
                  const base = normalize(product.image);
                  const bare = base.replace(/^\/products\//,'').replace(/\.(png|webp)$/,'');
                  const list = [
                    `${base}?v=${CACHE_BUST}`,
                    `/products/${bare}.png?v=${CACHE_BUST}`,
                    `/products/${bare}.webp?v=${CACHE_BUST}`,
                    `/products/${bare}.v2.png?v=${CACHE_BUST}`
                  ]
                    .map((url) => url.replace('..',''))
                    .filter((val, idx, arr) => val && arr.indexOf(val) === idx);
                  return (
                    <ProductImage
                      candidates={list}
                      alt={`${product.name} vial render`}
                    />
                  );
                })()
              }
              <div className="absolute top-6 left-6">
                <span className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                  {product.category}
                </span>
              </div>
            </div>
            
            {/* Trust Signals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">Lab Tested</p>
                  <p className="text-slate-500">99% Purity</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">USA Made</p>
                  <p className="text-slate-500">Sterile Fill</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{product.name}</h1>
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <span className="text-3xl font-bold text-amber-600">${displayPrice.toFixed(2)}</span>
              {purchasePlan === 'autoship' && (
                <span className="text-sm font-semibold text-emerald-600 line-through decoration-amber-500/70">
                  ${basePrice.toFixed(2)} one-time
                </span>
              )}
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">In Stock</span>
            </div>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              {product.desc}
            </p>

            {/* Selector */}
            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Select Size</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedSize('10mL')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all ${
                    selectedSize === '10mL'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  10mL Vial
                </button>
                <button
                  onClick={() => setSelectedSize('15mL')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all ${
                    selectedSize === '15mL'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  15mL Vial <span className="text-xs font-normal opacity-75">(+ $20)</span>
                </button>
              </div>
            </div>

            {/* Subscription Selector */}
            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Delivery Preference</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={() => setPurchasePlan('one-time')}
                  className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                    purchasePlan === 'one-time'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-bold uppercase tracking-wider">One-Time Purchase</p>
                  <p className={`mt-1 text-xs ${purchasePlan === 'one-time' ? 'text-white/80' : 'text-slate-500'}`}>
                    Pay full price, ship immediately.
                  </p>
                </button>
                <button
                  onClick={() => setPurchasePlan('autoship')}
                  className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                    purchasePlan === 'autoship'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200'
                  }`}
                >
                  <p className="text-sm font-bold uppercase tracking-wider">Autoship & Save 10%</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Recurring delivery every 30 days. Cancel anytime.
                  </p>
                </button>
              </div>
              {purchasePlan === 'autoship' && (
                <p className="mt-3 text-xs text-emerald-700 font-semibold">
                  You save ${(basePrice - displayPrice).toFixed(2)} on this vial. 10% discount locks in for the life of the subscription.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <button 
                onClick={handleAddToCart}
                className={`flex-1 rounded-xl py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 ${
                  isAdded ? 'bg-green-600 shadow-green-900/20' : 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'
                }`}
              >
                {isAdded ? 'Added to Cart!' : 'Add to Cart'}
              </button>
              <Link 
                href="/wholesale"
                className="flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              >
                Bulk Inquiry
              </Link>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 rounded-lg bg-amber-50 p-4 border border-amber-100">
              <p className="text-xs text-amber-800 font-medium text-center">
                Strictly for laboratory research use only. Not for human consumption.
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-12">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                    activeTab === 'description'
                      ? 'border-b-2 border-amber-500 text-amber-600'
                      : 'text-slate-400 hover:text-slate-600'
                  } mr-8`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('research')}
                  className={`pb-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                    activeTab === 'research'
                      ? 'border-b-2 border-amber-500 text-amber-600'
                      : 'text-slate-400 hover:text-slate-600'
                  } mr-8`}
                >
                  Research Profile
                </button>
                <button
                  onClick={() => setActiveTab('testing')}
                  className={`pb-4 text-sm font-bold uppercase tracking-wide transition-colors ${
                    activeTab === 'testing'
                      ? 'border-b-2 border-amber-500 text-amber-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Third-Party Testing
                </button>
              </div>

              <div className="py-6 text-slate-600 leading-relaxed">
                {activeTab === 'description' && (
                  <p>{product.desc} Synthesized in a cGMP facility with stringent quality controls.</p>
                )}
                {activeTab === 'research' && (
                  <div>
                    <p className="mb-4">{product.research}</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>CAS Number: Verified</li>
                      <li>Formula: Available in COA</li>
                      <li>Appearance: White lyophilized powder</li>
                    </ul>
                  </div>
                )}
                {activeTab === 'testing' && (
                  <div>
                    <p className="mb-4">Every batch undergoes rigorous HPLC and Mass Spectrometry analysis.</p>
                    <Link 
                      href="/lab-tests" 
                      className="inline-flex items-center gap-2 text-amber-600 font-bold hover:underline"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Download Certificate of Analysis (COA)
                    </Link>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
