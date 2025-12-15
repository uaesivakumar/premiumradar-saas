'use client';

/**
 * SIVA Insights Panel - Sprint 76: Intelligent UI
 *
 * Displays proactive insights when viewing a company.
 * Auto-fetches from /api/siva/insights when company is selected.
 *
 * Features:
 * - Auto-generated insights (no user query needed)
 * - Priority-ranked insight cards
 * - QTLE score visualization
 * - Recommended actions
 * - Signal summary
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Clock,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
  ChevronRight,
  Zap,
  Building2,
  Mail,
  Phone,
  Linkedin,
} from 'lucide-react';
import {
  getProactiveInsights,
  type ProactiveInsightsResponse,
  type ProactiveInsight,
} from '@/lib/integrations/siva-client';

interface SivaInsightsPanelProps {
  companyId?: string;
  companyName?: string;
  tenantId?: string;
  onClose?: () => void;
  isOpen?: boolean;
  position?: 'right' | 'bottom';
}

const INSIGHT_ICONS: Record<string, typeof Target> = {
  signal_strength: Target,
  timing: Clock,
  quality: Star,
  product_fit: Building2,
  sector: TrendingUp,
  expansion: Zap,
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'border-l-red-500 bg-red-500/5',
  2: 'border-l-amber-500 bg-amber-500/5',
  3: 'border-l-blue-500 bg-blue-500/5',
};

const ACTION_ICONS: Record<string, typeof Mail> = {
  'LinkedIn + Email': Linkedin,
  Email: Mail,
  Newsletter: Mail,
  Internal: CheckCircle2,
};

export function SivaInsightsPanel({
  companyId,
  companyName,
  tenantId,
  onClose,
  isOpen = true,
  position = 'right',
}: SivaInsightsPanelProps) {
  const [insights, setInsights] = useState<ProactiveInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch insights when company changes
  useEffect(() => {
    if (!companyId && !companyName) {
      setInsights(null);
      return;
    }

    const fetchInsights = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getProactiveInsights({
          companyId,
          companyName,
          tenantId,
        });

        if (response.success) {
          setInsights(response);
        } else {
          setError('Unable to load insights');
        }
      } catch (err) {
        console.error('[SivaInsights] Error:', err);
        setError('Failed to fetch insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [companyId, companyName, tenantId]);

  if (!isOpen) return null;

  const panelClasses = position === 'right'
    ? 'fixed right-0 top-0 h-full w-96 border-l'
    : 'fixed bottom-0 left-0 right-0 h-96 border-t';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: position === 'right' ? 100 : 0, y: position === 'bottom' ? 100 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: position === 'right' ? 100 : 0, y: position === 'bottom' ? 100 : 0 }}
        className={`${panelClasses} bg-slate-900/95 backdrop-blur-xl border-white/10 z-50 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">SIVA Intelligence</h3>
              <p className="text-xs text-gray-400">
                {insights?.company?.name || companyName || 'Select a company'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
              <span className="ml-2 text-gray-400 text-sm">Analyzing...</span>
            </div>
          )}

          {error && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && !insights && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">Select a company to view SIVA insights</p>
              <p className="text-gray-500 text-xs mt-1">Intelligence will appear automatically</p>
            </div>
          )}

          {insights && (
            <div className="p-4 space-y-4">
              {/* Scores */}
              <ScoreGrid scores={insights.scores} />

              {/* Insights */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Key Insights
                </h4>
                {insights.insights.slice(0, 4).map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>

              {/* Recommended Actions */}
              {insights.recommended_actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Recommended Actions
                  </h4>
                  {insights.recommended_actions.map((action, idx) => (
                    <ActionCard key={idx} action={action} />
                  ))}
                </div>
              )}

              {/* Signal Summary */}
              <SignalSummary signals={insights.signals_summary} />

              {/* Meta */}
              <div className="pt-2 border-t border-white/5 text-xs text-gray-500">
                <span>Analysis: {insights.analysis_time_ms}ms</span>
                {insights.fromCache && <span className="ml-2">(cached)</span>}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Score Grid Component
function ScoreGrid({ scores }: { scores: ProactiveInsightsResponse['scores'] }) {
  const scoreItems = [
    { label: 'Quality', value: scores.quality, color: 'text-emerald-400' },
    { label: 'Timing', value: scores.timing, color: 'text-cyan-400' },
    { label: 'Product Fit', value: scores.product_fit, color: 'text-purple-400' },
    { label: 'Overall', value: scores.overall, color: 'text-amber-400', highlight: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {scoreItems.map((item) => (
        <div
          key={item.label}
          className={`p-2 rounded-lg ${item.highlight ? 'bg-amber-500/10' : 'bg-white/5'} text-center`}
        >
          <div className={`text-lg font-bold ${item.color}`}>
            {item.value}
          </div>
          <div className="text-xs text-gray-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// Insight Card Component
function InsightCard({ insight }: { insight: ProactiveInsight }) {
  const Icon = INSIGHT_ICONS[insight.type] || Target;
  const priorityClass = PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS[3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border-l-2 ${priorityClass}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-white text-sm">{insight.title}</h5>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{insight.message}</p>
          {insight.action && (
            <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
              <ChevronRight className="w-3 h-3" />
              {insight.action}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Action Card Component
function ActionCard({
  action,
}: {
  action: ProactiveInsightsResponse['recommended_actions'][0];
}) {
  const Icon = ACTION_ICONS[action.channel] || CheckCircle2;
  const priorityColors = {
    high: 'bg-red-500/10 text-red-400',
    medium: 'bg-amber-500/10 text-amber-400',
    low: 'bg-gray-500/10 text-gray-400',
  };

  return (
    <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-white font-medium flex-1">{action.action}</span>
        <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[action.priority]}`}>
          {action.priority}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1 ml-6">{action.description}</p>
    </div>
  );
}

// Signal Summary Component
function SignalSummary({
  signals,
}: {
  signals: ProactiveInsightsResponse['signals_summary'];
}) {
  return (
    <div className="p-3 rounded-lg bg-white/5">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Signal Summary
        </h5>
        <span className="text-sm font-bold text-cyan-400">{signals.total} signals</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {signals.types.slice(0, 5).map((type) => (
          <span
            key={type}
            className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-300"
          >
            {type}
          </span>
        ))}
      </div>
      {signals.avg_confidence > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Avg confidence: {signals.avg_confidence}%
        </div>
      )}
    </div>
  );
}

export default SivaInsightsPanel;
