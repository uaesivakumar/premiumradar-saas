'use client';

/**
 * AILoadingState Component
 * VS7: AI-UX Polishing
 *
 * Displays a loading state with animated dots when AI is processing.
 * Authorization Code: VS1-VS9-APPROVED-20251213
 */

import { motion } from 'framer-motion';

interface AILoadingStateProps {
  message?: string;
  variant?: 'inline' | 'card' | 'overlay';
  className?: string;
}

export function AILoadingState({
  message = 'SIVA is thinking',
  variant = 'card',
  className = '',
}: AILoadingStateProps) {
  const dotVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const containerClass = {
    inline: 'inline-flex items-center gap-2',
    card: 'flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800',
    overlay: 'fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50',
  };

  return (
    <div className={`${containerClass[variant]} ${className}`}>
      <div className={variant === 'overlay' ? 'bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl' : ''}>
        {/* AI Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-blue-200 dark:border-blue-700 border-t-blue-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg">🧠</span>
            </div>
          </div>
        </div>

        {/* Message with animated dots */}
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <span className="font-medium">{message}</span>
          <div className="flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                variants={dotVariants}
                animate="animate"
                style={{ animationDelay: `${i * 0.15}s` }}
                className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                initial={{ y: 0 }}
                transition={{
                  y: {
                    delay: i * 0.15,
                    duration: 0.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
              />
            ))}
          </div>
        </div>

        {variant !== 'inline' && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            Analyzing context and generating response
          </p>
        )}
      </div>
    </div>
  );
}

export default AILoadingState;
