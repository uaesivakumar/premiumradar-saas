'use client';

/**
 * IntelligenceDashboard Component
 * Sprint S56-S62: Intelligence Suite
 *
 * Main dashboard component that combines all intelligence widgets.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { IntelligenceTimeRange } from '@/lib/intelligence-suite/types';
import type { Vertical } from '@/lib/intelligence/context/types';
import { useIntelligence } from '@/lib/intelligence-suite/hooks';
import {
  buildPersonaRanking,
  buildSignalWeights,
  buildPatternClusters,
  buildTimeSeriesChart,
  buildCompositeIntelligenceScore,
} from '@/lib/intelligence-suite/transformers';

import { KPIHeader } from './KPIHeader';
import { PersonaEffectiveness } from './PersonaEffectiveness';
import { JourneyOptimizer } from './JourneyOptimizer';
import { IntelligenceTimeSeries } from './IntelligenceTimeSeries';
import { PatternExplorer } from './PatternExplorer';
import { IntelligenceTabs } from './IntelligenceTabs';
import { IntelligenceSidebar } from './IntelligenceSidebar';

interface IntelligenceDashboardProps {
  vertical: Vertical;
  className?: string;
}

const TIME_RANGE_OPTIONS: { value: IntelligenceTimeRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export function IntelligenceDashboard({
  vertical,
  className,
}: IntelligenceDashboardProps) {
  type TabId = 'overview' | 'personas' | 'journeys' | 'signals';
  const [timeRange, setTimeRange] = useState<IntelligenceTimeRange>('30d');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabId);
  };

  const {
    personas,
    journeys,
    signals,
    patterns,
    autonomous,
    timeSeries,
    compositeScore,
    isLoading,
    error,
    refetch,
  } = useIntelligence({ vertical, timeRange });

  // Transform data for UI
  const personaRanking = personas.length ? buildPersonaRanking(personas) : null;
  const signalWeights = signals.length ? buildSignalWeights(signals) : null;
  const patternClusters = patterns.length ? buildPatternClusters(patterns) : null;
  const timeSeriesChart = timeSeries.length ? buildTimeSeriesChart(timeSeries) : null;
  const compositeUI = compositeScore ? buildCompositeIntelligenceScore(compositeScore) : null;

  // Build KPIs
  const kpis = [
    {
      id: 'composite-score',
      label: 'Intelligence Score',
      value: compositeUI?.totalScore || 0,
      icon: '📊',
      color: compositeUI?.gaugeData.color,
    },
    {
      id: 'total-signals',
      label: 'Active Signals',
      value: signals.length,
      icon: '📡',
      change: 12,
      changeDirection: 'up' as const,
    },
    {
      id: 'patterns-detected',
      label: 'Patterns',
      value: patterns.length,
      icon: '🔍',
    },
    {
      id: 'automation-rate',
      label: 'Automation',
      value: `${((autonomous?.metrics.automationRate || 0) * 100).toFixed(0)}%`,
      icon: '🤖',
      change: 5,
      changeDirection: 'up' as const,
    },
  ];

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">Failed to load intelligence data</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full', className)}>
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Intelligence Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Real-time insights for {vertical} vertical
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as IntelligenceTimeRange)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              {TIME_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={refetch}
              disabled={isLoading}
              className={cn(
                'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* KPI Header */}
        <KPIHeader kpis={kpis} />

        {/* Tabs */}
        <IntelligenceTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'personas', label: 'Personas', count: personas.length },
            { id: 'journeys', label: 'Journeys', count: journeys.length },
            { id: 'signals', label: 'Signals', count: signals.length },
          ]}
        />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Time Series */}
            {timeSeriesChart && (
              <IntelligenceTimeSeries
                data={timeSeriesChart}
                className="col-span-2"
              />
            )}

            {/* Persona Effectiveness */}
            {personaRanking && (
              <PersonaEffectiveness
                personas={personaRanking.personas}
                onPersonaClick={(id) => {
                  setSelectedObjectId(id);
                  setSidebarOpen(true);
                }}
              />
            )}

            {/* Journey Optimizer */}
            <JourneyOptimizer journeys={journeys} />

            {/* Pattern Explorer */}
            {patternClusters && (
              <PatternExplorer
                patterns={patternClusters}
                className="col-span-2"
              />
            )}
          </div>
        )}

        {activeTab === 'personas' && personaRanking && (
          <PersonaEffectiveness
            personas={personaRanking.personas}
            onPersonaClick={(id) => {
              setSelectedObjectId(id);
              setSidebarOpen(true);
            }}
          />
        )}

        {activeTab === 'journeys' && (
          <JourneyOptimizer journeys={journeys} />
        )}

        {activeTab === 'signals' && signalWeights && (
          <div className="space-y-6">
            {/* Signal Summary */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Total Weight</div>
                <div className="text-2xl font-bold">{signalWeights.totalWeight.toFixed(0)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Net Impact</div>
                <div className={cn(
                  'text-2xl font-bold',
                  signalWeights.netImpact > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {signalWeights.netImpact > 0 ? '+' : ''}{signalWeights.netImpact.toFixed(1)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Top Positive</div>
                <div className="text-lg font-medium text-green-600">
                  {signalWeights.topPositive[0]?.name || 'None'}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500">Top Negative</div>
                <div className="text-lg font-medium text-red-600">
                  {signalWeights.topNegative[0]?.name || 'None'}
                </div>
              </div>
            </div>

            {/* Signals by Category */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold mb-4">Signals by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(signalWeights.byCategory).map(([category, data]) => (
                  <div key={category} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-sm font-medium capitalize">{category}</div>
                    <div className="text-2xl font-bold">{data.signals.length}</div>
                    <div className={cn(
                      'text-xs',
                      data.netImpact > 0 ? 'text-green-600' : data.netImpact < 0 ? 'text-red-600' : 'text-gray-500'
                    )}>
                      {data.netImpact > 0 ? '+' : ''}{data.netImpact.toFixed(1)} impact
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <IntelligenceSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        objectId={selectedObjectId}
        vertical={vertical}
      />
    </div>
  );
}

export default IntelligenceDashboard;
