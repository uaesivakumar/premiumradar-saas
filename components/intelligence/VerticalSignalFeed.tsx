'use client';

/**
 * VerticalSignalFeed - Sprint P3
 * Real-time feed of vertical-specific signals
 *
 * Shows incoming signals relevant to the active vertical
 * with appropriate context and actions.
 */

import { useState, useEffect } from 'react';
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
// MOCK DATA
// =============================================================================

const MOCK_SIGNALS: Record<Vertical, SignalItem[]> = {
  'banking': [
    {
      id: '1',
      type: 'Hiring Expansion',
      title: 'TechCorp hiring 50+ employees',
      description: 'Major hiring push across engineering and sales',
      entity: 'TechCorp Industries',
      timestamp: new Date(Date.now() - 15 * 60000),
      score: 87,
      priority: 'high',
      suggestedAction: 'Reach out with employee banking proposal',
    },
    {
      id: '2',
      type: 'Series B Funding',
      title: 'CloudFirst raises $30M',
      description: 'Series B led by top-tier VC',
      entity: 'CloudFirst Corp',
      timestamp: new Date(Date.now() - 45 * 60000),
      score: 92,
      priority: 'critical',
      suggestedAction: 'Contact CFO for treasury services',
    },
    {
      id: '3',
      type: 'New Office',
      title: 'GlobalTech opens Dubai office',
      description: 'Expanding MENA operations',
      entity: 'GlobalTech LLC',
      timestamp: new Date(Date.now() - 90 * 60000),
      score: 78,
      priority: 'high',
      suggestedAction: 'Offer local banking onboarding',
    },
  ],
  'insurance': [
    {
      id: '1',
      type: 'New Parent',
      title: 'Ahmed K. welcomed new baby',
      description: 'First child, needs family protection',
      entity: 'Ahmed K.',
      timestamp: new Date(Date.now() - 30 * 60000),
      score: 95,
      priority: 'critical',
      suggestedAction: 'Congratulate and offer protection review',
    },
    {
      id: '2',
      type: 'Marriage',
      title: 'Sara M. recently married',
      description: 'Combined household, needs coverage review',
      entity: 'Sara M.',
      timestamp: new Date(Date.now() - 2 * 60 * 60000),
      score: 88,
      priority: 'high',
      suggestedAction: 'Offer newlywed protection bundle',
    },
    {
      id: '3',
      type: 'Job Promotion',
      title: 'Omar H. promoted to Director',
      description: '40% salary increase, underinsured',
      entity: 'Omar H.',
      timestamp: new Date(Date.now() - 4 * 60 * 60000),
      score: 82,
      priority: 'high',
      suggestedAction: 'Review coverage adequacy',
    },
  ],
  'real-estate': [
    {
      id: '1',
      type: 'Lease Expiring',
      title: 'Johnson family lease ends in 45 days',
      description: 'Looking to buy first home',
      entity: 'Johnson Family',
      timestamp: new Date(Date.now() - 1 * 60 * 60000),
      score: 91,
      priority: 'critical',
      suggestedAction: 'Schedule buyer consultation',
    },
    {
      id: '2',
      type: 'Job Relocation',
      title: 'Mike T. relocating to Dubai',
      description: 'Starting new role in 30 days',
      entity: 'Mike T.',
      timestamp: new Date(Date.now() - 3 * 60 * 60000),
      score: 94,
      priority: 'critical',
      suggestedAction: 'Offer urgent property search',
    },
    {
      id: '3',
      type: 'Pre-Approval',
      title: 'Chen family got mortgage pre-approval',
      description: 'Approved for $500K, actively looking',
      entity: 'Chen Family',
      timestamp: new Date(Date.now() - 6 * 60 * 60000),
      score: 89,
      priority: 'high',
      suggestedAction: 'Send matching property list',
    },
  ],
  'recruitment': [
    {
      id: '1',
      type: 'Open to Work',
      title: 'Senior Developer available',
      description: 'React/Node expert, ex-FAANG',
      entity: 'Alex Chen',
      timestamp: new Date(Date.now() - 20 * 60000),
      score: 93,
      priority: 'critical',
      suggestedAction: 'Match with open tech roles',
    },
    {
      id: '2',
      type: 'Mass Hiring',
      title: 'StartupXYZ hiring 20 engineers',
      description: 'Post-Series A expansion',
      entity: 'StartupXYZ',
      timestamp: new Date(Date.now() - 2 * 60 * 60000),
      score: 88,
      priority: 'high',
      suggestedAction: 'Propose retained search partnership',
    },
    {
      id: '3',
      type: 'Executive Departure',
      title: 'CFO leaving FinanceCo',
      description: 'Urgent backfill needed',
      entity: 'FinanceCo Ltd',
      timestamp: new Date(Date.now() - 4 * 60 * 60000),
      score: 95,
      priority: 'critical',
      suggestedAction: 'Present executive shortlist',
    },
  ],
  'saas-sales': [
    {
      id: '1',
      type: 'Trial Signup',
      title: 'DataDriven Inc started trial',
      description: '5 users active, enterprise ICP',
      entity: 'DataDriven Inc',
      timestamp: new Date(Date.now() - 1 * 60 * 60000),
      score: 92,
      priority: 'critical',
      suggestedAction: 'Schedule onboarding success call',
    },
    {
      id: '2',
      type: 'Competitor Churn',
      title: 'CloudFirst evaluating alternatives',
      description: 'Unhappy with current vendor',
      entity: 'CloudFirst Corp',
      timestamp: new Date(Date.now() - 5 * 60 * 60000),
      score: 89,
      priority: 'high',
      suggestedAction: 'Migration-focused outreach',
    },
    {
      id: '3',
      type: 'Funding Round',
      title: 'TechStart raises Series A',
      description: '$15M raised, scaling ops',
      entity: 'TechStart Inc',
      timestamp: new Date(Date.now() - 8 * 60 * 60000),
      score: 86,
      priority: 'high',
      suggestedAction: 'Present growth solutions',
    },
  ],
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

  useEffect(() => {
    setSignals(MOCK_SIGNALS[vertical]);
  }, [vertical]);

  const filteredSignals = signals.filter(s => {
    if (filter === 'all') return true;
    return s.priority === filter;
  });

  const color = VERTICAL_COLORS[vertical];

  return (
    <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Signal Feed</h3>
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

      {/* Signal List */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} vertical={vertical} />
          ))}
        </AnimatePresence>

        {filteredSignals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No signals matching filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerticalSignalFeed;
