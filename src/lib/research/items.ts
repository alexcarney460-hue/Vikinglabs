import { products } from '@/app/catalog/data';

export type ResearchItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  productSlug?: string;
  publicUrl?: string; // optional PDF/COA url in /public
};

// MVP: A lightweight public research index.
// Later: move to DB + admin upload workflow.
export const researchItems: ResearchItem[] = [
  {
    id: 'getting-started-coas',
    title: 'How to Read a COA (Certificate of Analysis)',
    summary: 'A plain-English guide to purity %, HPLC, LC-MS, residual solvents, and what matters for lab documentation.',
    tags: ['COA', 'Quality', 'HPLC', 'LC-MS'],
  },
  {
    id: 'handling-storage',
    title: 'Handling & Storage Best Practices',
    summary: 'Shipping, storage temperatures, light exposure, reconstitution considerations, and general lab handling reminders.',
    tags: ['Storage', 'Handling', 'Stability'],
  },

  // PDFs (hosted in /public/research). Note: some sources are living documents; this library is a snapshot.
  {
    id: 'sharps-disposal-fda-handout',
    title: "FDA — Safe Disposal of Needles and Other Sharps (Do's and Don'ts)",
    summary:
      'FDA printable handout covering home/travel sharps disposal best practices to reduce needle-stick injuries.',
    tags: ['Best practices', 'Safety', 'Sharps', 'FDA', 'Injection'],
    publicUrl: '/research/fda-sharps-dos-donts.pdf',
  },
  {
    id: 'subcutaneous-injection-mskcc',
    title: 'MSKCC — How to Give Yourself a Subcutaneous Injection (Printable)',
    summary: 'Clinic-grade step-by-step subcutaneous injection technique and disposal guidance.',
    tags: ['Best practices', 'Injection', 'Subcutaneous', 'Patient education'],
    publicUrl: '/research/mskcc-subcutaneous-injection.pdf',
  },
  {
    id: 'wada-prohibited-list-2026',
    title: 'WADA — 2026 Prohibited List (PDF)',
    summary:
      'Primary-source list of prohibited substances/methods for tested athletes (includes peptide hormones/growth factors categories).',
    tags: ['Legal', 'WADA', 'Sports', 'Anti-doping'],
    publicUrl: '/research/wada-prohibited-list-2026.pdf',
  },

  ...products.map((p) => ({
    id: `product-${p.slug}-overview`,
    title: `${p.name} — Research Overview`,
    summary: p.research,
    tags: ['Product', p.category],
    productSlug: p.slug,
  })),
];
