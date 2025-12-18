'use client';

/**
 * Financials Dashboard - Professional Control Panel
 *
 * Design: Linear/Stripe inspired - minimal, functional, no gradients
 * Solo founder financial overview:
 * - Revenue vs Expenses
 * - GCP/API costs breakdown
 * - Burn rate and runway
 */

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Cloud,
  Cpu,
  Database,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Loader2,
} from 'lucide-react';

interface FinancialData {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    mrr: number;
    arr: number;
    history: Array<{ date: string; amount: number }>;
  };
  expenses: {
    thisMonth: number;
    lastMonth: number;
    infrastructure: number;
    apis: number;
    other: number;
    history: Array<{ date: string; amount: number }>;
  };
  profit: {
    thisMonth: number;
    lastMonth: number;
    margin: number;
  };
  burnRate: {
    monthly: number;
    daily: number;
  };
  runway: {
    months: number;
    cashBalance: number;
  };
  breakdown: {
    gcp: {
      thisMonth: number;
      byService: Record<string, number>;
      breakdown: Array<{ service: string; description: string; amount: number; percentage: number }>;
    };
    api: {
      thisMonth: number;
      byProvider: {
        openai: { thisMonth: number; callCount: number };
        apollo: { thisMonth: number; callCount: number };
        serp: { thisMonth: number; callCount: number };
      };
      topOperations: Array<{
        operation: string;
        provider: string;
        callCount: number;
        totalCost: number;
      }>;
    };
  };
}

async function fetchFinancials(): Promise<FinancialData | null> {
  try {
    const response = await fetch('/api/superadmin/financials');
    const data = await response.json();
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('[Financials] Failed to fetch:', error);
    return null;
  }
}

