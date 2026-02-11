import { Suspense } from 'react';
import ResearchLibraryClient from './ResearchLibraryClient';

export default function ResearchPage() {
  return (
    <Suspense>
      <ResearchLibraryClient />
    </Suspense>
  );
}
