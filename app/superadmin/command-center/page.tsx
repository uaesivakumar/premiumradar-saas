'use client';

/**
 * Founder Command Center
 *
 * The Solo Founder's Operating System - Single pane of glass that:
 * 1. Tells you what matters NOW
 * 2. Auto-adopts new tech (AI Tech Radar)
 * 3. Tracks revenue and runway
 * 4. AI-generated priorities
 *
 * Sprint 72 - Dec 2025
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  ArrowUp,
  ArrowDown,
  Flame,
  Target,
  Brain,
  Sparkles,
  ExternalLink,
  Play,
  TestTube,
  XCircle,
  Eye,
  ChevronRight,
  Cpu,
  Cloud,
  BarChart3,
} from 'lucide-react';

// Types
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

// Real data - Pre-launch phase (no revenue yet)
// Last updated: Dec 5, 2025
const mockData: CommandCenterData = {
  pulse: {
    mrr: 0,           // No revenue yet - product not live
    mrrGrowth: 0,     // No growth yet
    arr: 0,
    users: {
      total: 0,       // No users yet
      active: 0,
      dau: 0,
    },
    churn: 0,         // N/A - no users
    burn: {
      monthly: 213,   // Apollo $59 + Anthropic $100 + ChatGPT $21 + GCP ~$33 = ~$213
      daily: 7.1,
    },
    runway: {
      months: 4.7,    // $1000 / $213 = ~4.7 months
      cashBalance: 1000,
    },
    margin: 0,        // No revenue
    aiSavings: 0,     // Will track once OS routing is active
  },
  priorities: [
    {
      id: '1',
      severity: 'info',
      title: 'Product in pre-launch phase',
      description: 'Focus on completing MVP and preparing for first customers.',
      action: { label: 'View Roadmap', href: '/superadmin/siva' },
    },
    {
      id: '2',
      severity: 'warning',
      title: 'Render subscription to be discontinued',
      description: 'Currently paying $60.80/mo for Render. Migrate to GCP to save costs.',
      metric: '$60.80',
      action: { label: 'View Costs', href: '/superadmin/financials' },
    },
    {
      id: '3',
      severity: 'info',
      title: 'SERP credits healthy',
      description: '14,643 credits remaining (357 used of 15,000). No renewal needed.',
      metric: '97.6%',
    },
  ],
  modelUpdates: [
    {
      id: '1',
      provider: 'anthropic',
      model: 'Claude 3.5 Sonnet',
      releaseDate: '2024-10-22',
      isNew: false,
      improvements: ['Best price/performance', 'Great for coding', 'Fast responses'],
      costChange: -50,
      qualityChange: 10,
      actions: { canSwitch: true, canTest: true, canAddFallback: true },
      estimatedMonthlySavings: 0,
    },
    {
      id: '2',
      provider: 'openai',
      model: 'GPT-4o-mini',
      releaseDate: '2024-07-18',
      isNew: false,
      improvements: ['Very cheap', 'Good for simple tasks', 'Fast'],
      costChange: -90,
      speedChange: 50,
      actions: { canSwitch: true, canTest: true, canAddFallback: true },
    },
    {
      id: '3',
      provider: 'google',
      model: 'Gemini 1.5 Flash',
      releaseDate: '2024-05-14',
      isNew: false,
      improvements: ['1M token context', 'Multimodal', 'Cost effective'],
      speedChange: 100,
      costChange: -60,
      actions: { canSwitch: true, canTest: true, canAddFallback: true },
    },
  ],
  revenue: {
    subscriptions: { amount: 0, count: 0 },  // No customers yet
    apiOverages: 0,
    total: 0,
  },
  costs: {
    openai: 21,       // ChatGPT subscription ($21/mo), API not billed yet
    anthropic: 100,   // Claude Pro subscription
    apollo: 59,       // Basic Seat
    serp: 0,          // Prepaid credits (15,000 searches)
    gcp: 33,          // Redis $14 + Cloud SQL $12 + Networking $3 + misc $4
    domains: 0,       // Included elsewhere or annual
    total: 213,
  },
  lastUpdated: new Date().toISOString(),
};

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/superadmin/command-center');
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setLastRefresh(new Date());
        setError(null);
      } else {
        // Fall back to mock data in development
        console.log('[Command Center] Using mock data:', result.error);
        setData(mockData);
        setLastRefresh(new Date());
        setError(null);
      }
    } catch (err) {
      // Fall back to mock data on error
      console.log('[Command Center] API error, using mock data');
      setData(mockData);
      setLastRefresh(new Date());
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Command Center</h1>
            <p className="text-gray-400">Your business at a glance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              Updated {formatTimeAgo(lastRefresh)}
            </span>
          )}
        </div>
      </div>

      {/* Business Pulse Row */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 rounded-xl border border-gray-800 p-6">
        <div className="grid grid-cols-6 gap-6">
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
            icon={Sparkles}
            label="AI Savings"
            value={`$${data.pulse.aiSavings}/mo`}
            color="purple"
          />
        </div>
      </div>

      {/* Priorities Section */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Today&apos;s Priorities
            <span className="text-xs text-gray-500 font-normal">(AI-Generated)</span>
          </h2>
        </div>
        <div className="space-y-3">
          {data.priorities.map((priority, index) => (
            <PriorityCard key={priority.id} priority={priority} index={index + 1} />
          ))}
          {data.priorities.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-400">All clear! No urgent priorities today.</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: AI Tech Radar + Revenue/Costs */}
      <div className="grid grid-cols-2 gap-6">
        {/* AI Tech Radar */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              AI Tech Radar
            </h2>
            <span className="text-xs text-gray-500">Auto-updated daily</span>
          </div>
          <div className="space-y-4">
            {data.modelUpdates.map((update) => (
              <ModelUpdateCard key={update.id} update={update} />
            ))}
          </div>
        </div>

        {/* Revenue & Costs */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Revenue & Runway
            </h2>
            <span className="text-xs text-gray-500">December 2024</span>
          </div>

          {/* Revenue */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Revenue</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Subscriptions</span>
                <span className="text-sm text-white">
                  ${data.revenue.subscriptions.amount.toLocaleString()}
                  <span className="text-gray-500 ml-1">({data.revenue.subscriptions.count} customers)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">API Usage Overages</span>
                <span className="text-sm text-white">${data.revenue.apiOverages.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-sm font-medium text-white">Total MRR</span>
                <span className="text-lg font-bold text-green-400">${data.revenue.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Costs</h3>
            <div className="space-y-2">
              <CostRow label="OpenAI API" amount={data.costs.openai} savings={data.pulse.aiSavings} />
              <CostRow label="Apollo/SERP" amount={data.costs.apollo + data.costs.serp} />
              <CostRow label="GCP Infrastructure" amount={data.costs.gcp} />
              <CostRow label="Domains/Services" amount={data.costs.domains} />
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-sm font-medium text-white">Total Monthly Burn</span>
                <span className="text-lg font-bold text-orange-400">${data.costs.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Net Margin</span>
              <span className="text-sm font-medium text-green-400">
                ${(data.pulse.mrr - data.costs.total).toLocaleString()}/mo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Runway</span>
              <span className="text-sm font-medium text-white">
                {data.pulse.runway.months === Infinity ? '∞' : `${data.pulse.runway.months} months`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Break-even</span>
              <span className="text-sm font-medium text-green-400">
                {data.pulse.mrr > data.costs.total ? 'Already profitable!' : 'Not yet'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Savings from AI Routing</span>
              <span className="text-sm font-medium text-purple-400">
                ${data.pulse.aiSavings}/mo
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
    green: 'text-green-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${colors[color]}`} />
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
      {change !== undefined && (
        <div className="flex items-center justify-center gap-1 mt-1">
          {change >= 0 ? (
            <ArrowUp className="w-3 h-3 text-green-400" />
          ) : (
            <ArrowDown className="w-3 h-3 text-red-400" />
          )}
          <span className={`text-xs ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400',
      badge: 'bg-red-500',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
      badge: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      badge: 'bg-blue-500',
    },
  };

  const style = severityStyles[priority.severity];

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 flex items-start gap-4`}>
      <div className={`w-6 h-6 rounded-full ${style.badge} flex items-center justify-center flex-shrink-0`}>
        <span className="text-xs font-bold text-white">{index}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {priority.severity === 'critical' && <XCircle className={`w-4 h-4 ${style.icon}`} />}
          {priority.severity === 'warning' && <AlertTriangle className={`w-4 h-4 ${style.icon}`} />}
          {priority.severity === 'info' && <Eye className={`w-4 h-4 ${style.icon}`} />}
          <span className="font-medium text-white">{priority.title}</span>
          {priority.metric && (
            <span className={`text-xs px-2 py-0.5 rounded ${style.bg} ${style.icon}`}>
              {priority.metric}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400">{priority.description}</p>
      </div>
      {priority.action && (
        <a
          href={priority.action.href}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded-lg transition-colors flex-shrink-0"
        >
          {priority.action.label}
          <ChevronRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

function ModelUpdateCard({ update }: { update: ModelUpdate }) {
  const providerLogos: Record<string, { bg: string; text: string }> = {
    openai: { bg: 'bg-green-500/20', text: 'text-green-400' },
    anthropic: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    google: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    mistral: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    groq: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  };

  const style = providerLogos[update.provider] || providerLogos.openai;

  return (
    <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {update.isNew && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
              NEW
            </span>
          )}
          <span className={`px-2 py-0.5 ${style.bg} ${style.text} text-xs rounded capitalize`}>
            {update.provider}
          </span>
        </div>
        <span className="text-xs text-gray-500">{update.releaseDate}</span>
      </div>

      <h4 className="font-medium text-white mb-2">{update.model}</h4>

      <div className="flex flex-wrap gap-2 mb-3">
        {update.costChange && (
          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded">
            {update.costChange}% cost
          </span>
        )}
        {update.speedChange && (
          <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
            +{update.speedChange}% speed
          </span>
        )}
        {update.qualityChange && (
          <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded">
            +{update.qualityChange}% quality
          </span>
        )}
      </div>

      {update.estimatedMonthlySavings && (
        <p className="text-xs text-gray-400 mb-3">
          Estimated savings: <span className="text-green-400 font-medium">${update.estimatedMonthlySavings}/mo</span>
        </p>
      )}

      <div className="flex gap-2">
        {update.actions.canSwitch && (
          <button className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs text-white rounded transition-colors flex items-center justify-center gap-1">
            <Play className="w-3 h-3" />
            Switch Now
          </button>
        )}
        {update.actions.canTest && (
          <button className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded transition-colors flex items-center justify-center gap-1">
            <TestTube className="w-3 h-3" />
            Test First
          </button>
        )}
        {update.actions.canAddFallback && !update.actions.canSwitch && (
          <button className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded transition-colors flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            Add to Fallback
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
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white">${amount.toLocaleString()}</span>
        {savings && (
          <span className="text-xs text-green-400">(↓${savings} from routing)</span>
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
