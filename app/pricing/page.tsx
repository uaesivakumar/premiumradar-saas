'use client';

/**
 * Pricing Page - S18
 *
 * Marketing pricing page with tiers and FAQ.
 */

import { PricingTable } from '@/components/marketing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const router = useRouter();

  const handleSelectPlan = (planId: string) => {
    // Navigate to checkout or registration
    router.push(`/register?plan=${planId}`);
  };

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that best fits your needs. All plans include our
              core AI-powered features.
            </p>
          </div>

          {/* Pricing Table */}
          <PricingTable onSelectPlan={handleSelectPlan} />

          {/* Enterprise CTA */}
          <div className="mt-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold">Need a Custom Solution?</h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              For large organizations with specific requirements, we offer
              custom enterprise plans with dedicated support, custom
              integrations, and flexible pricing.
            </p>
            <button className="mt-8 px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
