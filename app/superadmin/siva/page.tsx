'use client';

/**
 * SIVA Intelligence Dashboard - Professional Control Panel
 *
 * Design: Linear/Stripe inspired - minimal, functional, no gradients
 * AI performance monitoring:
 * - Quality & accuracy metrics
 * - Token usage and costs
 * - Response times
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  DollarSign,
  Clock,
  Target,
  LineChart,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';

interface SivaMetrics {
  overall: {
    healthScore: number; // 0-100
    trend: 'improving' | 'stable' | 'declining';
    trendPercent: number;
  };
  quality: {
    current: number;
    previous: number;
    history: Array<{ date: string; value: number }>;
  };
  accuracy: {
    current: number;
    previous: number;
    history: Array<{ date: string; value: number }>;
  };
  responseTime: {
    avgMs: number;
    p95Ms: number;
    history: Array<{ date: string; value: number }>;
  };
  tokens: {
    todayInput: number;
    todayOutput: number;
    efficiency: number; // output/input ratio
    history: Array<{ date: string; input: number; output: number }>;
  };
  costs: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    byProvider: {
      openai: number;
      apollo: number;
      serp: number;
    };
    history: Array<{ date: string; amount: number }>;
  };
  interactions: {
    today: number;
    successful: number;
    failed: number;
    avgSatisfaction: number;
  };
}

/**
 * Fetch SIVA metrics from API
 */
async function fetchSivaMetrics(days: number): Promise<SivaMetrics | null> {
  try {
    const response = await fetch(`/api/superadmin/siva/metrics?days=${days}`);
    const data = await response.json();

    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('[SIVA Dashboard] Failed to fetch metrics:', error);
    return null;
  }
}

