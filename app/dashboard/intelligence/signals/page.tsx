'use client';

/**
 * Signal Lab Page
 * Sprint S62: Signal Correlation & Pattern Explorer
 *
 * Interactive laboratory for exploring signal correlations and patterns.
 *
 * P2 VERTICALISATION: Now uses dynamic vertical from sales context.
 */

import { useSignalCorrelations, usePatternExplorer } from '@/lib/intelligence-suite';
import { SignalLab, SignalTimeline, CorrelationHeatmap } from '@/components/signal-lab';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';

export default function SignalsPage() {
  // P2 VERTICALISATION: Get vertical from sales context
  const vertical = useSalesContextStore(selectVertical);

  const { rawSignals, correlations, isLoading: signalsLoading, error: signalsError } = useSignalCorrelations({ vertical });
  const { patterns, isLoading: patternsLoading, error: patternsError } = usePatternExplorer({ vertical });

  const isLoading = signalsLoading || patternsLoading;
  const error = signalsError || patternsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading signal data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-500">Failed to load signal data</div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  const signals = rawSignals || [];
  const patternsList = patterns || [];
  const correlationsList = correlations || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Signal Lab
        </h1>
        <p className="text-gray-500 mt-1">
          Explore signal correlations and discover patterns
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SignalTimeline signals={signals} />
        <CorrelationHeatmap correlations={correlationsList} signals={signals} />
      </div>

      <SignalLab
        signals={signals}
        patterns={patternsList}
        correlations={correlationsList}
      />
    </div>
  );
}
