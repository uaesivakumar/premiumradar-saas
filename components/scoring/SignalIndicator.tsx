'use client';

/**
 * Signal Indicator Component
 *
 * Shows individual signals that contribute to Q/T/L/E scores.
 */

import { motion } from 'framer-motion';
import type { Signal, BankingSignal } from '@/lib/scoring/types';

interface SignalIndicatorProps {
  signal: Signal | BankingSignal;
  showWeight?: boolean;
  compact?: boolean;
}

const categoryIcons = {
  quality: '🎯',
  timing: '⏰',
  likelihood: '📊',
  engagement: '💬',
};

const impactColors = {
  positive: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '↑' },
  negative: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '↓' },
  neutral: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '→' },
};

const urgencyBadges = {
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  low: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export function SignalIndicator({ signal, showWeight = true, compact = false }: SignalIndicatorProps) {
  const colors = impactColors[signal.impact];
  const isBankingSignal = 'urgencyLevel' in signal;

  if (compact) {
    return (
      <div
        className={`
          inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
          ${colors.bg} ${colors.border} border
        `}
      >
        <span>{categoryIcons[signal.category]}</span>
        <span className={colors.text}>{signal.name}</span>
        <span className="font-medium">{colors.icon}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        p-3 rounded-lg border
        ${colors.bg} ${colors.border}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryIcons[signal.category]}</span>
          <div>
            <h4 className={`font-medium ${colors.text}`}>{signal.name}</h4>
            <p className="text-sm text-gray-600 mt-0.5">{signal.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBankingSignal && (
            <span
              className={`
                px-2 py-0.5 rounded text-xs font-medium
                ${urgencyBadges[(signal as BankingSignal).urgencyLevel].bg}
                ${urgencyBadges[(signal as BankingSignal).urgencyLevel].text}
              `}
            >
              {(signal as BankingSignal).urgencyLevel}
            </span>
          )}
          <span
            className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg
              ${colors.bg} ${colors.text}
            `}
          >
            {colors.icon}
          </span>
        </div>
      </div>

      {showWeight && (
        <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Source: <span className="font-medium">{signal.source}</span>
          </span>
          <span className="text-gray-500">
            Weight: <span className="font-medium">{(signal.weight * 100).toFixed(0)}%</span>
          </span>
        </div>
      )}
    </motion.div>
  );
}

interface SignalListProps {
  signals: (Signal | BankingSignal)[];
  category?: Signal['category'];
  limit?: number;
}

export function SignalList({ signals, category, limit }: SignalListProps) {
  let filtered = category ? signals.filter((s) => s.category === category) : signals;
  if (limit) filtered = filtered.slice(0, limit);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No signals detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((signal) => (
        <SignalIndicator key={signal.id} signal={signal} />
      ))}
    </div>
  );
}

export default SignalIndicator;
