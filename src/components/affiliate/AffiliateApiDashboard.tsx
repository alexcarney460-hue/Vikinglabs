'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ApiKeyStatus = {
  last4?: string;
  scopes?: string[];
  createdAt?: string;
  revokedAt?: string | null;
};

type SalesData = {
  orders: number;
  revenueCents: number;
  revenueFormatted: string;
  commissionRate: string;
  commissionCents: number;
  commissionFormatted: string;
  payoutStatus: string;
};

type ShoppingData = {
  clicks: number;
  orders: number;
  revenueCents: number;
  revenueFormatted: string;
};

export default function AffiliateApiDashboard() {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [shoppingData, setShoppingData] = useState<ShoppingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [keyRes, salesRes, shoppingRes] = await Promise.all([
        fetch('/api/affiliate/api-key'),
        fetch('/api/affiliate/sales'),
        fetch('/api/affiliate/shopping'),
      ]);

      if (keyRes.ok) {
        const keyData = await keyRes.json();
        setApiKeyStatus(keyData.data || keyData.apiKey || null);
      }

      if (salesRes.ok) {
        const sData = await salesRes.json();
        setSalesData(sData.data);
      }

      if (shoppingRes.ok) {
        const shData = await shoppingRes.json();
        setShoppingData(shData.data);
      }
    } catch (err) {
      setError(String(err));
      console.error('Failed to fetch affiliate data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRotateKey() {
    try {
      setKeyLoading(true);
      const res = await fetch('/api/affiliate/api-key', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setGeneratedKey(data.apiKey);
        setApiKeyStatus({
          last4: data.last4,
          scopes: data.scopes,
          createdAt: new Date().toISOString(),
        });
      } else {
        setError('Failed to generate API key');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setKeyLoading(false);
    }
  }

  async function handleRevokeKey() {
    if (!confirm('Are you sure? This will revoke your current API key.')) return;
    try {
      setKeyLoading(true);
      const res = await fetch('/api/affiliate/api-key', { method: 'DELETE' });
      if (res.ok) {
        setApiKeyStatus(null);
        setGeneratedKey(null);
        setShowApiKey(false);
      } else {
        setError('Failed to revoke API key');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setKeyLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Loading Affiliate API…</p>
      </div>
    );
  }

  if (error && !salesData && !shoppingData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h3 className="font-bold text-red-900">Error</h3>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* API Key Management */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">API Key Management</h2>

        {generatedKey && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">⚠️ Save your API key securely</p>
            <p className="mt-1 text-sm text-amber-800">
              You will not be able to view this key again. Store it securely—treat it like a password.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-xs text-slate-900">
                {generatedKey}
              </code>
              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="rounded bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {apiKeyStatus && !generatedKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Current API Key</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
                sk_****{apiKeyStatus.last4}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                Created: {apiKeyStatus.createdAt ? new Date(apiKeyStatus.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
              <div className="mt-3 flex gap-2">
                <p className="text-xs font-semibold text-slate-600">Scopes:</p>
                <div className="flex flex-wrap gap-1">
                  {apiKeyStatus.scopes?.map((scope) => (
                    <span
                      key={scope}
                      className="inline-block rounded bg-slate-200 px-2 py-1 text-xs text-slate-700"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRotateKey}
                disabled={keyLoading}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {keyLoading ? 'Rotating…' : 'Rotate Key'}
              </button>
              <button
                onClick={handleRevokeKey}
                disabled={keyLoading}
                className="rounded border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {keyLoading ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        ) : !apiKeyStatus && !generatedKey ? (
          <button
            onClick={handleRotateKey}
            disabled={keyLoading}
            className="rounded bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {keyLoading ? 'Generating…' : 'Generate API Key'}
          </button>
        ) : null}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Shopping Activity */}
        {shoppingData && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Shopping Activity</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Referral Clicks</span>
                <span className="text-2xl font-bold text-slate-900">{shoppingData.clicks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Attributed Orders</span>
                <span className="text-2xl font-bold text-slate-900">{shoppingData.orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Revenue</span>
                <span className="text-2xl font-bold text-green-600">{shoppingData.revenueFormatted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sales Stats */}
        {salesData && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">Sales Stats</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Commission Rate</span>
                <span className="text-lg font-bold text-slate-900">{salesData.commissionRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Commission Earned</span>
                <span className="text-2xl font-bold text-amber-600">{salesData.commissionFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Payout Status</span>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                  {salesData.payoutStatus}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Documentation */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">API Documentation</h2>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-slate-900">Authentication</h3>
            <p className="mt-1 text-slate-600">Use your API key in the Authorization header:</p>
            <code className="mt-2 block rounded bg-slate-100 p-3 font-mono text-xs">
              Authorization: Bearer sk_your_api_key
            </code>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900">Endpoints</h3>
            <ul className="mt-2 space-y-2 text-slate-700">
              <li>
                <strong>GET /api/affiliate/shopping</strong>
                <p className="text-xs text-slate-600">Referral traffic and attributed orders</p>
              </li>
              <li>
                <strong>GET /api/affiliate/sales</strong>
                <p className="text-xs text-slate-600">Revenue, commission, and payouts</p>
              </li>
              <li>
                <strong>GET /api/affiliate/assets</strong>
                <p className="text-xs text-slate-600">Marketing toolkit and brand assets</p>
              </li>
              <li>
                <strong>GET/POST /api/affiliate/tracker/stacks</strong>
                <p className="text-xs text-slate-600">Research tracking stacks (personal notes)</p>
              </li>
              <li>
                <strong>GET/POST /api/affiliate/tracker/entries</strong>
                <p className="text-xs text-slate-600">Tracker entries (dosage, notes)</p>
              </li>
            </ul>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900">Example Request</h3>
            <code className="mt-2 block rounded bg-slate-100 p-3 font-mono text-xs">
              {`curl -H "Authorization: Bearer sk_..." \\
  https://vikinglabs.co/api/affiliate/sales`}
            </code>
          </div>
        </div>
      </div>

      {/* Toolkit & Tracker */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Tools & Resources</h2>

        <div className="space-y-3">
          <Link
            href="#"
            className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
          >
            <h3 className="font-semibold text-slate-900">Marketing Toolkit</h3>
            <p className="text-xs text-slate-600 mt-1">
              Download logos, templates, captions, and brand guidelines
            </p>
          </Link>

          <Link
            href="#"
            className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
          >
            <h3 className="font-semibold text-slate-900">Research Tracker</h3>
            <p className="text-xs text-slate-600 mt-1">
              Track stacks and personal research notes for your own reference
            </p>
          </Link>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="rounded-lg bg-blue-50 p-6 border border-blue-200">
        <p className="text-xs text-blue-900">
          <strong>Research & Compliance:</strong> The Tracker is for personal research notes only. 
          All content is research-grade and not intended as medical advice. Viking Labs does not 
          provide medical guidance or dosing recommendations.
        </p>
      </div>
    </div>
  );
}
