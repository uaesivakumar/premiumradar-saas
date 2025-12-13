'use client';

/**
 * VerticalInsightPanel - Sprint P3 / VS11.5
 * Displays vertical-specific intelligence insights
 *
 * VS11.5: Now fetches real data from dashboard stats API.
 * BANKING ONLY - Other verticals show "Coming Soon" placeholder.
 *
 * Authorization Code: VS11-FRONTEND-WIRING-20251213
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Shield,
  Home,
  Users,
  Layers,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useSalesContextStore, selectVertical } from '@/lib/stores/sales-context-store';
import type { Vertical } from '@/lib/intelligence/context/types';

// =============================================================================
// TYPES
// =============================================================================

interface InsightData {
  topSignals: SignalInsight[];
  patterns: PatternInsight[];
  opportunities: OpportunityInsight[];
  recommendations: string[];
}

interface SignalInsight {
  id: string;
  name: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  importance: 'high' | 'medium' | 'low';
}

interface PatternInsight {
  id: string;
  name: string;
  matches: number;
  action: string;
}

interface OpportunityInsight {
  id: string;
  title: string;
  score: number;
  signals: string[];
}

// =============================================================================
// VERTICAL CONFIGURATIONS
// =============================================================================

const VERTICAL_CONFIGS: Record<Vertical, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  title: string;
  signalLabel: string;
  targetLabel: string;
}> = {
  'banking': {
    icon: Building2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    title: 'Banking Intelligence',
    signalLabel: 'Company Signals',
    targetLabel: 'Corporate Accounts',
  },
  'insurance': {
    icon: Shield,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    title: 'Insurance Intelligence',
    signalLabel: 'Life Event Signals',
    targetLabel: 'Individuals',
  },
  'real-estate': {
    icon: Home,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    title: 'Real Estate Intelligence',
    signalLabel: 'Buyer/Seller Signals',
    targetLabel: 'Property Seekers',
  },
  'recruitment': {
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    title: 'Recruitment Intelligence',
    signalLabel: 'Talent Signals',
    targetLabel: 'Candidates & Companies',
  },
  'saas-sales': {
    icon: Layers,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    title: 'SaaS Sales Intelligence',
    signalLabel: 'Buying Intent Signals',
    targetLabel: 'Target Accounts',
  },
};

// Signal type display names
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

// Default empty data structure
function getEmptyInsightData(): InsightData {
  return {
    topSignals: [],
    patterns: [],
    opportunities: [],
    recommendations: [],
  };
}

// =============================================================================
// COMPONENTS
// =============================================================================

function SignalCard({ signal, verticalColor }: {
  signal: SignalInsight;
  verticalColor: string;
}) {
  const TrendIcon = signal.trend === 'up' ? TrendingUp :
    signal.trend === 'down' ? AlertCircle : Zap;

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          signal.importance === 'high' ? 'bg-red-400' :
          signal.importance === 'medium' ? 'bg-amber-400' : 'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-200">{signal.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{signal.count}</span>
        <TrendIcon className={`w-4 h-4 ${
          signal.trend === 'up' ? 'text-green-400' :
          signal.trend === 'down' ? 'text-red-400' : 'text-gray-400'
        }`} />
      </div>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: PatternInsight }) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{pattern.name}</span>
        <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300">
          {pattern.matches} matches
        </span>
      </div>
      <p className="text-xs text-gray-400">{pattern.action}</p>
    </div>
  );
}

function OpportunityCard({ opportunity, verticalColor, bgColor }: {
  opportunity: OpportunityInsight;
  verticalColor: string;
  bgColor: string;
}) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{opportunity.title}</span>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${verticalColor}`}>
          {opportunity.score}
        </div>
      </div>
      <div className="flex gap-2">
        {opportunity.signals.map((signal) => (
          <span
            key={signal}
            className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-400"
          >
            {signal}
          </span>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function VerticalInsightPanel() {
  const vertical = useSalesContextStore(selectVertical);
  const config = VERTICAL_CONFIGS[vertical];
  const [data, setData] = useState<InsightData>(getEmptyInsightData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VS11.5: Fetch real data from dashboard stats API
  const fetchInsights = useCallback(async () => {
    if (vertical !== 'banking') {
      setData(getEmptyInsightData());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch dashboard stats which includes signals and insights
      const response = await fetch(`/api/dashboard/stats?vertical=banking&subVertical=employee-banking&regions=UAE`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch insights');
      }

      const stats = result.data;

      // Transform stats to InsightData format
      const transformedData: InsightData = {
        topSignals: Object.entries(stats.signals?.byType || {}).map(([type, count], idx) => ({
          id: `sig-${idx}`,
          name: SIGNAL_TYPE_LABELS[type] || type,
          count: count as number,
          trend: 'up' as const,
          importance: (count as number) > 15 ? 'high' as const : 'medium' as const,
        })),
        patterns: [
          {
            id: 'p1',
            name: 'Expansion + Payroll',
            matches: Math.round((stats.scores?.topPerformers || 0) / 2),
            action: 'Reach out with employee banking',
          },
          {
            id: 'p2',
            name: 'Post-Funding Growth',
            matches: Math.round((stats.scores?.topPerformers || 0) / 3),
            action: 'Present treasury solutions',
          },
        ],
        opportunities: (stats.recentActivity || []).slice(0, 3).map((act: {
          id: string;
          companyName: string;
          score?: number;
          signalType: string;
        }) => ({
          id: act.id,
          title: act.companyName,
          score: act.score || 75,
          signals: [act.signalType || 'Expansion'],
        })),
        recommendations: (stats.aiInsights || [])
          .filter((i: { actionable?: boolean }) => i.actionable)
          .slice(0, 3)
          .map((i: { description: string }) => i.description),
      };

      // If no recommendations from API, add default ones
      if (transformedData.recommendations.length === 0) {
        transformedData.recommendations = [
          'Focus on companies with recent hiring signals',
          'Prioritize accounts with high QTLE scores',
          'Target companies entering UAE market',
        ];
      }

      setData(transformedData);
    } catch (err) {
      console.error('[VerticalInsightPanel] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setIsLoading(false);
    }
  }, [vertical]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const Icon = config.icon;

  // Only Banking is active - other verticals show Coming Soon
  const isActive = vertical === 'banking';

  if (!isActive) {
    return (
      <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
        <div className={`p-4 ${config.bgColor} border-b border-white/10`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-white font-medium">{config.title}</h3>
              <p className="text-xs text-gray-400">
                Targeting: {config.targetLabel}
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="mb-4">
            <Icon className={`w-12 h-12 mx-auto ${config.color} opacity-50`} />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Coming Soon</h4>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            We&apos;re expanding to {config.title.replace(' Intelligence', '')}!
            Request early access to be notified when this vertical is available.
          </p>
          <button className={`mt-4 px-4 py-2 rounded-lg ${config.bgColor} ${config.color} text-sm font-medium hover:opacity-80 transition-opacity`}>
            Request Early Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${config.bgColor} border-b border-white/10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-white font-medium">{config.title}</h3>
              <p className="text-xs text-gray-400">
                Targeting: {config.targetLabel}
              </p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh insights"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && data.topSignals.length === 0 && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto text-blue-400 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Loading insights...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 mx-4 my-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Top Signals */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">
              {config.signalLabel}
            </h4>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <div className="space-y-2">
            {data.topSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                verticalColor={config.color}
              />
            ))}
          </div>
        </section>

        {/* Patterns Detected */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Patterns Detected
            </h4>
          </div>
          <div className="space-y-2">
            {data.patterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </section>

        {/* Top Opportunities */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Top Opportunities
            </h4>
          </div>
          <div className="space-y-2">
            {data.opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                verticalColor={config.color}
                bgColor={config.bgColor}
              />
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section>
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            SIVA Recommendations
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-gray-400">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                {rec}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default VerticalInsightPanel;
