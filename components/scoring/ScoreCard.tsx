'use client';

/**
 * Score Card Component
 *
 * Displays Q/T/L/E scores for a company with visual indicators.
 */

import { motion } from 'framer-motion';
import type { QTLEScore } from '@/lib/scoring/types';

interface ScoreCardProps {
  score: QTLEScore;
  companyName?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const gradeColors = {
  A: { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500/30' },
  B: { bg: 'bg-blue-500', text: 'text-blue-500', ring: 'ring-blue-500/30' },
  C: { bg: 'bg-yellow-500', text: 'text-yellow-500', ring: 'ring-yellow-500/30' },
  D: { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500/30' },
  F: { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500/30' },
};

const categoryLabels = {
  quality: { label: 'Quality', description: 'Profile match' },
  timing: { label: 'Timing', description: 'Right moment' },
  likelihood: { label: 'Likelihood', description: 'Conversion probability' },
  engagement: { label: 'Engagement', description: 'Brand interaction' },
};

export function ScoreCard({
  score,
  companyName,
  showDetails = true,
  size = 'md',
  onClick,
}: ScoreCardProps) {
  const colors = gradeColors[score.grade];

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const gradeSizes = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {companyName && (
            <h3 className="font-semibold text-gray-900 dark:text-white">{companyName}</h3>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {score.composite}
            </span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
        </div>

        {/* Grade Badge */}
        <div
          className={`
            ${gradeSizes[size]} rounded-full flex items-center justify-center font-bold text-white
            ${colors.bg} ring-4 ${colors.ring}
          `}
        >
          {score.grade}
        </div>
      </div>

      {/* Category Scores */}
      {showDetails && (
        <div className="space-y-3">
          {(['quality', 'timing', 'likelihood', 'engagement'] as const).map((category) => (
            <ScoreBar
              key={category}
              label={categoryLabels[category].label}
              value={score[category]}
              description={categoryLabels[category].description}
            />
          ))}
        </div>
      )}

      {/* Confidence Indicator */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Confidence</span>
          <span className={`font-medium ${score.confidence >= 70 ? 'text-green-600' : score.confidence >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
            {score.confidence}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
  description?: string;
}

function ScoreBar({ label, value, description }: ScoreBarProps) {
  const getBarColor = (val: number) => {
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 60) return 'bg-blue-500';
    if (val >= 40) return 'bg-yellow-500';
    if (val >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${getBarColor(value)}`}
        />
      </div>
      {description && (
        <span className="text-xs text-gray-400 mt-0.5">{description}</span>
      )}
    </div>
  );
}

export default ScoreCard;
