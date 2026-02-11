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
  ...products.map((p) => ({
    id: `product-${p.slug}-overview`,
    title: `${p.name} — Research Overview`,
    summary: p.research,
    tags: ['Product', p.category],
    productSlug: p.slug,
  })),
];
