'use client';

/**
 * CostMonitor Component
 * Sprint S58: Autonomous Safety UI
 *
 * Displays cost and token usage metrics from OS S70.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { AutonomousCosts } from '@/lib/intelligence-suite/types';

interface CostMonitorProps {
  costs: AutonomousCosts;
  className?: string;
}

export function CostMonitor({ costs, className }: CostMonitorProps) {
  const {
    totalCost,
    costByType,
    tokenUsage,
    projectedMonthly,
    budgetRemaining,
    budgetUtilization,
  } = costs;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const utilizationColor =
    budgetUtilization > 0.9
      ? 'text-red-600 bg-red-100 dark:bg-red-900/40'
      : budgetUtilization > 0.7
        ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40'
        : 'text-green-600 bg-green-100 dark:bg-green-900/40';

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cost Monitor
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          AI usage and cost tracking
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Total Spend</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalCost)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Projected Monthly</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(projectedMonthly)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Budget Remaining</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(budgetRemaining)}
            </div>
          </div>
        </div>

        {/* Budget Utilization Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Budget Utilization</span>
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded', utilizationColor)}>
              {(budgetUtilization * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                budgetUtilization > 0.9 ? 'bg-red-500' :
                budgetUtilization > 0.7 ? 'bg-yellow-500' :
                'bg-green-500'
              )}
              style={{ width: `${Math.min(budgetUtilization * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Token Usage */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Token Usage
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500">Input</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(tokenUsage.inputTokens)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500">Output</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(tokenUsage.outputTokens)}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(tokenUsage.totalTokens)}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Cost per 1K tokens: {formatCurrency(tokenUsage.costPerToken * 1000)}
          </div>
        </div>

        {/* Cost by Type */}
        {costByType.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Cost Breakdown
            </h4>
            <div className="space-y-2">
              {costByType.map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.type}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.cost)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CostMonitor;
