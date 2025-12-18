'use client';

/**
 * Founder Command Center - Professional Control Panel
 *
 * Design: Linear/Stripe inspired - minimal, functional, no gradients
 * Solo founder's single pane of glass for:
 * 1. Business metrics (MRR, burn, runway)
 * 2. AI Tech Radar (model updates)
 * 3. AI-generated priorities
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  ArrowUp,
  ArrowDown,
  Flame,
  Brain,
  Play,
  TestTube,
  XCircle,
  Eye,
  ChevronRight,
  Cpu,
  BarChart3,
  Activity,
  Database,
  Server,
  Terminal,
  Trash2,
  ExternalLink,
  Clock,
  Shield,
} from 'lucide-react';

// Types
interface SystemHealth {
  status: 'operational' | 'degraded' | 'outage';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded' | 'unknown';
    latencyMs?: number;
    message?: string;
  }[];
  metrics: {
    uptime: number;
    memoryUsage: number;
    heapUsed: number;
  };
}

interface BusinessPulse {
  mrr: number;
  mrrGrowth: number;
  arr: number;
  users: {
    total: number;
    active: number;
    dau: number;
  };
  churn: number;
  burn: {
    monthly: number;
    daily: number;
  };
  runway: {
    months: number;
    cashBalance: number;
  };
  margin: number;
  aiSavings: number;
}

interface Priority {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface ModelUpdate {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq';
  model: string;
  releaseDate: string;
  isNew: boolean;
  improvements: string[];
  costChange?: number; // negative = cheaper
  speedChange?: number; // positive = faster
  qualityChange?: number; // positive = better
  actions: {
    canSwitch: boolean;
    canTest: boolean;
    canAddFallback: boolean;
  };
  benchmarkResults?: {
    task: string;
    currentScore: number;
    newScore: number;
    costSavings: number;
  }[];
  estimatedMonthlySavings?: number;
}

interface RevenueBreakdown {
  subscriptions: {
    amount: number;
    count: number;
  };
  apiOverages: number;
  total: number;
}

interface CostBreakdown {
  openai: number;
  anthropic: number;
  apollo: number;
  serp: number;
  gcp: number;
  domains: number;
  total: number;
}

interface CommandCenterData {
  pulse: BusinessPulse;
  priorities: Priority[];
  modelUpdates: ModelUpdate[];
  revenue: RevenueBreakdown;
  costs: CostBreakdown;
  lastUpdated: string;
}

/**
 * VS12.7: Removed mockData fallback
 * Command Center now requires real API data
 * Authorization Code: VS12-FRONTEND-WIRING-20251213
 */

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Fetch system health from /api/status
  const fetchHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const response = await fetch('/api/status');
      const result = await response.json();
      setSystemHealth(result);
    } catch (err) {
      console.error('[Command Center] Health check error:', err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // VS12.7: Fetch real data from API (no mock fallback)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/superadmin/command-center');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setLastRefresh(new Date());
      } else {
        // VS12.7: Show error instead of falling back to mock data
        console.error('[Command Center] API error:', result.error);
        setError(result.error || 'Failed to load command center data');
      }
    } catch (err) {
      // VS12.7: Show error instead of falling back to mock data
      console.error('[Command Center] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHealth();
    // Refresh data every 60 seconds, health every 30 seconds
    const dataInterval = setInterval(fetchData, 60000);
    const healthInterval = setInterval(fetchHealth, 30000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(healthInterval);
    };
  }, [fetchData, fetchHealth]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-5 h-5 text-neutral-500 animate-spin mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white">Command Center</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Business metrics
            {lastRefresh && (
              <span className="text-neutral-600 ml-2">· {formatTimeAgo(lastRefresh)}</span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Business Pulse Row */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <div className="grid grid-cols-6 gap-4">
          <PulseMetric
            icon={DollarSign}
            label="MRR"
            value={`$${data.pulse.mrr.toLocaleString()}`}
            change={data.pulse.mrrGrowth}
            color="green"
          />
          <PulseMetric
            icon={TrendingUp}
            label="Growth"
            value={`+${data.pulse.mrrGrowth}%`}
            color="green"
          />
          <PulseMetric
            icon={Flame}
            label="Burn"
            value={`$${data.pulse.burn.monthly}/mo`}
            color="orange"
          />
          <PulseMetric
            icon={Users}
            label="Users"
            value={data.pulse.users.total.toString()}
            subValue={`${data.pulse.users.dau} DAU`}
            color="blue"
          />
          <PulseMetric
            icon={Zap}
            label="Churn"
            value={`${data.pulse.churn}%`}
            color={data.pulse.churn < 5 ? 'green' : 'red'}
          />
          <PulseMetric
            icon={BarChart3}
            label="AI Savings"
            value={`$${data.pulse.aiSavings}/mo`}
            color="purple"
          />
        </div>
      </div>

      {/* Solo Founder Ops Panel */}
      <div className="grid grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <h3 className="text-xs font-medium text-neutral-400 mb-3 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction
              icon={Server}
              label="Deploy"
              onClick={() => window.open('https://console.cloud.google.com/run?project=applied-algebra-474804-e6', '_blank')}
              color="emerald"
            />
            <QuickAction
              icon={Terminal}
              label="Logs"
              onClick={() => window.open('https://console.cloud.google.com/logs/query?project=applied-algebra-474804-e6', '_blank')}
              color="blue"
            />
            <QuickAction
              icon={Database}
              label="DB"
              onClick={() => window.open('https://console.cloud.google.com/sql/instances?project=applied-algebra-474804-e6', '_blank')}
              color="violet"
            />
            <QuickAction
              icon={Trash2}
              label="Clear Cache"
              onClick={() => alert('Cache cleared (demo)')}
              color="amber"
            />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              System Health
            </h3>
            {systemHealth && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                systemHealth.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400' :
                systemHealth.status === 'degraded' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {systemHealth.status}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {systemHealth ? (
              <>
                <HealthItem
                  status="healthy"
                  label="SaaS Frontend"
                  latency={`${systemHealth.metrics.uptime > 0 ? 'up' : '-'}`}
                />
                {systemHealth.services.map((service) => (
                  <HealthItem
                    key={service.name}
                    status={service.status === 'up' ? 'healthy' : service.status === 'degraded' ? 'degraded' : 'down'}
                    label={service.name === 'database' ? 'PostgreSQL' : service.name === 'os-service' ? 'UPR OS' : service.name}
                    latency={service.latencyMs ? `${service.latencyMs}ms` : '-'}
                  />
                ))}
              </>
            ) : healthLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 text-neutral-500 animate-spin" />
              </div>
            ) : (
              <p className="text-xs text-neutral-600 text-center py-2">No health data</p>
            )}
          </div>
        </div>

        {/* Uptime & Performance */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <h3 className="text-xs font-medium text-neutral-400 mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Performance
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Uptime</span>
              <span className="text-xs font-medium text-emerald-400">
                {systemHealth ? formatUptime(systemHealth.metrics.uptime) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Memory</span>
              <span className="text-xs font-medium text-white">
                {systemHealth ? `${systemHealth.metrics.memoryUsage}MB` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Heap Used</span>
              <span className="text-xs font-medium text-white">
                {systemHealth ? `${systemHealth.metrics.heapUsed}MB` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Avg Latency</span>
              <span className="text-xs font-medium text-white">
                {systemHealth?.services.length ?
                  `${Math.round(systemHealth.services.reduce((sum, s) => sum + (s.latencyMs || 0), 0) / systemHealth.services.length)}ms`
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Priorities Section */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
            <Brain className="w-4 h-4 text-neutral-500" />
            Priorities
            <span className="text-[10px] text-neutral-600 font-normal px-1.5 py-0.5 bg-neutral-800 rounded">AI</span>
          </h2>
        </div>
        <div className="space-y-2">
          {data.priorities.map((priority, index) => (
            <PriorityCard key={priority.id} priority={priority} index={index + 1} />
          ))}
          {data.priorities.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-neutral-500 text-xs">No urgent priorities</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: AI Tech Radar + Revenue/Costs */}
      <div className="grid grid-cols-2 gap-4">
        {/* AI Tech Radar */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-neutral-500" />
              AI Tech Radar
            </h2>
            <span className="text-[10px] text-neutral-600">daily updates</span>
          </div>
          <div className="space-y-3">
            {data.modelUpdates.map((update) => (
              <ModelUpdateCard key={update.id} update={update} />
            ))}
          </div>
        </div>

        {/* Revenue & Costs */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-neutral-500" />
              Revenue & Runway
            </h2>
          </div>

          {/* Revenue */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-neutral-500 mb-2">Revenue</h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Subscriptions</span>
                <span className="text-xs text-white">
                  ${data.revenue.subscriptions.amount.toLocaleString()}
                  <span className="text-neutral-600 ml-1">({data.revenue.subscriptions.count})</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">API Overages</span>
                <span className="text-xs text-white">${data.revenue.apiOverages.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800">
                <span className="text-xs font-medium text-white">MRR</span>
                <span className="text-sm font-semibold text-emerald-400">${data.revenue.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-neutral-500 mb-2">Costs</h3>
            <div className="space-y-1.5">
              <CostRow label="OpenAI API" amount={data.costs.openai} savings={data.pulse.aiSavings} />
              <CostRow label="Apollo/SERP" amount={data.costs.apollo + data.costs.serp} />
              <CostRow label="GCP" amount={data.costs.gcp} />
              <CostRow label="Other" amount={data.costs.domains} />
              <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800">
                <span className="text-xs font-medium text-white">Burn</span>
                <span className="text-sm font-semibold text-amber-400">${data.costs.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-neutral-800/30 rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Net</span>
              <span className="text-xs font-medium text-emerald-400">
                ${(data.pulse.mrr - data.costs.total).toLocaleString()}/mo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Runway</span>
              <span className="text-xs font-medium text-white">
                {data.pulse.runway.months === Infinity ? '∞' : `${data.pulse.runway.months}mo`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Status</span>
              <span className="text-xs font-medium text-emerald-400">
                {data.pulse.mrr > data.costs.total ? 'Profitable' : 'Pre-profit'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function PulseMetric({
  icon: Icon,
  label,
  value,
  subValue,
  change,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  color: 'green' | 'orange' | 'blue' | 'red' | 'purple';
}) {
  const colors = {
    green: 'text-emerald-400',
    orange: 'text-amber-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
    purple: 'text-violet-400',
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-neutral-600" />
        <span className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-xl font-semibold ${colors[color]}`}>{value}</div>
      {subValue && <p className="text-[10px] text-neutral-600 mt-0.5">{subValue}</p>}
      {change !== undefined && (
        <div className="flex items-center justify-center gap-0.5 mt-0.5">
          {change >= 0 ? (
            <ArrowUp className="w-2.5 h-2.5 text-emerald-400" />
          ) : (
            <ArrowDown className="w-2.5 h-2.5 text-red-400" />
          )}
          <span className={`text-[10px] ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {Math.abs(change)}%
          </span>
        </div>
      )}
    </div>
  );
}

function PriorityCard({ priority, index }: { priority: Priority; index: number }) {
  const severityStyles = {
    critical: {
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
      icon: 'text-red-400',
      badge: 'bg-red-500/80',
    },
    warning: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      badge: 'bg-amber-500/80',
    },
    info: {
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      badge: 'bg-blue-500/80',
    },
  };

  const style = severityStyles[priority.severity];

  return (
    <div className={`${style.bg} border ${style.border} rounded p-3 flex items-start gap-3`}>
      <div className={`w-5 h-5 rounded-full ${style.badge} flex items-center justify-center flex-shrink-0`}>
        <span className="text-[10px] font-medium text-white">{index}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {priority.severity === 'critical' && <XCircle className={`w-3.5 h-3.5 ${style.icon}`} />}
          {priority.severity === 'warning' && <AlertTriangle className={`w-3.5 h-3.5 ${style.icon}`} />}
          {priority.severity === 'info' && <Eye className={`w-3.5 h-3.5 ${style.icon}`} />}
          <span className="text-xs font-medium text-white">{priority.title}</span>
          {priority.metric && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.icon}`}>
              {priority.metric}
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500">{priority.description}</p>
      </div>
      {priority.action && (
        <a
          href={priority.action.href}
          className="flex items-center gap-0.5 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] text-white rounded transition-colors flex-shrink-0"
        >
          {priority.action.label}
          <ChevronRight className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function ModelUpdateCard({ update }: { update: ModelUpdate }) {
  const providerLogos: Record<string, { bg: string; text: string }> = {
    openai: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    anthropic: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    google: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    mistral: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    groq: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  };

  const style = providerLogos[update.provider] || providerLogos.openai;

  return (
    <div className="border border-neutral-800 rounded p-3 hover:border-neutral-700 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {update.isNew && (
            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded">
              NEW
            </span>
          )}
          <span className={`px-1.5 py-0.5 ${style.bg} ${style.text} text-[10px] rounded capitalize`}>
            {update.provider}
          </span>
        </div>
        <span className="text-[10px] text-neutral-600">{update.releaseDate}</span>
      </div>

      <h4 className="text-xs font-medium text-white mb-2">{update.model}</h4>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {update.costChange && (
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
            {update.costChange}% cost
          </span>
        )}
        {update.speedChange && (
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
            +{update.speedChange}% speed
          </span>
        )}
        {update.qualityChange && (
          <span className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 text-violet-400 rounded">
            +{update.qualityChange}% quality
          </span>
        )}
      </div>

      {update.estimatedMonthlySavings && (
        <p className="text-[10px] text-neutral-500 mb-2">
          Est. savings: <span className="text-emerald-400">${update.estimatedMonthlySavings}/mo</span>
        </p>
      )}

      <div className="flex gap-1.5">
        {update.actions.canSwitch && (
          <button className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/15 text-[10px] text-white rounded transition-colors flex items-center justify-center gap-1">
            <Play className="w-2.5 h-2.5" />
            Switch
          </button>
        )}
        {update.actions.canTest && (
          <button className="flex-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] text-white rounded transition-colors flex items-center justify-center gap-1">
            <TestTube className="w-2.5 h-2.5" />
            Test
          </button>
        )}
        {update.actions.canAddFallback && !update.actions.canSwitch && (
          <button className="flex-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-[10px] text-white rounded transition-colors flex items-center justify-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            Fallback
          </button>
        )}
      </div>
    </div>
  );
}

function CostRow({
  label,
  amount,
  savings,
}: {
  label: string;
  amount: number;
  savings?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-neutral-500">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-white">${amount.toLocaleString()}</span>
        {savings && (
          <span className="text-[10px] text-emerald-400">(↓${savings})</span>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

// Solo founder quick action button
function QuickAction({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color: 'emerald' | 'blue' | 'violet' | 'amber';
}) {
  const colors = {
    emerald: 'hover:bg-emerald-500/10 hover:border-emerald-500/30',
    blue: 'hover:bg-blue-500/10 hover:border-blue-500/30',
    violet: 'hover:bg-violet-500/10 hover:border-violet-500/30',
    amber: 'hover:bg-amber-500/10 hover:border-amber-500/30',
  };

  const iconColors = {
    emerald: 'group-hover:text-emerald-400',
    blue: 'group-hover:text-blue-400',
    violet: 'group-hover:text-violet-400',
    amber: 'group-hover:text-amber-400',
  };

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center justify-center p-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded transition-all ${colors[color]}`}
    >
      <Icon className={`w-4 h-4 text-neutral-500 ${iconColors[color]} mb-1`} />
      <span className="text-[10px] text-neutral-400 group-hover:text-white">{label}</span>
    </button>
  );
}

// System health item
function HealthItem({
  status,
  label,
  latency,
}: {
  status: 'healthy' | 'degraded' | 'down';
  label: string;
  latency: string;
}) {
  const statusColors = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status]}`} />
        <span className="text-xs text-neutral-400">{label}</span>
      </div>
      <span className="text-[10px] text-neutral-600">{latency}</span>
    </div>
  );
}
