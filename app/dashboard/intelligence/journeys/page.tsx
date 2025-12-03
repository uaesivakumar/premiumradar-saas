'use client';

/**
 * Journey Optimization Insights Page
 * Sprint S56: Journey Performance Analytics
 *
 * Journey stage analysis with drop-off detection and optimization insights.
 */

import { useJourneyInsights } from '@/lib/intelligence-suite';
import { JourneyOptimizer } from '@/components/intelligence';

export default function JourneysPage() {
  const { journeys, isLoading, error } = useJourneyInsights();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading journey data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-500">Failed to load journey data</div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (!journeys || journeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No journey data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Journey Optimization
        </h1>
        <p className="text-gray-500 mt-1">
          Identify drop-off points and optimize journey performance
        </p>
      </div>

      <JourneyOptimizer
        journeys={journeys}
        className="w-full"
      />
    </div>
  );
}
