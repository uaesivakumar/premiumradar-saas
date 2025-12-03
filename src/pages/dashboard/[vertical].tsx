/**
 * Vertical Dashboard Page
 * Sprint S54: Vertical Dashboards
 *
 * Dynamic page for vertical-specific intelligence dashboards.
 */

import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { DashboardContainer } from '../../../components/dashboard';
import {
  isValidVertical,
  getVerticalConfig,
  type VerticalId,
  type DateRange,
} from '../../../lib/dashboard';

export default function VerticalDashboard() {
  const router = useRouter();
  const { vertical, territory, preset } = router.query;

  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Parse date range from query params
  useEffect(() => {
    if (preset && typeof preset === 'string') {
      const now = new Date();
      const presetDays: Record<string, number> = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      };

      if (preset in presetDays) {
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - presetDays[preset]);
        setDateRange({
          start: startDate,
          end: now,
          preset: preset as '7d' | '30d' | '90d',
        });
      }
    }
  }, [preset]);

  // Handle invalid vertical
  if (typeof vertical === 'string' && !isValidVertical(vertical)) {
    return (
      <>
        <Head>
          <title>Invalid Vertical | PremiumRadar</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Vertical</h1>
            <p className="text-gray-500 mb-6">
              The vertical "{vertical}" is not recognized.
            </p>
            <button
              onClick={() => router.push('/dashboard/banking')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Go to Banking Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  // Loading state while router query is resolving
  if (!vertical || typeof vertical !== 'string') {
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

  const verticalId = vertical as VerticalId;
  const config = getVerticalConfig(verticalId);

  const handleVerticalChange = (newVertical: VerticalId) => {
    const query: Record<string, string> = {};
    if (territory && typeof territory === 'string') {
      query.territory = territory;
    }
    if (preset && typeof preset === 'string') {
      query.preset = preset;
    }

    router.push({
      pathname: `/dashboard/${newVertical}`,
      query: Object.keys(query).length > 0 ? query : undefined,
    });
  };

  return (
    <>
      <Head>
        <title>{config.name} Dashboard | PremiumRadar</title>
        <meta name="description" content={config.description} />
      </Head>
      <DashboardContainer
        initialVertical={verticalId}
        territory={typeof territory === 'string' ? territory : undefined}
        dateRange={dateRange}
        autoRefresh={true}
        refreshInterval={60}
        onVerticalChange={handleVerticalChange}
      />
    </>
  );
}
