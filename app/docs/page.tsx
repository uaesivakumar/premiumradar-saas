'use client';

/**
 * Documentation Index Page - S18
 *
 * Main documentation hub with categories.
 */

import { DocsIndex } from '@/components/marketing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function DocsPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <DocsIndex />
        </div>
      </main>
      <Footer />
    </>
  );
}
