'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, DollarSign, FileText } from 'lucide-react';

interface AgreementData {
  agreement: {
    title: string;
    version: string;
    effectiveDate: string;
    sections: Section[];
  };
  affiliate: {
    id: string;
    code: string;
    currentTier: string;
    commissionRate: number;
    referredRevenue30Days: number;
  };
}

interface Section {
  id: string;
  title: string;
  content?: string;
  details?: any;
  subsections?: Subsection[];
}

interface Subsection {
  title: string;
  details: any;
}

export default function PartnerAgreement() {
  const [data, setData] = useState<AgreementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['commission-tiers', 'payout-terms']));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const res = await fetch('/api/affiliate/agreement');
        if (!res.ok) {
          throw new Error('Failed to fetch agreement');
        }
        const agreementData = await res.json();
        setData(agreementData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAgreement();
  }, []);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'Starter': 'from-blue-500 to-blue-600',
      'Growth': 'from-purple-500 to-purple-600',
      'Scale': 'from-orange-500 to-orange-600',
      'Elite': 'from-amber-500 to-amber-600',
      'Apex': 'from-red-500 to-red-600',
    };
    return colors[tier] || 'from-gray-500 to-gray-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Loading partner agreement...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Unable to Load Agreement</h3>
            <p className="text-red-800 text-sm mt-1">{error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { agreement, affiliate } = data;
  const tierName = typeof affiliate.currentTier === 'string' 
    ? affiliate.currentTier.split('-')[0].trim()
    : 'Starter';
  const gradientClass = getTierColor(tierName);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{agreement.title}</h1>
            <p className="text-gray-600 mt-1">Version {agreement.version} • Effective {agreement.effectiveDate}</p>
          </div>
          <FileText className="h-10 w-10 text-amber-600" />
        </div>
      </div>

      {/* Current Tier Card */}
      <div className={`bg-gradient-to-r ${gradientClass} rounded-xl p-8 text-white shadow-lg`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Your Tier</p>
            <h2 className="text-3xl font-bold mt-2">{typeof affiliate.currentTier === 'string' ? affiliate.currentTier : 'Starter Partner'}</h2>
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Commission Rate</p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-bold">{typeof affiliate.commissionRate === 'number' ? affiliate.commissionRate : 0}</span>
              <span className="text-2xl">%</span>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wide">30-Day Revenue</p>
            <p className="text-3xl font-bold mt-2">{formatCurrency(typeof affiliate.referredRevenue30Days === 'number' ? affiliate.referredRevenue30Days : 0)}</p>
          </div>
        </div>
      </div>

      {/* Tier Comparison Table */}
      {agreement.sections.find(s => s.id === 'commission-tiers') && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Commission Tier Structure
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tier</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Monthly Revenue</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Commission</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Key Benefits</th>
                </tr>
              </thead>
              <tbody>
                {agreement.sections
                  .find(s => s.id === 'commission-tiers')
                  ?.subsections?.map((tier, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{tier.title}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{tier.details.monthlyRevenue}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold">
                          {tier.details.commissionRate}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tier.details.benefits?.slice(0, 2).join(' • ')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agreement Sections */}
      <div className="space-y-4">
        {agreement.sections.map((section) => (
          <div key={section.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition text-left flex items-center justify-between group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition">
                {section.title}
              </h3>
              <svg
                className={`h-5 w-5 text-gray-600 transition-transform ${
                  expandedSections.has(section.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {expandedSections.has(section.id) && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-4">
                {section.content && <p className="text-gray-700">{section.content}</p>}

                {section.details && (
                  <div className="space-y-2">
                    {typeof section.details === 'string' ? (
                      <p className="text-gray-700">{section.details}</p>
                    ) : Array.isArray(section.details) ? (
                      <ul className="space-y-2">
                        {section.details.map((item, idx) => (
                          <li key={idx} className="flex gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="bg-white rounded p-4 space-y-2">
                        {Object.entries(section.details).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-sm font-semibold text-gray-900 capitalize">{key}:</p>
                            {typeof value === 'string' ? (
                              <p className="text-gray-700 text-sm">{value}</p>
                            ) : Array.isArray(value) ? (
                              <ul className="space-y-1 mt-1">
                                {value.map((item, idx) => (
                                  <li key={idx} className="text-gray-700 text-sm ml-4">
                                    • {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-700 text-sm">{JSON.stringify(value)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {section.subsections && section.subsections.length > 0 && (
                  <div className="space-y-3 mt-4">
                    {section.subsections.map((subsection, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">{subsection.title}</h4>
                        {typeof subsection.details === 'string' ? (
                          <p className="text-gray-700 text-sm">{subsection.details}</p>
                        ) : Array.isArray(subsection.details) ? (
                          <ul className="space-y-1">
                            {subsection.details.map((item, i) => (
                              <li key={i} className="text-gray-700 text-sm flex gap-2">
                                <span className="text-amber-600">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="space-y-1 text-sm">
                            {Object.entries(subsection.details).map(([key, val]) => (
                              <div key={key}>
                                <p className="font-semibold text-gray-900 capitalize text-xs">{key}:</p>
                                {typeof val === 'string' ? (
                                  <p className="text-gray-700">{val}</p>
                                ) : Array.isArray(val) ? (
                                  <ul className="ml-4 space-y-0.5">
                                    {val.map((v, i) => (
                                      <li key={i} className="text-gray-700">
                                        • {v}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-700">{JSON.stringify(val)}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex gap-3">
          <CheckCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900">You're an Approved Partner</h4>
            <p className="text-amber-800 text-sm mt-1">
              By participating in the Viking Labs Partner Program, you agree to the terms outlined above. For questions, contact support@vikinglabs.co.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
