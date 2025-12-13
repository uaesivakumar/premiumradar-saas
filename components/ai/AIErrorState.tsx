'use client';

/**
 * AIErrorState Component
 * VS7: AI-UX Polishing
 *
 * Displays a user-friendly error message when AI processing fails.
 * Authorization Code: VS1-VS9-APPROVED-20251213
 */

import { motion } from 'framer-motion';

interface AIErrorStateProps {
  message?: string;
  details?: string;
  onRetry?: () => void;
  variant?: 'inline' | 'card';
  className?: string;
}

export function AIErrorState({
  message = 'Unable to generate AI response',
  details,
  onRetry,
  variant = 'card',
  className = '',
}: AIErrorStateProps) {
  const containerClass = {
    inline: 'inline-flex items-center gap-2 text-red-600',
    card: 'flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`${containerClass[variant]} ${className}`}
    >
      {/* Error Icon */}
      <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full mb-3">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      {/* Message */}
      <h4 className="font-medium text-red-700 dark:text-red-400 text-center">
        {message}
      </h4>

      {details && (
        <p className="text-sm text-red-600 dark:text-red-500 mt-1 text-center">
          {details}
        </p>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Try Again
        </button>
      )}

      <p className="text-xs text-red-400 dark:text-red-600 mt-3 text-center">
        If the problem persists, our team has been notified
      </p>
    </motion.div>
  );
}

export default AIErrorState;
