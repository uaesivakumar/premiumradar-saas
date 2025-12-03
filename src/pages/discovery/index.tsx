/**
 * Discovery Index Page
 * Sprint S55: Discovery UI
 *
 * Landing page for discovery - redirects to default vertical.
 */

import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect } from 'react';
import { getAllVerticals, type VerticalId } from '../../../lib/dashboard';

export default function DiscoveryIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to banking by default (most common vertical)
    router.replace('/discovery/banking');
  }, [router]);

  return (
    <>
      <Head>
        <title>Discovery | PremiumRadar</title>
        <meta name="description" content="Discover high-potential prospects with AI-powered intelligence" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Loading State */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading discovery...</p>
          </div>
        </div>
      </div>
    </>
  );
}

// Alternative: Show vertical selector instead of redirect
export function DiscoveryVerticalSelector() {
  const router = useRouter();

  const handleVerticalSelect = (verticalId: VerticalId) => {
    router.push(`/discovery/${verticalId}`);
  };

  return (
    <>
      <Head>
        <title>Discovery | PremiumRadar</title>
        <meta name="description" content="Select a vertical to start discovering prospects" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-16 px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Prospect Discovery
            </h1>
            <p className="text-lg text-gray-600">
              Select your vertical to start discovering high-potential prospects
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {getAllVerticals().map((vertical) => (
              <button
                key={vertical.id}
                onClick={() => handleVerticalSelect(vertical.id)}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="text-4xl mb-3">{vertical.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {vertical.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {vertical.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
