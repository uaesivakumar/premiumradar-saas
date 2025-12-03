/**
 * Dashboard Empty State Component
 * Sprint S54: Vertical Dashboards
 *
 * Displays empty state when no data is available.
 */

import React from 'react';
import type { VerticalConfig } from '../../lib/dashboard';

interface DashboardEmptyStateProps {
  vertical?: VerticalConfig;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function DashboardEmptyState({
  vertical,
  title = 'No Data Available',
  description = 'There is no data to display for this dashboard. This could be because no intelligence has been gathered yet.',
  actionLabel,
  onAction,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">
        {vertical?.icon || '📊'}
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>

      {vertical && (
        <div className="text-sm text-gray-400 mb-6">
          Vertical: <span className="font-medium">{vertical.name}</span>
        </div>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default DashboardEmptyState;
