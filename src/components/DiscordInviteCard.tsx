'use client';

import { useEffect, useState } from 'react';

export interface DiscordInviteCardProps {
  flowType?: 'affiliate' | 'customer';
  title?: string;
  description?: string;
  className?: string;
}

export default function DiscordInviteCard({
  flowType = 'customer',
  title = 'Join Our Community',
  description = 'Connect with researchers, get updates, and join discussions in the Viking Labs Discord.',
  className = '',
}: DiscordInviteCardProps) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/discord/invite?flow=${flowType}`);
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to get Discord invite');
        }

        const data = await res.json();
        setInviteUrl(data.inviteUrl);
      } catch (err: any) {
        console.error('[DiscordInviteCard] Error:', err);
        setError(err.message || 'Failed to load Discord invite');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [flowType]);

  function copyToClipboard() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-slate-200"></div>
          <div className="mt-3 h-3 w-full rounded bg-slate-200"></div>
          <div className="mt-2 h-3 w-2/3 rounded bg-slate-200"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border border-red-200 bg-red-50 p-6 ${className}`}>
        <h3 className="font-bold text-red-900">{title}</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{title}</h3>
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">Community</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
      </div>

      {inviteUrl && (
        <div className="mt-6 space-y-3">
          {/* Invite Link Display */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-600">Invite Link</p>
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-sm font-mono text-indigo-600 hover:underline"
                >
                  {inviteUrl}
                </a>
              </div>
              <button
                onClick={copyToClipboard}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-center font-bold text-white hover:from-indigo-700 hover:to-indigo-600 transition-all"
          >
            Join Discord →
          </a>

          {/* Single-Use Note */}
          <p className="text-xs text-slate-500">
            💡 <span className="font-semibold">Tip:</span> Your invite link is single-use. Share it carefully, or generate a new one by refreshing this page.
          </p>
        </div>
      )}
    </div>
  );
}
