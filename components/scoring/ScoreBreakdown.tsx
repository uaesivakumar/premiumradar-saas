'use client';

/**
 * Score Breakdown Component
 *
 * Detailed signal breakdown with explanations for each Q/T/L/E category.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QTLEScore, Signal, CompanyProfile } from '@/lib/scoring/types';
import { SignalList } from './SignalIndicator';

interface ScoreBreakdownProps {
  score: QTLEScore;
  signals: Signal[];
  explanations?: string[];
}

type Category = 'quality' | 'timing' | 'likelihood' | 'engagement';

const categoryInfo: Record<Category, { icon: string; color: string; description: string }> = {
  quality: {
    icon: '🎯',
    color: 'emerald',
    description: 'How well does this prospect match your ideal customer profile?',
  },
  timing: {
    icon: '⏰',
    color: 'blue',
    description: 'Is this the right time to reach out based on market signals?',
  },
  likelihood: {
    icon: '📊',
    color: 'purple',
    description: 'What is the probability of converting this prospect?',
  },
  engagement: {
    icon: '💬',
    color: 'orange',
    description: 'How actively engaged is this prospect with your brand?',
  },
};

export function ScoreBreakdown({ score, signals, explanations = [] }: ScoreBreakdownProps) {
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null);

  const categories: Category[] = ['quality', 'timing', 'likelihood', 'engagement'];

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-emerald-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Score Breakdown</h3>
        <p className="text-sm text-gray-500 mt-1">
          Click on each category to see contributing signals
        </p>
      </div>

      {/* Category Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {categories.map((category) => {
          const info = categoryInfo[category];
          const value = score[category];
          const categorySignals = signals.filter((s) => s.category === category);
          const isExpanded = expandedCategory === category;

          return (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {category}
                    </div>
                    <div className="text-xs text-gray-500">{info.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xl font-bold ${getScoreColor(value)}`}>{value}</span>
                  <span className="text-gray-400 text-sm">
                    {categorySignals.length} signal{categorySignals.length !== 1 ? 's' : ''}
                  </span>
                  <motion.span
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    className="text-gray-400"
                  >
                    ▼
                  </motion.span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-700/30">
                      {categorySignals.length > 0 ? (
                        <SignalList signals={categorySignals} />
                      ) : (
                        <div className="py-4 text-center text-gray-500">
                          No signals detected for this category
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Explanations */}
      {explanations.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Key Insights</h4>
          <ul className="space-y-1">
            {explanations.map((explanation, idx) => (
              <li key={idx} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <span className="text-blue-500">•</span>
                {explanation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ScoreBreakdown;