export default function FinancialsDashboard() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const result = await fetchFinancials();
      if (result) {
        setData(result);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Failed to load financial data');
      }
      setIsLoading(false);
    }

    loadData();
    const interval = setInterval(loadData, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    const result = await fetchFinancials();
    if (result) {
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    }
    setIsLoading(false);
  };

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
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isProfitable = data.profit.thisMonth > 0;
  const revenueChange = data.revenue.lastMonth > 0
    ? ((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth) * 100
    : 0;
  const expenseChange = data.expenses.lastMonth > 0
    ? ((data.expenses.thisMonth - data.expenses.lastMonth) / data.expenses.lastMonth) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-white">Financials</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Revenue, costs & runway
            {lastUpdated && (
              <span className="text-neutral-600 ml-2">· {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Revenue (MTD)"
          value={`$${data.revenue.thisMonth.toLocaleString()}`}
          change={revenueChange}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Expenses (MTD)"
          value={`$${data.expenses.thisMonth.toLocaleString()}`}
          change={expenseChange}
          icon={TrendingDown}
          color="red"
          invertChange
        />
        <MetricCard
          title="Profit/Loss"
          value={`${data.profit.thisMonth >= 0 ? '+' : ''}$${data.profit.thisMonth.toLocaleString()}`}
          change={data.profit.margin}
          icon={isProfitable ? CheckCircle : AlertTriangle}
          color={isProfitable ? 'green' : 'yellow'}
          isMargin
        />
        <MetricCard
          title="Runway"
          value={data.runway.months === Infinity ? 'Infinite' : `${data.runway.months.toFixed(0)} mo`}
          subValue={`$${data.runway.cashBalance.toLocaleString()} cash`}
          icon={Clock}
          color={data.runway.months > 12 ? 'green' : data.runway.months > 6 ? 'yellow' : 'red'}
        />
      </div>

      {/* MRR/ARR Section */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">MRR</h3>
            <BarChart3 className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-semibold text-emerald-400">
            ${data.revenue.mrr.toLocaleString()}
          </div>
          <p className="text-[10px] text-neutral-600 mt-1">from subscriptions</p>
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">ARR</span>
              <span className="text-sm font-medium text-white">
                ${data.revenue.arr.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">Burn Rate</h3>
            <Zap className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-semibold text-amber-400">
            ${data.burnRate.monthly.toFixed(0)}
          </div>
          <p className="text-[10px] text-neutral-600 mt-1">net monthly burn</p>
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Daily</span>
              <span className="text-sm font-medium text-white">
                ${data.burnRate.daily.toFixed(2)}/day
              </span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">Margin</h3>
            <BarChart3 className="w-4 h-4 text-neutral-600" />
          </div>
          <div className={`text-2xl font-semibold ${data.profit.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.profit.margin.toFixed(1)}%
          </div>
          <p className="text-[10px] text-neutral-600 mt-1">
            {data.profit.margin >= 0 ? 'profitable' : 'operating at loss'}
          </p>
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Last Month</span>
              <span className="text-sm font-medium text-white">
                ${data.profit.lastMonth.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* GCP Costs */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">GCP Infrastructure</h3>
            <Cloud className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-xl font-semibold text-white mb-3">
            ${data.breakdown.gcp.thisMonth.toFixed(2)} <span className="text-xs text-neutral-600 font-normal">this month</span>
          </div>
          <div className="space-y-2">
            {data.breakdown.gcp.breakdown.slice(0, 5).map((item) => (
              <div key={item.service}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-500">{item.description}</span>
                  <span className="text-xs text-neutral-300">${item.amount.toFixed(2)}</span>
                </div>
                <div className="h-1 bg-neutral-800 rounded-full">
                  <div
                    className="h-full bg-blue-500/60 rounded-full"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Costs */}
        <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-300">API Costs</h3>
            <Cpu className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-xl font-semibold text-white mb-3">
            ${data.breakdown.api.thisMonth.toFixed(2)} <span className="text-xs text-neutral-600 font-normal">this month</span>
          </div>
          <div className="space-y-3">
            <ProviderCostRow
              name="OpenAI"
              icon={<Zap className="w-3.5 h-3.5 text-emerald-500" />}
              cost={data.breakdown.api.byProvider.openai.thisMonth}
              calls={data.breakdown.api.byProvider.openai.callCount}
              color="bg-emerald-500/60"
              total={data.breakdown.api.thisMonth}
            />
            <ProviderCostRow
              name="Apollo"
              icon={<Database className="w-3.5 h-3.5 text-blue-500" />}
              cost={data.breakdown.api.byProvider.apollo.thisMonth}
              calls={data.breakdown.api.byProvider.apollo.callCount}
              color="bg-blue-500/60"
              total={data.breakdown.api.thisMonth}
            />
            <ProviderCostRow
              name="SERP"
              icon={<Globe className="w-3.5 h-3.5 text-violet-500" />}
              cost={data.breakdown.api.byProvider.serp.thisMonth}
              calls={data.breakdown.api.byProvider.serp.callCount}
              color="bg-violet-500/60"
              total={data.breakdown.api.thisMonth}
            />
          </div>

          {data.breakdown.api.topOperations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <p className="text-[10px] text-neutral-600 mb-2">Top Operations</p>
              {data.breakdown.api.topOperations.slice(0, 3).map((op, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-neutral-500">{op.operation}</span>
                  <span className="text-neutral-300">${op.totalCost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
        <h3 className="text-sm font-medium text-neutral-300 mb-3">Revenue vs Expenses (30 Days)</h3>
        <div className="h-32 flex items-end gap-0.5">
          {data.expenses.history.map((expense, i) => {
            const revenue = data.revenue.history.find(r => r.date === expense.date);
            const maxAmount = Math.max(
              ...data.expenses.history.map(e => e.amount),
              ...data.revenue.history.map(r => r.amount),
              1
            );

            return (
              <div key={expense.date} className="flex-1 flex flex-col items-center gap-0.5 h-full">
                <div className="w-full flex gap-0.5 h-full items-end">
                  <div
                    className="flex-1 bg-emerald-500/50 rounded-t transition-all"
                    style={{ height: `${(revenue?.amount || 0) / maxAmount * 100}%` }}
                    title={`Revenue: $${revenue?.amount.toFixed(2) || 0}`}
                  />
                  <div
                    className="flex-1 bg-red-500/30 rounded-t transition-all"
                    style={{ height: `${expense.amount / maxAmount * 100}%` }}
                    title={`Expense: $${expense.amount.toFixed(2)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded" />
            <span className="text-[10px] text-neutral-500">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500/60 rounded" />
            <span className="text-[10px] text-neutral-500">Expenses</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  subValue,
  icon: Icon,
  color,
  invertChange = false,
  isMargin = false,
}: {
  title: string;
  value: string;
  change?: number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'green' | 'red' | 'yellow' | 'blue';
  invertChange?: boolean;
  isMargin?: boolean;
}) {
  const colorMap = {
    green: 'text-emerald-400',
    red: 'text-red-400',
    yellow: 'text-amber-400',
    blue: 'text-blue-400',
  };

  const isPositive = invertChange ? (change || 0) < 0 : (change || 0) > 0;

  return (
    <div className="bg-neutral-900/50 rounded-lg border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500">{title}</span>
        <Icon className={`w-4 h-4 ${colorMap[color]}`} />
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
      {subValue && <p className="text-[10px] text-neutral-600 mt-0.5">{subValue}</p>}
      {change !== undefined && !isMargin && (
        <div className="flex items-center gap-1 mt-1.5">
          {isPositive ? (
            <ArrowUp className={`w-2.5 h-2.5 ${invertChange ? 'text-red-400' : 'text-emerald-400'}`} />
          ) : (
            <ArrowDown className={`w-2.5 h-2.5 ${invertChange ? 'text-emerald-400' : 'text-red-400'}`} />
          )}
          <span className={`text-[10px] ${isPositive ? (invertChange ? 'text-red-400' : 'text-emerald-400') : (invertChange ? 'text-emerald-400' : 'text-red-400')}`}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-[10px] text-neutral-600">vs last month</span>
        </div>
      )}
      {isMargin && (
        <p className="text-[10px] text-neutral-600 mt-1">margin</p>
      )}
    </div>
  );
}

function ProviderCostRow({
  name,
  icon,
  cost,
  calls,
  color,
  total,
}: {
  name: string;
  icon: React.ReactNode;
  cost: number;
  calls: number;
  color: string;
  total: number;
}) {
  const percentage = total > 0 ? (cost / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs text-neutral-400">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-600">{calls} calls</span>
          <span className="text-xs text-neutral-300">${cost.toFixed(2)}</span>
        </div>
      </div>
      <div className="h-1 bg-neutral-800 rounded-full">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
    </div>
  );
}
