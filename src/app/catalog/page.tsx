import CatalogClient from './CatalogClient';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qParam = params.q;
  const categoryParam = params.category;

  const q = Array.isArray(qParam) ? qParam[0] : qParam;
  const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;

  return <CatalogClient initialQ={q ?? ''} initialCategory={category ?? ''} />;
}
