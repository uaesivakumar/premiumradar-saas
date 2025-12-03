'use client';

/**
 * IntelligenceSidebar Component
 * Sprint S56-S62: Intelligence Suite
 *
 * Sidebar panel for detailed object/score inspection.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { Vertical } from '@/lib/intelligence/context/types';
import { useScoreInsights } from '@/lib/intelligence-suite/hooks';
import { ScoreExplanationPanel } from './ScoreExplanationPanel';

interface IntelligenceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  objectId: string | null;
  vertical: Vertical;
}

export function IntelligenceSidebar({
  isOpen,
  onClose,
  objectId,
  vertical,
}: IntelligenceSidebarProps) {
  const { data: scoreData, isLoading, error } = useScoreInsights({
    objectId: objectId || '',
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:relative right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:border-l-0'
        )}
      >
        {isOpen && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Score Details
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!objectId && (
                <div className="text-center text-gray-500 py-8">
                  Select an item to view score details
                </div>
              )}

              {objectId && isLoading && (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              )}

              {objectId && error && (
                <div className="text-center text-red-500 py-8">
                  Failed to load score data
                </div>
              )}

              {objectId && scoreData && (
                <ScoreExplanationPanel score={scoreData} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default IntelligenceSidebar;
