'use client';

import { useEffect, useState } from 'react';
import { VideoUploadForm } from './VideoUploadForm';

interface ComplianceData {
  risk_score: number;
  flags: string[];
  notes: string;
}

interface ContentItem {
  id: string;
  platform: string;
  format: string;
  hook: string;
  caption: string;
  hashtags: string[];
  compliance: ComplianceData;
  status: string;
  created_at: string;
  views?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
  engagement_rate?: number | null;
  posted_at?: string | null;
  platform_post_id?: string | null;
  platform_post_url?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-800',
  approved: 'bg-green-100 text-green-800',
  posted: 'bg-blue-100 text-blue-800',
  killed: 'bg-red-100 text-red-800',
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-black text-white',
  instagram: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white',
};

export function MarketingClient() {
  const [status, setStatus] = useState<string>('draft');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [selectedForUpload, setSelectedForUpload] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [status]);

  async function loadContent() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/marketing/content?status=${status}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load content');
      }
      const data = await res.json();
      setContent(data.content || []);
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/admin/marketing/content?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      // If approving, auto-generate video + post
      if (newStatus === 'approved') {
        await generateAndPostVideo(id);
      }

      // Reload content
      await loadContent();
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function generateAndPostVideo(id: string) {
    try {
      const genRes = await fetch(`/api/admin/marketing/content/generate-and-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: id,
          template: 'bold_minimal_v1',
          primaryColor: '#000000',
          accentColor: '#FFFFFF',
        }),
      });

      if (!genRes.ok) {
        const genData = await genRes.json();
        throw new Error(`${genData.error} (${genData.stage})`);
      }

      const genResult = await genRes.json();
      setError(`✅ Video generated and posted! URL: ${genResult.postUrl}`);
    } catch (err) {
      setError(`Auto-generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex gap-2">
        {['draft', 'approved', 'posted', 'killed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              status === s
                ? 'bg-amber-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <p className="text-slate-500">Loading...</p>}

      {/* Content List */}
      {!loading && content.length === 0 && (
        <p className="text-slate-500">No content in {status} status.</p>
      )}

      {!loading && content.length > 0 && (
        <div className="space-y-4">
          {content.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-2">
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${
                      PLATFORM_COLORS[item.platform] || 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {item.platform.toUpperCase()}
                  </span>
                  <span className={`rounded-md px-3 py-1 text-xs font-semibold ${STATUS_COLORS[item.status] || ''}`}>
                    {item.status}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Content */}
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600">HOOK</p>
                  <p className="mt-1 text-sm text-slate-900">{item.hook}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">CAPTION</p>
                    <button
                      onClick={() => copyToClipboard(item.caption)}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-900">{item.caption}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">HASHTAGS</p>
                    <button
                      onClick={() => copyToClipboard(item.hashtags.join(' '))}
                      className="text-xs text-amber-600 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-900">{item.hashtags.join(' ')}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600">COMPLIANCE</p>
                  <p className="mt-1 text-sm">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        item.compliance.risk_score > 0.7
                          ? 'bg-red-100 text-red-700'
                          : item.compliance.risk_score > 0.4
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      Risk: {(item.compliance.risk_score * 100).toFixed(0)}%
                    </span>
                  </p>
                  {item.compliance.notes && (
                    <p className="mt-2 text-xs text-slate-600">{item.compliance.notes}</p>
                  )}
                </div>

                {(item.views != null ||
                  item.likes != null ||
                  item.comments != null ||
                  item.shares != null ||
                  item.saves != null ||
                  item.engagement_rate != null) && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600">METRICS</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      {item.views != null && (
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <span className="text-xs text-slate-600">Views:</span>{' '}
                          <span className="font-semibold text-slate-900">{item.views.toLocaleString()}</span>
                        </div>
                      )}
                      {item.likes != null && (
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <span className="text-xs text-slate-600">Likes:</span>{' '}
                          <span className="font-semibold text-slate-900">{item.likes.toLocaleString()}</span>
                        </div>
                      )}
                      {item.shares != null && (
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <span className="text-xs text-slate-600">Shares:</span>{' '}
                          <span className="font-semibold text-slate-900">{item.shares.toLocaleString()}</span>
                        </div>
                      )}
                      {item.saves != null && (
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <span className="text-xs text-slate-600">Saves:</span>{' '}
                          <span className="font-semibold text-slate-900">{item.saves.toLocaleString()}</span>
                        </div>
                      )}
                      {item.engagement_rate != null && (
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <span className="text-xs text-slate-600">Engagement:</span>{' '}
                          <span className="font-semibold text-slate-900">{(item.engagement_rate * 100).toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                {status === 'draft' && (
                  <button
                    onClick={() => updateStatus(item.id, 'approved')}
                    disabled={updating[item.id]}
                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating[item.id] ? 'Generating & Posting...' : 'Approve & Auto-Generate'}
                  </button>
                )}

                {status === 'approved' && (
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-200">
                    ✅ Video generated & posted!
                  </div>
                )}

                {status === 'posted' && item.platform_post_url && (
                  <a
                    href={item.platform_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    View on Instagram →
                  </a>
                )}

                {status !== 'killed' && status !== 'posted' && (
                  <button
                    onClick={() => updateStatus(item.id, 'killed')}
                    disabled={updating[item.id]}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Kill
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
