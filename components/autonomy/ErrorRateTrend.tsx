'use client';

/**
 * ErrorRateTrend Component
 * Sprint S58: Autonomous Safety UI
 *
 * Displays error rate trends and performance anomalies.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { AutonomousPerformance } from '@/lib/intelligence-suite/types';

interface ErrorRateTrendProps {
  performance: AutonomousPerformance;
  className?: string;
}

export function ErrorRateTrend({ performance, className }: ErrorRateTrendProps) {
  const {
    latencyP50,
    latencyP95,
    latencyP99,
    throughput,
    errorRateByType,
    anomalies,
  } = performance;

  const activeAnomalies = anomalies.filter((a) => !a.resolved);
  const resolvedAnomalies = anomalies.filter((a) => a.resolved);

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'latency-spike':
        return '⏱';
      case 'error-spike':
        return '⚠';
      case 'cost-spike':
        return '💰';
      case 'throughput-drop':
        return '📉';
      default:
        return '⚡';
    }
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance & Errors
          </h3>
          {activeAnomalies.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full animate-pulse">
              {activeAnomalies.length} active anomalies
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Latency Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Latency Distribution
          </h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {latencyP50.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">P50 (ms)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {latencyP95.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">P95 (ms)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {latencyP99.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">P99 (ms)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {throughput.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">req/s</div>
            </div>
          </div>
        </div>

        {/* Error Rates by Type */}
        {Object.keys(errorRateByType).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Error Rates by Type
            </h4>
            <div className="space-y-2">
              {Object.entries(errorRateByType).map(([type, rate]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-32 truncate">
                    {type}
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        rate > 0.1 ? 'bg-red-500' : rate > 0.05 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(rate * 100, 100)}%` }}
                    />
                  </div>
                  <span className={cn(
                    'text-xs font-medium w-14 text-right',
                    rate > 0.1 ? 'text-red-600' : rate > 0.05 ? 'text-yellow-600' : 'text-green-600'
                  )}>
                    {(rate * 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Anomalies */}
        {activeAnomalies.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-3">
              Active Anomalies
            </h4>
            <div className="space-y-2">
              {activeAnomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    getSeverityColor(anomaly.severity)
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getAnomalyIcon(anomaly.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{anomaly.type.replace(/-/g, ' ')}</span>
                        <span className={cn(
                          'px-1.5 py-0.5 text-xs font-medium rounded uppercase',
                          anomaly.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          anomaly.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        )}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-sm mt-1 opacity-80">{anomaly.description}</p>
                      <p className="text-xs mt-1 opacity-60">
                        Impact: {anomaly.impact}
                      </p>
                      <p className="text-xs opacity-60">
                        Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Resolved Anomalies */}
        {resolvedAnomalies.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recently Resolved ({resolvedAnomalies.length})
            </h4>
            <div className="space-y-1">
              {resolvedAnomalies.slice(0, 3).map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <span className="text-green-500">✓</span>
                  <span>{anomaly.type.replace(/-/g, ' ')}</span>
                  <span className="text-xs">
                    resolved {anomaly.resolvedAt ? new Date(anomaly.resolvedAt).toLocaleString() : 'recently'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {anomalies.length === 0 && Object.keys(errorRateByType).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">✓</span>
            No anomalies or errors detected
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorRateTrend;
