/**
 * Discovery List Component
 * Sprint S55: Discovery UI
 *
 * Main list component displaying ranked, scored companies.
 */

import React from 'react';
import type { DiscoveryListItem as DiscoveryItemData, DiscoveryStatsData } from '../../lib/discovery';
import { DiscoveryListItem } from './DiscoveryListItem';

interface DiscoveryListProps {
  items: DiscoveryItemData[];
  stats?: DiscoveryStatsData | null;
  isLoading?: boolean;
  selectedId?: string | null;
  onSelect?: (objectId: string) => void;
  onHover?: (objectId: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DiscoveryList({
  items,
  stats,
  isLoading = false,
  selectedId,
  onSelect,
  onHover,
  page = 1,
  totalPages = 1,
  onPageChange,
}: DiscoveryListProps) {
  if (isLoading) {
    return <DiscoveryListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">🔍</div>
        <p>No companies found matching your criteria.</p>
        <p className="text-sm mt-2">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Summary */}
      {stats && (
        <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold text-gray-900">{stats.total}</span> companies
          </div>
          <div>
            <span className="font-semibold text-green-600">{stats.qualified}</span> qualified
          </div>
          <div>
            <span className="font-semibold text-blue-600">{stats.newThisWeek}</span> new this week
          </div>
          <div>
            Avg score: <span className="font-semibold">{stats.avgScore.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map((item) => (
          <DiscoveryListItem
            key={item.id}
            item={item}
            isSelected={selectedId === item.objectId}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function DiscoveryListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gray-200 rounded" />
                <div className="w-32 h-5 bg-gray-200 rounded" />
                <div className="w-16 h-4 bg-gray-200 rounded-full" />
              </div>
              <div className="w-48 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-full h-3 bg-gray-200 rounded" />
            </div>
            <div className="text-right">
              <div className="w-12 h-8 bg-gray-200 rounded mb-1" />
              <div className="w-16 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DiscoveryList;
