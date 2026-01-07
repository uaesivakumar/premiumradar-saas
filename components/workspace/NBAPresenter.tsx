/**
 * NBA Presenter Component
 *
 * S360: NBA Presenter
 * Behavior Contract B011: NBA visually prominent and singular
 *
 * Displays the single Next Best Action prominently in the UI.
 * Never shows competing actions - only THE action to take.
 *
 * Usage:
 * ```tsx
 * <NBAPresenter
 *   nba={nbaResult.nba}
 *   onComplete={() => handleComplete()}
 *   onDismiss={() => handleDismiss()}
 *   onDefer={() => handleDefer()}
 * />
 * ```
 */

'use client';

import React, { useState } from 'react';

export interface NBAData {
  id: string;
  type: string;
  leadId: string;
  companyId: string;
  companyName: string;
  contactName?: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  reason: string;
  actionText: string;
  supportingInfo?: string;
  expiresAt?: string;
}

export interface NBAPresenterProps {
  nba: NBAData | null;
  onComplete: (nbaId: string) => void;
  onDismiss: (nbaId: string) => void;
  onDefer?: (nbaId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const urgencyStyles = {
  critical: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
    badge: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    icon: 'text-red-500 dark:text-red-400',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
  high: {
    container: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
    icon: 'text-orange-500 dark:text-orange-400',
    button: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  medium: {
    container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    icon: 'text-blue-500 dark:text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  low: {
    container: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: 'text-gray-500 dark:text-gray-400',
    button: 'bg-gray-600 hover:bg-gray-700 text-white',
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  CALL_NOW: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  SEND_EMAIL: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  FOLLOW_UP: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  SCHEDULE_MEETING: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  RESEARCH_COMPANY: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

export function NBAPresenter({
  nba,
  onComplete,
  onDismiss,
  onDefer,
  isLoading = false,
  className = '',
}: NBAPresenterProps) {
  const [isActioning, setIsActioning] = useState(false);

  if (isLoading) {
    return (
      <div className={`rounded-lg border p-6 animate-pulse bg-gray-50 dark:bg-gray-800 ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!nba) {
    return (
      <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center ${className}`}>
        <svg
          className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          All caught up!
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No pending actions right now. Great work!
        </p>
      </div>
    );
  }

  const styles = urgencyStyles[nba.urgency];
  const icon = typeIcons[nba.type] || typeIcons.FOLLOW_UP;

  const handleComplete = async () => {
    setIsActioning(true);
    try {
      await onComplete(nba.id);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDismiss = async () => {
    setIsActioning(true);
    try {
      await onDismiss(nba.id);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDefer = async () => {
    if (!onDefer) return;
    setIsActioning(true);
    try {
      await onDefer(nba.id);
    } finally {
      setIsActioning(false);
    }
  };

  return (
    <div
      className={`
        rounded-lg border-2 p-5 transition-all
        ${styles.container}
        ${className}
      `}
      role="region"
      aria-label="Next Best Action"
    >
      {/* Header with urgency badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`
            px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
            ${styles.badge}
          `}
        >
          {nba.urgency === 'critical' ? 'Act Now' : `${nba.urgency} Priority`}
        </span>
        {nba.expiresAt && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Expires {formatExpiry(nba.expiresAt)}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-3 rounded-full bg-white/50 dark:bg-black/20 ${styles.icon}`}>
          {icon}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {nba.actionText}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {nba.reason}
          </p>
          {nba.supportingInfo && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {nba.supportingInfo}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleComplete}
          disabled={isActioning}
          className={`
            flex-1 px-4 py-2.5 rounded-lg font-medium
            transition-colors disabled:opacity-50
            ${styles.button}
          `}
        >
          {isActioning ? 'Processing...' : 'Mark Complete'}
        </button>
        {onDefer && (
          <button
            onClick={handleDefer}
            disabled={isActioning}
            className="
              px-4 py-2.5 rounded-lg font-medium
              bg-white text-gray-700 border border-gray-300
              hover:bg-gray-50
              dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700
              transition-colors disabled:opacity-50
            "
          >
            Later
          </button>
        )}
        <button
          onClick={handleDismiss}
          disabled={isActioning}
          className="
            px-4 py-2.5 rounded-lg font-medium
            text-gray-500 hover:text-gray-700 hover:bg-gray-100
            dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800
            transition-colors disabled:opacity-50
          "
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Company link */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <a
          href={`/leads/${nba.leadId}`}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          View {nba.companyName} details &rarr;
        </a>
      </div>
    </div>
  );
}

function formatExpiry(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60)));

  if (hoursLeft < 1) return 'soon';
  if (hoursLeft === 1) return 'in 1 hour';
  if (hoursLeft < 24) return `in ${hoursLeft} hours`;
  return expiry.toLocaleDateString();
}

export default NBAPresenter;