export default function SivaDashboard() {
  const [metrics, setMetrics] = useState<SivaMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };

  useEffect(() => {
    async function loadMetrics() {
      setIsLoading(true);
      setError(null);

      const data = await fetchSivaMetrics(daysMap[timeRange]);

      if (data) {
        setMetrics(data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load SIVA metrics');
      }

      setIsLoading(false);
    }

    loadMetrics();

    // Auto-refresh every 60 seconds
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleRefresh = async () => {
    setIsLoading(true);
    const data = await fetchSivaMetrics(daysMap[timeRange]);
    if (data) {
      setMetrics(data);
      setLastUpdated(new Date());
      setError(null);
    } else {
      setError('Failed to refresh metrics');
    }
    setIsLoading(false);
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-5 h-5 text-neutral-500 animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const trendIcon = metrics.overall.trend === 'improving' ? (
    <ArrowUp className="w-4 h-4 text-emerald-400" />
  ) : metrics.overall.trend === 'declining' ? (
    <ArrowDown className="w-4 h-4 text-red-400" />
  ) : (
    <Minus className="w-4 h-4 text-neutral-500" />
  );

  const healthColor =
    metrics.overall.healthScore >= 80
      ? 'text-emerald-400'
      : metrics.overall.healthScore >= 60
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white">Intelligence</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            SIVA performance
            {lastUpdated && (
              <span className="text-neutral-600 ml-2">· {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex bg-neutral-800/50 rounded p-0.5">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  timeRange === range
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-neutral-500 text-xs mb-1">Health Index</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-semibold ${healthColor}`}>
                {metrics.overall.healthScore}
              </span>
              <span className="text-neutral-600 text-lg">/100</span>
              <div className="flex items-center gap-1 ml-3">
                {trendIcon}
                <span className={`text-sm ${
                  metrics.overall.trend === 'improving' ? 'text-emerald-400' :
                  metrics.overall.trend === 'declining' ? 'text-red-400' : 'text-neutral-500'
                }`}>
                  {metrics.overall.trendPercent > 0 ? '+' : ''}{metrics.overall.trendPercent}%
                </span>
                <span className="text-neutral-600 text-xs ml-1">vs last week</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              {metrics.overall.healthScore >= 70 ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span className={`text-sm font-medium ${
                metrics.overall.healthScore >= 70 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {metrics.overall.healthScore >= 80 ? 'Excellent' :
                 metrics.overall.healthScore >= 70 ? 'Good' :
                 metrics.overall.healthScore >= 60 ? 'Fair' : 'Attention'}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="mt-3 h-12 bg-neutral-800/30 rounded flex items-end px-1 gap-0.5">
          {metrics.quality.history.slice(-30).map((point, i) => (
            <div
              key={i}
              className="flex-1 bg-violet-500/40 rounded-t"
              style={{ height: `${(point.value / 100) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Quality Score"
          value={metrics.quality.current}
          unit="%"
          change={metrics.quality.current - metrics.quality.previous}
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Accuracy"
          value={metrics.accuracy.current}
          unit="%"
          change={metrics.accuracy.current - metrics.accuracy.previous}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Avg Response"
          value={(metrics.responseTime.avgMs / 1000).toFixed(1)}
          unit="s"
          change={-0.3}
          icon={Clock}
          color="purple"
          lowerIsBetter
        />
        <MetricCard
          title="Token Efficiency"
          value={(metrics.tokens.efficiency * 100).toFixed(0)}
          unit="%"
          change={2}
          icon={Zap}
          color="orange"
        />
      </div>

      {/* Cost & Usage Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Today's Costs */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">API Costs</h3>
            <DollarSign className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Today</span>
              <span className="text-sm font-medium text-white">${metrics.costs.today.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">This Week</span>
              <span className="text-xs font-medium text-white">${metrics.costs.thisWeek.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">This Month</span>
              <span className="text-xs font-medium text-white">${metrics.costs.thisMonth.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-[10px] text-neutral-600 mb-1.5">By Provider</p>
              <div className="space-y-1.5">
                <CostBar label="OpenAI" amount={metrics.costs.byProvider.openai} total={metrics.costs.thisMonth} color="bg-emerald-500/60" />
                <CostBar label="Apollo" amount={metrics.costs.byProvider.apollo} total={metrics.costs.thisMonth} color="bg-blue-500/60" />
                <CostBar label="SERP" amount={metrics.costs.byProvider.serp} total={metrics.costs.thisMonth} color="bg-violet-500/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">Token Usage</h3>
            <Sparkles className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Input (Today)</span>
                <span className="text-xs font-medium text-white">{(metrics.tokens.todayInput / 1000).toFixed(0)}K</span>
              </div>
              <div className="h-1 bg-neutral-800 rounded-full">
                <div className="h-full bg-blue-500/60 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Output (Today)</span>
                <span className="text-xs font-medium text-white">{(metrics.tokens.todayOutput / 1000).toFixed(0)}K</span>
              </div>
              <div className="h-1 bg-neutral-800 rounded-full">
                <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Efficiency</span>
                <span className="text-xs font-medium text-emerald-400">{(metrics.tokens.efficiency * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactions */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">Interactions</h3>
            <MessageSquare className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Today</span>
              <span className="text-sm font-medium text-white">{metrics.interactions.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Successful</span>
              <span className="text-xs font-medium text-emerald-400">{metrics.interactions.successful}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Failed</span>
              <span className="text-xs font-medium text-red-400">{metrics.interactions.failed}</span>
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Success Rate</span>
                <span className="text-xs font-medium text-emerald-400">
                  {((metrics.interactions.successful / metrics.interactions.today) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-neutral-500">Satisfaction</span>
                <span className="text-xs font-medium text-amber-400">
                  {metrics.interactions.avgSatisfaction.toFixed(1)}/5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Timeline */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-neutral-300">Evolution Timeline</h3>
            <p className="text-xs text-neutral-600">Quality & Accuracy over time</p>
          </div>
          <LineChart className="w-4 h-4 text-neutral-600" />
        </div>

        {/* Simple Chart Visualization */}
        <div className="h-32 flex items-end gap-0.5 px-1">
          {metrics.quality.history.map((point, i) => {
            const qualityHeight = (point.value / 100) * 100;
            const accuracyPoint = metrics.accuracy.history[i];
            const accuracyHeight = accuracyPoint ? (accuracyPoint.value / 100) * 100 : 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex gap-px" style={{ height: '100%' }}>
                  <div
                    className="flex-1 bg-blue-500/50 rounded-t transition-all"
                    style={{ height: `${qualityHeight}%` }}
                    title={`Quality: ${point.value.toFixed(0)}%`}
                  />
                  <div
                    className="flex-1 bg-emerald-500/50 rounded-t transition-all"
                    style={{ height: `${accuracyHeight}%` }}
                    title={`Accuracy: ${accuracyPoint?.value.toFixed(0)}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded" />
            <span className="text-[10px] text-neutral-500">Quality</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded" />
            <span className="text-[10px] text-neutral-500">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <h3 className="text-sm font-medium text-neutral-300 mb-3">Milestones</h3>
        <div className="space-y-2">
          <MilestoneItem
            date="Dec 5, 2024"
            title="SIVA Born"
            description="Initial deployment with Banking vertical"
            status="complete"
          />
          <MilestoneItem
            date="Dec 5, 2024"
            title="First Enrichment"
            description="Live company data via Apollo + SERP"
            status="complete"
          />
          <MilestoneItem
            date="In Progress"
            title="Super Admin"
            description="Performance monitoring dashboard"
            status="active"
          />
          <MilestoneItem
            date="Planned"
            title="Multi-Vertical"
            description="Insurance, Real Estate, Recruitment"
            status="planned"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  color,
  lowerIsBetter = false,
}: {
  title: string;
  value: number | string;
  unit: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  lowerIsBetter?: boolean;
}) {
  const colors = {
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    purple: 'text-violet-400',
    orange: 'text-amber-400',
  };

  const isPositive = lowerIsBetter ? change < 0 : change > 0;

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500">{title}</span>
        <Icon className={`w-4 h-4 ${colors[color]}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-white">{value}</span>
        <span className="text-neutral-600 text-sm">{unit}</span>
      </div>
      <div className="flex items-center gap-1 mt-1.5">
        {change !== 0 && (
          <>
            {isPositive ? (
              <ArrowUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <ArrowDown className="w-3 h-3 text-red-400" />
            )}
            <span className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.abs(change).toFixed(1)}
            </span>
          </>
        )}
        <span className="text-[10px] text-neutral-600">vs yesterday</span>
      </div>
    </div>
  );
}

function CostBar({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-neutral-500">{label}</span>
        <span className="text-[10px] text-neutral-400">${amount.toFixed(2)}</span>
      </div>
      <div className="h-1 bg-neutral-800 rounded-full">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function MilestoneItem({
  date,
  title,
  description,
  status,
}: {
  date: string;
  title: string;
  description: string;
  status: 'complete' | 'active' | 'planned';
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-1 ${
        status === 'complete' ? 'bg-emerald-500' :
        status === 'active' ? 'bg-blue-500 animate-pulse' :
        'bg-neutral-700'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-300">{title}</span>
          <span className="text-[10px] text-neutral-600">{date}</span>
        </div>
        <p className="text-xs text-neutral-500 truncate">{description}</p>
      </div>
    </div>
  );
}
