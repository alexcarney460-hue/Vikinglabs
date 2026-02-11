'use client';

/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';

// Mock data for lab reports based on our product list
const REPORTS = [
  { id: 'LR-2026-001', product: 'BPC-157', batch: 'BPC-26A', date: 'Jan 15, 2026', purity: '99.8%', file: 'BPC-157_COA.pdf' },
  { id: 'LR-2026-002', product: 'TB-500', batch: 'TB-26A', date: 'Jan 18, 2026', purity: '99.5%', file: 'TB-500_COA.pdf' },
  { id: 'LR-2026-003', product: 'Retatrutide', batch: 'RET-26B', date: 'Feb 01, 2026', purity: '99.2%', file: 'Retatrutide_COA.pdf' },
  { id: 'LR-2026-004', product: 'Semaglutide (5mg)', batch: 'SEM-26A', date: 'Jan 10, 2026', purity: '99.9%', file: 'Semaglutide_COA.pdf' },
  { id: 'LR-2026-005', product: 'FOXO4-DRI', batch: 'FOX-26C', date: 'Feb 03, 2026', purity: '98.5%', file: 'FOXO4_COA.pdf' },
  { id: 'LR-2026-006', product: 'Ipamorelin / CJC-1295 Blend', batch: 'IC-26A', date: 'Jan 20, 2026', purity: '99.1%', file: 'IpamCJC_COA.pdf' },
  { id: 'LR-2026-007', product: 'BPC-157 / TB-500 Blend', batch: 'BT-26A', date: 'Jan 22, 2026', purity: '99.4%', file: 'Wolverine_COA.pdf' },
  { id: 'LR-2026-008', product: 'NAD+ Peptide', batch: 'NAD-26A', date: 'Jan 05, 2026', purity: '99.7%', file: 'NAD_COA.pdf' },
  { id: 'LR-2026-009', product: 'GHK-Cu', batch: 'GHK-26B', date: 'Jan 25, 2026', purity: '99.6%', file: 'GHK_COA.pdf' },
  { id: 'LR-2026-010', product: 'PT-141', batch: 'PT-26A', date: 'Jan 12, 2026', purity: '99.3%', file: 'PT141_COA.pdf' },
];

export default function LabTestsPage() {
  const [search, setSearch] = useState('');

  const filteredReports = REPORTS.filter(r => 
    r.product.toLowerCase().includes(search.toLowerCase()) || 
    r.batch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Hero - Clean White/Slate */}
      <section className="bg-white py-16 border-b border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Lab Reports</h1>
          <div className="mx-auto my-6 h-1 w-24 bg-amber-500"></div>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Transparency is our standard. Access third-party HPLC analysis and sterility reports for every batch.
          </p>
        </div>
      </section>

      {/* Search & Table */}
      <section className="py-12">
        <div className="container mx-auto px-6 max-w-5xl">
          
          {/* Controls */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-slate-900">Latest Analysis Documents</h2>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by product or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Table - Light Mode */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Batch ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Purity (HPLC)</th>
                  <th className="px-6 py-4 text-right">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {report.product}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{report.batch}</td>
                    <td className="px-6 py-4 text-slate-500">{report.date}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        {report.purity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-amber-500 hover:text-amber-600 hover:shadow-md">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredReports.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No lab reports found matching "{search}"
              </div>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="flex gap-2">
              <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              All compounds are tested by an ISO 17025 accredited third-party laboratory. Reports include HPLC chromatograms and mass spectrometry data.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
