'use client';

/**
 * SignalHistory - S139: Company Profiles
 *
 * Timeline view of company signals showing:
 * - Signal type and category
 * - Source and confidence
 * - Date and freshness
 * - Impact on QTLE score
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Zap,
  Filter,
} from 'lucide-react';

export interface SignalItem {
  id: string;
  type: string;
  title: string;
  description: string;
  category: 'quality' | 'timing' | 'likelihood' | 'engagement';
  impact: 'positive' | 'negative' | 'neutral';
  source: string;
  sourceUrl?: string;
  confidence: number;
  date: string;
  scoreContribution: number;
}

export interface SignalHistoryProps {
  signals: SignalItem[];
  maxVisible?: number;
}

const CATEGORY_CONFIG = {
  quality: { label: 'Quality', color: 'bg-purple-100 text-purple-700', icon: '🎯' },
  timing: { label: 'Timing', color: 'bg-blue-100 text-blue-700', icon: '⏰' },
  likelihood: { label: 'Likelihood', color: 'bg-green-100 text-green-700', icon: '📈' },
  engagement: { label: 'Engagement', color: 'bg-amber-100 text-amber-700', icon: '💬' },
};

const IMPACT_CONFIG = {
  positive: { icon: TrendingUp, color: 'text-green-600', label: 'Positive' },
  negative: { icon: TrendingDown, color: 'text-red-600', label: 'Negative' },
  neutral: { icon: Minus, color: 'text-gray-500', label: 'Neutral' },
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function getFreshnessColor(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return 'border-l-green-500';
  if (diffDays <= 7) return 'border-l-blue-500';
  if (diffDays <= 14) return 'border-l-yellow-500';
  return 'border-l-gray-300';
}

export function SignalHistory({ signals, maxVisible = 5 }: SignalHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredSignals = filterCategory
    ? signals.filter((s) => s.category === filterCategory)
    : signals;

  const sortedSignals = [...filteredSignals].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const visibleSignals = expanded ? sortedSignals : sortedSignals.slice(0, maxVisible);
  const hasMore = sortedSignals.length > maxVisible;

  const toggleSignalExpand = (id: string) => {
    setExpandedSignals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate category distribution
  const categoryDistribution = signals.reduce(
    (acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Signal History</h3>
              <p className="text-sm text-gray-500">{signals.length} signals detected</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label} ({categoryDistribution[key] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Distribution Bar */}
        <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
          {Object.entries(categoryDistribution).map(([cat, count]) => {
            const percentage = (count / signals.length) * 100;
            const colors: Record<string, string> = {
              quality: 'bg-purple-500',
              timing: 'bg-blue-500',
              likelihood: 'bg-green-500',
              engagement: 'bg-amber-500',
            };
            return (
              <div
                key={cat}
                className={`${colors[cat] || 'bg-gray-300'}`}
                style={{ width: `${percentage}%` }}
                title={`${CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.label}: ${count}`}
              />
            );
          })}
        </div>
      </div>

      {/* Signal List */}
      <div className="divide-y divide-gray-100">
        <AnimatePresence mode="popLayout">
          {visibleSignals.map((signal, index) => {
            const category = CATEGORY_CONFIG[signal.category];
            const impact = IMPACT_CONFIG[signal.impact];
            const ImpactIcon = impact.icon;
            const isExpanded = expandedSignals.has(signal.id);

            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
                className={`border-l-4 ${getFreshnessColor(signal.date)}`}
              >
                <div
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSignalExpand(signal.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Impact Icon */}
                    <div className={`mt-0.5 ${impact.color}`}>
                      <ImpactIcon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{signal.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${category.color}`}>
                          {category.label}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-1">{signal.description}</p>

                      {/* Meta Row */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getRelativeTime(signal.date)}
                        </span>
                        <span>Source: {signal.source}</span>
                        <span>Confidence: {signal.confidence}%</span>
                      </div>
                    </div>

                    {/* Score Contribution */}
                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${signal.scoreContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {signal.scoreContribution >= 0 ? '+' : ''}
                        {signal.scoreContribution}
                      </div>
                      <div className="text-xs text-gray-500">Score Impact</div>
                    </div>

                    {/* Expand Toggle */}
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pl-9 border-t border-gray-100 pt-4"
                      >
                        <p className="text-sm text-gray-600 mb-3">{signal.description}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-500">
                            Type: <span className="font-medium">{signal.type}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            Date: {new Date(signal.date).toLocaleDateString()}
                          </span>
                          {signal.sourceUrl && (
                            <a
                              href={signal.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Source <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {sortedSignals.length - maxVisible} More Signals
            </>
          )}
        </button>
      )}

      {/* Empty State */}
      {signals.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No signals detected for this company yet.</p>
        </div>
      )}
    </div>
  );
}

export default SignalHistory;
