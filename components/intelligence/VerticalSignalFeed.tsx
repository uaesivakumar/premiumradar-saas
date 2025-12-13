'use client';

/**
 * VerticalSignalFeed - Sprint P3 / VS11.4
 * Real-time feed of vertical-specific signals
 *
 * VS11.4: Now fetches real signals from OS discovery API.
 * BANKING ONLY - Other verticals show "Coming Soon" placeholder.
 *
 * Authorization Code: VS11-FRONTEND-WIRING-20251213
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Shield,
  Home,
  Users,
  Layers,
  Clock,
  ArrowRight,
  Zap,
  Star,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';
import type { Vertical } from '@/lib/intelligence/context/types';

// =============================================================================
// TYPES
// =============================================================================

interface SignalItem {
  id: string;
  type: string;
  title: string;
  description: string;
  entity: string;
  timestamp: Date;
  score: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  suggestedAction: string;
}

// =============================================================================
// SIGNAL TYPE MAPPINGS
// =============================================================================

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  'hiring-expansion': 'Hiring Expansion',
  'headcount-jump': 'Headcount Jump',
  'office-opening': 'Office Opening',
  'market-entry': 'Market Entry',
  'funding-round': 'Funding Round',
  'project-award': 'Project Award',
  'subsidiary-creation': 'Subsidiary Creation',
  'leadership-hiring': 'Leadership Hiring',
};

const SIGNAL_ACTIONS: Record<string, string> = {
  'hiring-expansion': 'Reach out with employee banking proposal',
  'headcount-jump': 'Present payroll solutions for growing team',
  'office-opening': 'Offer local banking onboarding',
  'market-entry': 'Welcome to UAE with corporate banking intro',
  'funding-round': 'Contact CFO for treasury services',
  'project-award': 'Propose working capital solutions',
  'subsidiary-creation': 'Offer multi-entity banking setup',
  'leadership-hiring': 'Connect with new leadership on banking needs',
};

const VERTICAL_ICONS: Record<Vertical, React.ElementType> = {
  'banking': Building2,
  'insurance': Shield,
  'real-estate': Home,
  'recruitment': Users,
  'saas-sales': Layers,
};

const VERTICAL_COLORS: Record<Vertical, string> = {
  'banking': 'blue',
  'insurance': 'emerald',
  'real-estate': 'amber',
  'recruitment': 'purple',
  'saas-sales': 'cyan',
};

// =============================================================================
// HELPERS
// =============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function getPriorityStyles(priority: SignalItem['priority']): string {
  switch (priority) {
    case 'critical':
      return 'border-red-500/50 bg-red-500/5';
    case 'high':
      return 'border-amber-500/30 bg-amber-500/5';
    case 'medium':
      return 'border-blue-500/20 bg-blue-500/5';
    default:
      return 'border-white/10 bg-white/5';
  }
}

function scoreToPriority(score: number): SignalItem['priority'] {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

// =============================================================================
// COMPONENTS
// =============================================================================

function SignalCard({ signal, vertical }: { signal: SignalItem; vertical: Vertical }) {
  const Icon = VERTICAL_ICONS[vertical];
  const color = VERTICAL_COLORS[vertical];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 rounded-xl border ${getPriorityStyles(signal.priority)} backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
            <Icon className={`w-4 h-4 text-${color}-400`} />
          </div>
          <div>
            <span className={`text-xs font-medium text-${color}-400`}>
              {signal.type}
            </span>
            {signal.priority === 'critical' && (
              <Star className="inline w-3 h-3 ml-1 text-amber-400 fill-amber-400" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(signal.timestamp)}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-white mb-1">{signal.title}</h4>
        <p className="text-xs text-gray-400">{signal.description}</p>
      </div>

      {/* Entity & Score */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-300">{signal.entity}</span>
        <div className={`px-2 py-0.5 rounded-full bg-${color}-500/10 text-${color}-400 text-xs font-medium`}>
          Score: {signal.score}
        </div>
      </div>

      {/* Action */}
      <button className="w-full flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors group">
        <span className="flex items-center gap-2">
          <Zap className="w-3 h-3" />
          {signal.suggestedAction}
        </span>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VerticalSignalFeed() {
  const vertical = useSalesContextStore(selectVertical);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VS11.4: Fetch real signals from OS discovery API
  const fetchSignals = useCallback(async () => {
    if (vertical !== 'banking') {
      setSignals([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/os/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: 'banking',
          sub_vertical: 'employee-banking',
          region_code: 'UAE',
          limit: 10,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch signals');
      }

      // Transform OS discovery results to SignalItem format
      const transformedSignals: SignalItem[] = (result.data?.leads || result.data?.companies || [])
        .slice(0, 10)
        .map((lead: {
          id?: string;
          name?: string;
          company_name?: string;
          signals?: Array<{
            type?: string;
            title?: string;
            description?: string;
            date?: string;
          }>;
          score?: number;
          qtle_score?: number;
        }, idx: number) => {
          const topSignal = lead.signals?.[0] || {};
          const signalType = topSignal.type || 'hiring-expansion';
          const score = lead.score || lead.qtle_score || 70;

          return {
            id: lead.id || `signal-${idx}`,
            type: SIGNAL_TYPE_LABELS[signalType] || signalType,
            title: topSignal.title || `${lead.name || lead.company_name} - ${SIGNAL_TYPE_LABELS[signalType] || 'New Signal'}`,
            description: topSignal.description || `Signal detected for ${lead.name || lead.company_name}`,
            entity: lead.name || lead.company_name || 'Unknown Company',
            timestamp: new Date(topSignal.date || Date.now()),
            score,
            priority: scoreToPriority(score),
            suggestedAction: SIGNAL_ACTIONS[signalType] || 'Review and reach out',
          };
        });

      setSignals(transformedSignals);
    } catch (err) {
      console.error('[VerticalSignalFeed] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load signals');
      setSignals([]);
    } finally {
      setIsLoading(false);
    }
  }, [vertical]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Only Banking is active - other verticals show Coming Soon
  const isActive = vertical === 'banking';
  const Icon = VERTICAL_ICONS[vertical];
  const color = VERTICAL_COLORS[vertical];

  if (!isActive) {
    return (
      <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Signal Feed</h3>
        </div>
        <div className="p-8 text-center">
          <div className="mb-4">
            <Icon className={`w-12 h-12 mx-auto text-${color}-400 opacity-50`} />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Coming Soon</h4>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Signal detection for this vertical is not yet available.
            Currently only Banking signals are supported.
          </p>
        </div>
      </div>
    );
  }

  const filteredSignals = signals.filter(s => {
    if (filter === 'all') return true;
    return s.priority === filter;
  });

  return (
    <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">Signal Feed</h3>
            <button
              onClick={fetchSignals}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh signals"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex gap-1">
            {(['all', 'critical', 'high'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === f
                    ? `bg-${color}-500/20 text-${color}-400`
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && signals.length === 0 && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-blue-400 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Loading signals from OS...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 mx-4 my-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchSignals}
            className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Signal List */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} vertical={vertical} />
          ))}
        </AnimatePresence>

        {!isLoading && !error && filteredSignals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No signals matching filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerticalSignalFeed;
