/**
 * Outreach Funnel Component
 * Sprint S54: Vertical Dashboards
 *
 * Visualizes the outreach funnel with stage progression.
 */

import React from 'react';
import type { OutreachFunnel as FunnelData, FunnelStage } from '../../lib/dashboard';

interface OutreachFunnelProps {
  funnel: FunnelData | null;
  loading?: boolean;
  showConversionRates?: boolean;
}

export function OutreachFunnel({
  funnel,
  loading = false,
  showConversionRates = true,
}: OutreachFunnelProps) {
  if (loading) {
    return <FunnelSkeleton />;
  }

  if (!funnel || funnel.stages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No funnel data available
      </div>
    );
  }

  const maxCount = Math.max(...funnel.stages.map((s) => s.count), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Outreach Funnel</h3>
        <div className="text-sm text-gray-500">
          Overall: <span className="font-medium text-green-600">{funnel.overallConversionRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {funnel.stages.map((stage, index) => (
          <FunnelStageBar
            key={stage.id}
            stage={stage}
            maxCount={maxCount}
            isFirst={index === 0}
            isLast={index === funnel.stages.length - 1}
            showConversionRate={showConversionRates && index > 0}
          />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-sm">
        <div>
          <span className="text-gray-500">Total Leads:</span>{' '}
          <span className="font-semibold">{funnel.totalLeads.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Converted:</span>{' '}
          <span className="font-semibold text-green-600">{funnel.totalConverted.toLocaleString()}</span>
        </div>
        {funnel.avgCycleTime > 0 && (
          <div>
            <span className="text-gray-500">Avg Cycle:</span>{' '}
            <span className="font-semibold">{funnel.avgCycleTime} days</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface FunnelStageBarProps {
  stage: FunnelStage;
  maxCount: number;
  isFirst: boolean;
  isLast: boolean;
  showConversionRate: boolean;
}

function FunnelStageBar({
  stage,
  maxCount,
  isFirst,
  isLast,
  showConversionRate,
}: FunnelStageBarProps) {
  const widthPercent = Math.max((stage.count / maxCount) * 100, 5);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{stage.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{stage.count.toLocaleString()}</span>
          {showConversionRate && stage.conversionRate !== undefined && (
            <span className="text-xs text-gray-500">
              ({stage.conversionRate.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>
      <div className="h-8 bg-gray-100 rounded-md overflow-hidden">
        <div
          className="h-full rounded-md transition-all duration-500 ease-out flex items-center justify-end pr-2"
          style={{
            width: `${widthPercent}%`,
            backgroundColor: stage.color,
          }}
        >
          {widthPercent > 20 && (
            <span className="text-xs font-medium text-white">
              {stage.count.toLocaleString()}
            </span>
          )}
        </div>
      </div>
      {stage.avgTimeInStage !== undefined && stage.avgTimeInStage > 0 && (
        <div className="text-xs text-gray-400 mt-0.5">
          Avg time: {formatTime(stage.avgTimeInStage)}
        </div>
      )}
    </div>
  );
}

function FunnelSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="w-32 h-6 bg-gray-200 rounded" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-12 h-4 bg-gray-200 rounded" />
            </div>
            <div className="h-8 bg-gray-200 rounded" style={{ width: `${100 - i * 15}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(hours: number): string {
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  return `${(hours / 24).toFixed(1)}d`;
}

export default OutreachFunnel;
