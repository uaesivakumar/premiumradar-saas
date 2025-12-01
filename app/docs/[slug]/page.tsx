'use client';

/**
 * Documentation Page - S18
 *
 * Individual documentation page with content and navigation.
 */

import { useParams } from 'next/navigation';
import { DocsPage } from '@/components/marketing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getDocPageBySlug, getDocCategory, DOC_CATEGORIES } from '@/lib/marketing';

export default function DocPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const page = getDocPageBySlug(slug);

  if (!page) {
    return (
      <>
        <Header />
        <main className="pt-24 pb-16 bg-white min-h-screen">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Page Not Found</h1>
            <p className="mt-4 text-gray-600">
              The documentation page you&apos;re looking for doesn&apos;t exist.
            </p>
            <a
              href="/docs"
              className="mt-8 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Documentation
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const category = getDocCategory(page.category) || DOC_CATEGORIES[0];

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <DocsPage page={page} category={category} />
        </div>
      </main>
      <Footer />
    </>
  );
}
