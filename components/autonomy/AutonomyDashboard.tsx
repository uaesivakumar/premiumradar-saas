'use client';

/**
 * AutonomyDashboard Component
 * Sprint S58: Autonomous Safety UI
 *
 * Main dashboard for monitoring autonomous agent activity.
 * READ-ONLY UI for viewing OS S66-S70 autonomous operations.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { useAutonomousInsights } from '@/lib/intelligence-suite/hooks';
import { KillSwitchPanel } from './KillSwitchPanel';
import { CheckpointList } from './CheckpointList';
import { AutonomyLogViewer } from './AutonomyLogViewer';
import { CostMonitor } from './CostMonitor';
import { ErrorRateTrend } from './ErrorRateTrend';

interface AutonomyDashboardProps {
  className?: string;
}

export function AutonomyDashboard({ className }: AutonomyDashboardProps) {
  const { data, isLoading, error, refetch } = useAutonomousInsights({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  if (isLoading && !data) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">Failed to load autonomous metrics</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        No autonomous data available
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Autonomous Operations
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor and manage autonomous agent activity
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-3 h-3 rounded-full',
                data.status.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
            />
            <span className="text-sm font-medium">
              {data.status.enabled ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Mode Badge */}
          <span
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-full',
              data.status.mode === 'full' && 'bg-green-100 text-green-800',
              data.status.mode === 'supervised' && 'bg-blue-100 text-blue-800',
              data.status.mode === 'paused' && 'bg-yellow-100 text-yellow-800',
              data.status.mode === 'killed' && 'bg-red-100 text-red-800'
            )}
          >
            {data.status.mode.charAt(0).toUpperCase() + data.status.mode.slice(1)} Mode
          </span>

          {/* Refresh Button */}
          <button
            onClick={refetch}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Kill Switch Panel */}
      <KillSwitchPanel killSwitch={data.status.killSwitch} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Actions"
          value={data.metrics.totalActions}
          icon="⚡"
        />
        <MetricCard
          label="Success Rate"
          value={`${(data.metrics.successRate * 100).toFixed(1)}%`}
          icon="✓"
          color={data.metrics.successRate > 0.9 ? 'text-green-600' : 'text-yellow-600'}
        />
        <MetricCard
          label="Avg Latency"
          value={`${data.metrics.avgLatency.toFixed(0)}ms`}
          icon="⏱"
        />
        <MetricCard
          label="Error Rate"
          value={`${(data.metrics.errorRate * 100).toFixed(2)}%`}
          icon="⚠"
          color={data.metrics.errorRate < 0.05 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Checkpoints */}
        <CheckpointList checkpoints={data.checkpoints} />

        {/* Cost Monitor */}
        <CostMonitor costs={data.costs} />
      </div>

      {/* Error Rate Trend */}
      <ErrorRateTrend performance={data.performance} />

      {/* Activity Log */}
      <AutonomyLogViewer activities={data.activities} />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={cn('text-2xl font-bold', color || 'text-gray-900 dark:text-white')}>
        {value}
      </div>
    </div>
  );
}

export default AutonomyDashboard;
