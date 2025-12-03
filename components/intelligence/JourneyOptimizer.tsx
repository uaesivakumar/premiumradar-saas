'use client';

/**
 * JourneyOptimizer Component
 * Sprint S56-S62: Intelligence Suite
 *
 * Displays journey performance with dropoff analysis and optimization suggestions.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { JourneyPerformanceData, JourneyStagePerformance } from '@/lib/intelligence-suite/types';

interface JourneyOptimizerProps {
  journeys: JourneyPerformanceData[];
  onJourneyClick?: (journeyId: string) => void;
  className?: string;
}

export function JourneyOptimizer({
  journeys,
  onJourneyClick,
  className,
}: JourneyOptimizerProps) {
  const [selectedJourney, setSelectedJourney] = useState<string | null>(
    journeys[0]?.journeyId || null
  );

  const activeJourney = journeys.find((j) => j.journeyId === selectedJourney);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Journey Optimization
          </h3>
          <select
            value={selectedJourney || ''}
            onChange={(e) => setSelectedJourney(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700"
          >
            {journeys.map((journey) => (
              <option key={journey.journeyId} value={journey.journeyId}>
                {journey.journeyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeJourney ? (
        <div className="p-4">
          {/* Journey Metrics Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Completion"
              value={`${(activeJourney.metrics.completionRate * 100).toFixed(1)}%`}
              trend={activeJourney.metrics.completionRate > 0.5 ? 'positive' : 'warning'}
            />
            <MetricCard
              label="Conversion"
              value={`${(activeJourney.metrics.conversionRate * 100).toFixed(1)}%`}
              trend={activeJourney.metrics.conversionRate > 0.2 ? 'positive' : 'warning'}
            />
            <MetricCard
              label="Avg Duration"
              value={`${activeJourney.metrics.avgDuration.toFixed(1)}h`}
              trend="neutral"
            />
            <MetricCard
              label="Drop-off"
              value={`${(activeJourney.metrics.dropoffRate * 100).toFixed(1)}%`}
              trend={activeJourney.metrics.dropoffRate < 0.3 ? 'positive' : 'negative'}
            />
          </div>

          {/* Stage Funnel */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Stage Performance
            </h4>
            <StageFunnel stages={activeJourney.stages} />
          </div>

          {/* Bottlenecks */}
          {activeJourney.stages.some((s) => s.bottleneck) && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                Bottlenecks Detected
              </h4>
              <div className="space-y-2">
                {activeJourney.stages
                  .filter((s) => s.bottleneck)
                  .map((stage) => (
                    <div
                      key={stage.stageId}
                      className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded"
                    >
                      <span className="font-medium">{stage.stageName}</span>
                      <span>-</span>
                      <span>
                        {(stage.conversionRate * 100).toFixed(1)}% conversion,{' '}
                        {stage.avgTimeInStage.toFixed(1)}h avg time
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {activeJourney.optimizations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Optimization Suggestions
              </h4>
              <div className="space-y-2">
                {activeJourney.optimizations.slice(0, 3).map((opt) => (
                  <OptimizationCard key={opt.id} optimization={opt} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          No journey data available
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  trend: 'positive' | 'negative' | 'warning' | 'neutral';
}

function MetricCard({ label, value, trend }: MetricCardProps) {
  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    warning: 'text-yellow-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </div>
      <div className={cn('text-xl font-bold', trendColors[trend])}>
        {value}
      </div>
    </div>
  );
}

interface StageFunnelProps {
  stages: JourneyStagePerformance[];
}

function StageFunnel({ stages }: StageFunnelProps) {
  const maxEntered = Math.max(...stages.map((s) => s.entered), 1);

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const widthPercent = (stage.entered / maxEntered) * 100;
        const conversionPercent = stage.conversionRate * 100;

        return (
          <div key={stage.stageId} className="relative">
            <div className="flex items-center gap-2">
              <div className="w-24 text-xs text-gray-500 truncate">
                {stage.stageName}
              </div>
              <div className="flex-1 relative h-8">
                <div
                  className={cn(
                    'h-full rounded transition-all',
                    stage.bottleneck
                      ? 'bg-red-200 dark:bg-red-900/40'
                      : 'bg-blue-200 dark:bg-blue-900/40'
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
                <div className="absolute inset-0 flex items-center px-2 text-xs">
                  <span className="font-medium">{stage.entered}</span>
                  <span className="ml-auto text-gray-500">
                    {conversionPercent.toFixed(0)}% conv
                  </span>
                </div>
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className="ml-28 h-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface OptimizationCardProps {
  optimization: JourneyPerformanceData['optimizations'][0];
}

function OptimizationCard({ optimization }: OptimizationCardProps) {
  const effortColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const typeIcons: Record<string, string> = {
    timing: '⏱',
    content: '📝',
    targeting: '🎯',
    channel: '📣',
    sequence: '🔄',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <span className="text-lg">{typeIcons[optimization.type] || '💡'}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h5 className="font-medium text-gray-900 dark:text-white text-sm">
            {optimization.title}
          </h5>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              effortColors[optimization.effort]
            )}
          >
            {optimization.effort} effort
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {optimization.description}
        </p>
        <div className="text-xs text-green-600 mt-1">
          Potential impact: +{optimization.potentialImpact}% conversion
        </div>
      </div>
    </div>
  );
}

export default JourneyOptimizer;
