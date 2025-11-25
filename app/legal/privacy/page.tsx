'use client';

/**
 * Privacy Policy Page - S18
 *
 * Legal privacy policy page.
 */

import { LegalPageView } from '@/components/marketing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <LegalPageView type="privacy" />
        </div>
      </main>
      <Footer />
    </>
  );
}
