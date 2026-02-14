import { researchItems, type ResearchItem } from './items';
import { listLibraryArticles } from '@/lib/library';

function toResearchItem(a: Awaited<ReturnType<typeof listLibraryArticles>>[number]): ResearchItem {
  return {
    id: a.slug,
    title: a.title,
    summary: a.summary,
    tags: a.tags,
    publicUrl: a.publicUrl || undefined,
    productSlug: a.productSlug || undefined,
  };
}

export async function listResearchItems(): Promise<ResearchItem[]> {
  const base = researchItems;
  const adminArticles = await listLibraryArticles().catch(() => []);
  if (adminArticles.length === 0) return base;

  const overlay = new Map<string, ResearchItem>();
  for (const item of base) overlay.set(item.id, item);
  for (const a of adminArticles) overlay.set(a.slug, toResearchItem(a));

  const adminFirst = adminArticles.map((a) => overlay.get(a.slug)!).filter(Boolean);
  const rest = base.filter((item) => !adminArticles.some((a) => a.slug === item.id));
  return [...adminFirst, ...rest];
}

export async function getResearchItem(id: string): Promise<ResearchItem | null> {
  const items = await listResearchItems();
  return items.find((it) => it.id === id) || null;
}
