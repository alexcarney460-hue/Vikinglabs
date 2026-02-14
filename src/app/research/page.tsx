import { Suspense } from 'react';
import ResearchLibraryClient from './ResearchLibraryClient';
import { listResearchItems } from '@/lib/research';

export default async function ResearchPage() {
  const items = await listResearchItems();
  return (
    <Suspense>
      <ResearchLibraryClient initialItems={items} />
    </Suspense>
  );
}
