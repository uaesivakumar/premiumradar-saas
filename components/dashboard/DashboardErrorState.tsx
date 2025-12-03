/**
 * Dashboard Error State Component
 * Sprint S54: Vertical Dashboards
 *
 * Displays error state with retry option.
 */

import React from 'react';

interface DashboardErrorStateProps {
  error: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function DashboardErrorState({
  error,
  onRetry,
  showDetails = false,
}: DashboardErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Something Went Wrong</h2>
      <p className="text-gray-500 text-center max-w-md mb-2">
        We couldn't load the dashboard data. Please try again.
      </p>

      {showDetails && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 max-w-md">
          <p className="text-sm text-red-700 font-mono">{error}</p>
        </div>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}

export default DashboardErrorState;
