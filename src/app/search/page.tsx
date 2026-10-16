import SearchClient from './searchClient';
import React, { Suspense } from 'react';

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
