'use client';

/**
 * SIVA Intelligence Dashboard
 *
 * Bloomberg/Yahoo Finance style monitoring for SIVA AI performance.
 * Track how SIVA is evolving day by day as a parent would monitor a child.
 *
 * Metrics tracked:
 * - Response quality scores
 * - Accuracy over time
 * - Token usage efficiency
 * - API costs (OpenAI, Apollo, SERP)
 * - Response times
 * - User satisfaction signals
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  LineChart,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Calendar,
  Loader2,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  CheckCircle,
  XCircle,
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
          <Brain className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading SIVA metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const trendIcon = metrics.overall.trend === 'improving' ? (
    <ArrowUp className="w-5 h-5 text-green-400" />
  ) : metrics.overall.trend === 'declining' ? (
    <ArrowDown className="w-5 h-5 text-red-400" />
  ) : (
    <Minus className="w-5 h-5 text-gray-400" />
  );

  const healthColor =
    metrics.overall.healthScore >= 80
      ? 'text-green-400'
      : metrics.overall.healthScore >= 60
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SIVA Intelligence</h1>
            <p className="text-gray-400">AI Performance Monitor · Born Dec 2024</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overall Health Score - Bloomberg Style */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">SIVA Health Index</p>
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl font-bold ${healthColor}`}>
                {metrics.overall.healthScore}
              </span>
              <span className="text-gray-500 text-2xl">/100</span>
              <div className="flex items-center gap-1 ml-4">
                {trendIcon}
                <span className={`text-lg ${
                  metrics.overall.trend === 'improving' ? 'text-green-400' :
                  metrics.overall.trend === 'declining' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {metrics.overall.trendPercent > 0 ? '+' : ''}{metrics.overall.trendPercent}%
                </span>
                <span className="text-gray-500 text-sm ml-1">vs last week</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Status</p>
            <div className="flex items-center gap-2 mt-1">
              {metrics.overall.healthScore >= 70 ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
              <span className={`text-lg font-semibold ${
                metrics.overall.healthScore >= 70 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {metrics.overall.healthScore >= 80 ? 'Excellent' :
                 metrics.overall.healthScore >= 70 ? 'Good' :
                 metrics.overall.healthScore >= 60 ? 'Fair' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Sparkline Chart Placeholder */}
        <div className="mt-4 h-16 bg-gray-800/50 rounded-lg flex items-end px-2 gap-1">
          {metrics.quality.history.slice(-30).map((point, i) => (
            <div
              key={i}
              className="flex-1 bg-purple-500/60 rounded-t"
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
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">API Costs</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Today</span>
              <span className="text-lg font-semibold text-white">${metrics.costs.today.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">This Week</span>
              <span className="text-sm font-medium text-white">${metrics.costs.thisWeek.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">This Month</span>
              <span className="text-sm font-medium text-white">${metrics.costs.thisMonth.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">By Provider</p>
              <div className="space-y-2">
                <CostBar label="OpenAI" amount={metrics.costs.byProvider.openai} total={metrics.costs.thisMonth} color="bg-green-500" />
                <CostBar label="Apollo" amount={metrics.costs.byProvider.apollo} total={metrics.costs.thisMonth} color="bg-blue-500" />
                <CostBar label="SERP" amount={metrics.costs.byProvider.serp} total={metrics.costs.thisMonth} color="bg-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Token Usage</h3>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Input Tokens (Today)</span>
                <span className="text-sm font-medium text-white">{(metrics.tokens.todayInput / 1000).toFixed(0)}K</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-400">Output Tokens (Today)</span>
                <span className="text-sm font-medium text-white">{(metrics.tokens.todayOutput / 1000).toFixed(0)}K</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
            <div className="pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Efficiency Ratio</span>
                <span className="text-sm font-medium text-green-400">{(metrics.tokens.efficiency * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Output / Input ratio (higher = better)</p>
            </div>
          </div>
        </div>

        {/* Interactions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Interactions</h3>
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Today</span>
              <span className="text-lg font-semibold text-white">{metrics.interactions.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Successful</span>
              <span className="text-sm font-medium text-green-400">{metrics.interactions.successful}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Failed</span>
              <span className="text-sm font-medium text-red-400">{metrics.interactions.failed}</span>
            </div>
            <div className="pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Success Rate</span>
                <span className="text-sm font-medium text-green-400">
                  {((metrics.interactions.successful / metrics.interactions.today) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-400">Avg Satisfaction</span>
                <span className="text-sm font-medium text-yellow-400">
                  {metrics.interactions.avgSatisfaction.toFixed(1)} / 5.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Timeline */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white">SIVA Evolution Timeline</h3>
            <p className="text-sm text-gray-500">Quality & Accuracy over time</p>
          </div>
          <LineChart className="w-5 h-5 text-gray-500" />
        </div>

        {/* Simple Chart Visualization */}
        <div className="h-48 flex items-end gap-1 px-2">
          {metrics.quality.history.map((point, i) => {
            const qualityHeight = (point.value / 100) * 100;
            const accuracyPoint = metrics.accuracy.history[i];
            const accuracyHeight = accuracyPoint ? (accuracyPoint.value / 100) * 100 : 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5" style={{ height: '100%' }}>
                  <div
                    className="flex-1 bg-blue-500/60 rounded-t transition-all"
                    style={{ height: `${qualityHeight}%` }}
                    title={`Quality: ${point.value.toFixed(0)}%`}
                  />
                  <div
                    className="flex-1 bg-green-500/60 rounded-t transition-all"
                    style={{ height: `${accuracyHeight}%` }}
                    title={`Accuracy: ${accuracyPoint?.value.toFixed(0)}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-xs text-gray-400">Quality Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-xs text-gray-400">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="font-semibold text-white mb-4">SIVA Milestones</h3>
        <div className="space-y-3">
          <MilestoneItem
            date="Dec 5, 2024"
            title="SIVA Born"
            description="Initial deployment with Banking vertical support"
            status="complete"
          />
          <MilestoneItem
            date="Dec 5, 2024"
            title="First Live Enrichment"
            description="Processed first real company data via Apollo + SERP"
            status="complete"
          />
          <MilestoneItem
            date="In Progress"
            title="Super Admin Monitoring"
            description="Bloomberg-style performance dashboard"
            status="active"
          />
          <MilestoneItem
            date="Planned"
            title="Multi-Vertical Intelligence"
            description="Expand to Insurance, Real Estate, Recruitment"
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
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };

  const isPositive = lowerIsBetter ? change < 0 : change > 0;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className="text-gray-500">{unit}</span>
      </div>
      <div className="flex items-center gap-1 mt-2">
        {change !== 0 && (
          <>
            {isPositive ? (
              <ArrowUp className="w-3 h-3 text-green-400" />
            ) : (
              <ArrowDown className="w-3 h-3 text-red-400" />
            )}
            <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {Math.abs(change).toFixed(1)}
            </span>
          </>
        )}
        <span className="text-xs text-gray-500">vs yesterday</span>
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
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-300">${amount.toFixed(2)}</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full">
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
    <div className="flex items-start gap-4">
      <div className={`w-3 h-3 rounded-full mt-1.5 ${
        status === 'complete' ? 'bg-green-500' :
        status === 'active' ? 'bg-blue-500 animate-pulse' :
        'bg-gray-600'
      }`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{title}</span>
          <span className="text-xs text-gray-500">{date}</span>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}
