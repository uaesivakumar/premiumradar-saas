'use client';

/**
 * AIFallbackBanner Component
 * VS7: AI-UX Polishing
 *
 * Displays a banner when AI is using fallback/cached responses.
 * Authorization Code: VS1-VS9-APPROVED-20251213
 */

import { motion } from 'framer-motion';
import { useState } from 'react';

interface AIFallbackBannerProps {
  type: 'fallback' | 'cached' | 'degraded';
  message?: string;
  dismissible?: boolean;
  className?: string;
}

const bannerConfig = {
  fallback: {
    icon: '⚡',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-400',
    defaultMessage: 'Using simplified response - AI service temporarily unavailable',
  },
  cached: {
    icon: '💾',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-700 dark:text-blue-400',
    defaultMessage: 'Showing cached response for faster loading',
  },
  degraded: {
    icon: '🔧',
    bgColor: 'bg-gray-50 dark:bg-gray-800',
    borderColor: 'border-gray-200 dark:border-gray-700',
    textColor: 'text-gray-600 dark:text-gray-400',
    defaultMessage: 'Operating in degraded mode - some features may be limited',
  },
};

export function AIFallbackBanner({
  type,
  message,
  dismissible = true,
  className = '',
}: AIFallbackBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = bannerConfig[type];

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-lg px-4 py-2 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <span className={`text-sm font-medium ${config.textColor}`}>
          {message || config.defaultMessage}
        </span>
      </div>

      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className={`p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded ${config.textColor}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

export default AIFallbackBanner;
