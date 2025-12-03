/**
 * Dashboard Index Page
 * Sprint S54: Vertical Dashboards
 *
 * Main entry point for the intelligence dashboard.
 * Redirects to default vertical (banking).
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default vertical
    router.replace('/dashboard/banking');
  }, [router]);

  return (
    <>
      <Head>
        <title>Dashboard | PremiumRadar</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    </>
  );
}
