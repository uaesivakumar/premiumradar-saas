'use client';

/**
 * SavedLeadsPanel Component - SAAS_RENDER_ONLY
 *
 * Displays saved leads from OS.
 *
 * ARCHITECTURE COMPLIANCE:
 * - SaaS ONLY renders saved leads from OS
 * - SaaS NEVER stores saved leads locally
 * - OS owns all saved lead state
 * - SaaS emits UNSAVE event to OS when user removes
 *
 * Architecture: OS decides. SIVA reasons. SaaS renders.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedLead {
  companyId: string;
  companyName: string;
  industry?: string;
  location?: string;
  savedAt: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

interface SavedLeadsPanelProps {
  /** Saved leads from OS */
  savedLeads: SavedLead[];
  /** Total count from OS */
  totalCount: number;
  /** Loading state */
  isLoading?: boolean;
  /** Emit unsave event to OS */
  onUnsave: (companyId: string) => void;
  /** Navigate to lead details */
  onViewLead: (companyId: string) => void;
  /** Load more saved leads from OS */
  onLoadMore?: () => void;
  /** Whether more leads available */
  hasMore?: boolean;
}

export function SavedLeadsPanel({
  savedLeads,
  totalCount,
  isLoading = false,
  onUnsave,
  onViewLead,
  onLoadMore,
  hasMore = false,
}: SavedLeadsPanelProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleUnsave = async (companyId: string) => {
    setRemovingId(companyId);
    try {
      // SAAS_EVENT_ONLY: Emit to OS, don't modify local state
      await onUnsave(companyId);
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading && savedLeads.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (savedLeads.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">☆</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No saved leads yet
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Save leads you&apos;re interested in to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Saved Leads
          </h2>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Saved Leads List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {savedLeads.map((lead) => (
            <motion.div
              key={lead.companyId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-gray-100 dark:border-gray-700"
            >
              <div className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {/* Lead Info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onViewLead(lead.companyId)}
                >
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {lead.companyName}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                    {lead.industry && <span>{lead.industry}</span>}
                    {lead.industry && lead.location && <span>•</span>}
                    {lead.location && <span>{lead.location}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Saved {formatRelativeTime(lead.savedAt)}
                  </div>
                </div>

                {/* Score Badge */}
                {lead.score && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {lead.score}
                    </div>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleUnsave(lead.companyId)}
                  disabled={removingId === lead.companyId}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove from saved"
                >
                  {removingId === lead.companyId ? '⏳' : '✕'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more saved leads'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Format relative time for display
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default SavedLeadsPanel;
