/**
 * Historical Recall Banner
 *
 * S355: Historical Action Recall
 * Behavior Contract B006: Historical recall advisory shown
 *
 * Displays an advisory banner when the user attempts an action
 * similar to one they've performed before.
 *
 * Usage:
 * ```tsx
 * <HistoricalRecallBanner
 *   isVisible={recallResult.hasSimilar}
 *   advisory={recallResult.advisory}
 *   similarActions={recallResult.similarActions}
 *   onDismiss={() => setRecallResult(null)}
 *   onProceed={() => executeAction()}
 * />
 * ```
 */

'use client';

import React from 'react';

export interface SimilarAction {
  id: string;
  actionType: string;
  when: Date;
  description: string;
}

export interface HistoricalRecallBannerProps {
  isVisible: boolean;
  advisory?: string;
  similarActions: SimilarAction[];
  onDismiss: () => void;
  onProceed: () => void;
  className?: string;
}

export function HistoricalRecallBanner({
  isVisible,
  advisory,
  similarActions,
  onDismiss,
  onProceed,
  className = '',
}: HistoricalRecallBannerProps) {
  if (!isVisible || similarActions.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4
        dark:bg-amber-900/20 dark:border-amber-700
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-amber-500 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Similar Action Detected
          </h4>

          {advisory && (
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {advisory}
            </p>
          )}

          {similarActions.length > 1 && (
            <details className="mt-2">
              <summary className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer">
                View {similarActions.length} similar actions
              </summary>
              <ul className="mt-2 space-y-1">
                {similarActions.map((action) => (
                  <li
                    key={action.id}
                    className="text-xs text-amber-600 dark:text-amber-400"
                  >
                    {action.description} - {formatDate(action.when)}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={onProceed}
              className="
                px-3 py-1.5 text-xs font-medium
                bg-amber-100 text-amber-800 rounded
                hover:bg-amber-200
                dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700
                transition-colors
              "
            >
              Proceed Anyway
            </button>
            <button
              onClick={onDismiss}
              className="
                px-3 py-1.5 text-xs font-medium
                text-amber-600 hover:text-amber-800
                dark:text-amber-400 dark:hover:text-amber-200
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="
            flex-shrink-0 p-1 rounded
            text-amber-500 hover:text-amber-700
            dark:text-amber-400 dark:hover:text-amber-200
            transition-colors
          "
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return then.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export default HistoricalRecallBanner;
