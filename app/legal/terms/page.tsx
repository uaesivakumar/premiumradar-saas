'use client';

/**
 * Terms of Service Page - S18
 *
 * Legal terms and conditions page.
 */

import { LegalPageView } from '@/components/marketing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <LegalPageView type="terms" />
        </div>
      </main>
      <Footer />
    </>
  );
}
