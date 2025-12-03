/**
 * Discovery Empty State Component
 * Sprint S55: Discovery UI
 *
 * Shown when no discovery results match the current filters.
 */

import React from 'react';
import type { VerticalId } from '../../lib/dashboard';

interface DiscoveryEmptyStateProps {
  vertical?: VerticalId;
  hasFilters?: boolean;
  onResetFilters?: () => void;
  onRunDiscovery?: () => void;
}

export function DiscoveryEmptyState({
  vertical,
  hasFilters = false,
  onResetFilters,
  onRunDiscovery,
}: DiscoveryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">{getVerticalIcon(vertical)}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasFilters ? 'No Companies Match Your Filters' : 'No Companies Discovered Yet'}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-md mb-6">
        {hasFilters
          ? 'Try adjusting your filter criteria or expanding your search parameters to find more companies.'
          : getEmptyStateDescription(vertical)}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {hasFilters && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset Filters
          </button>
        )}
        {onRunDiscovery && (
          <button
            onClick={onRunDiscovery}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run Discovery
          </button>
        )}
      </div>

      {/* Suggestions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-md">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Suggestions:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {hasFilters ? (
            <>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Remove some filters to broaden your search</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Lower the minimum score threshold</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Include more company sizes or industries</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Configure your vertical and territory settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Run the auto-discovery process for your region</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Check back later as new companies are discovered</span>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

function getVerticalIcon(vertical?: VerticalId): string {
  if (!vertical) return '🔍';

  const icons: Record<VerticalId, string> = {
    banking: '🏦',
    'real-estate': '🏠',
    consulting: '💼',
    technology: '💻',
    energy: '⚡',
    healthcare: '🏥',
  };

  return icons[vertical] || '🔍';
}

function getEmptyStateDescription(vertical?: VerticalId): string {
  if (!vertical) {
    return 'Select a vertical to start discovering companies that match your criteria.';
  }

  const descriptions: Record<VerticalId, string> = {
    banking:
      'No banking opportunities have been discovered yet. Run auto-discovery to find companies with hiring signals and expansion indicators.',
    'real-estate':
      'No real estate prospects have been discovered yet. Configure your territory to start finding potential buyers and sellers.',
    consulting:
      'No consulting opportunities have been discovered yet. Set up your focus areas to find companies seeking advisory services.',
    technology:
      'No technology prospects have been discovered yet. Run discovery to find companies with technology adoption signals.',
    energy:
      'No energy sector companies have been discovered yet. Configure discovery to find companies with relevant signals.',
    healthcare:
      'No healthcare opportunities have been discovered yet. Set up discovery to find organizations with healthcare needs.',
  };

  return descriptions[vertical] || 'No companies have been discovered yet.';
}

export default DiscoveryEmptyState;
