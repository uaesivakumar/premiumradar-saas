'use client';

/**
 * Financials Dashboard
 *
 * Founder-focused financial overview:
 * - Revenue vs Expenses visualization
 * - GCP costs breakdown
 * - API costs by provider
 * - Burn rate and runway
 * - Profit margins
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
  PieChart,
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
          <DollarSign className="w-12 h-12 text-green-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
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
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Financials</h1>
            <p className="text-gray-400">Revenue, Expenses & Runway</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Monthly Recurring Revenue</h3>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-4xl font-bold text-green-400">
            ${data.revenue.mrr.toLocaleString()}
          </div>
          <p className="text-sm text-gray-500 mt-2">MRR from subscriptions</p>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">ARR (Annual)</span>
              <span className="text-lg font-semibold text-white">
                ${data.revenue.arr.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Burn Rate</h3>
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-4xl font-bold text-orange-400">
            ${data.burnRate.monthly.toFixed(0)}
          </div>
          <p className="text-sm text-gray-500 mt-2">Net monthly burn</p>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Daily Burn</span>
              <span className="text-lg font-semibold text-white">
                ${data.burnRate.daily.toFixed(2)}/day
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Profit Margin</h3>
            <PieChart className="w-5 h-5 text-blue-500" />
          </div>
          <div className={`text-4xl font-bold ${data.profit.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.profit.margin.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {data.profit.margin >= 0 ? 'Profitable' : 'Operating at loss'}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Last Month</span>
              <span className="text-lg font-semibold text-white">
                ${data.profit.lastMonth.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* GCP Costs */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">GCP Infrastructure</h3>
            <Cloud className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white mb-4">
            ${data.breakdown.gcp.thisMonth.toFixed(2)} <span className="text-sm text-gray-500 font-normal">this month</span>
          </div>
          <div className="space-y-3">
            {data.breakdown.gcp.breakdown.slice(0, 5).map((item) => (
              <div key={item.service}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{item.description}</span>
                  <span className="text-sm text-gray-300">${item.amount.toFixed(2)}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Costs */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">API Costs</h3>
            <Cpu className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-white mb-4">
            ${data.breakdown.api.thisMonth.toFixed(2)} <span className="text-sm text-gray-500 font-normal">this month</span>
          </div>
          <div className="space-y-4">
            <ProviderCostRow
              name="OpenAI"
              icon={<Zap className="w-4 h-4 text-green-500" />}
              cost={data.breakdown.api.byProvider.openai.thisMonth}
              calls={data.breakdown.api.byProvider.openai.callCount}
              color="bg-green-500"
              total={data.breakdown.api.thisMonth}
            />
            <ProviderCostRow
              name="Apollo"
              icon={<Database className="w-4 h-4 text-blue-500" />}
              cost={data.breakdown.api.byProvider.apollo.thisMonth}
              calls={data.breakdown.api.byProvider.apollo.callCount}
              color="bg-blue-500"
              total={data.breakdown.api.thisMonth}
            />
            <ProviderCostRow
              name="SERP"
              icon={<Globe className="w-4 h-4 text-purple-500" />}
              cost={data.breakdown.api.byProvider.serp.thisMonth}
              calls={data.breakdown.api.byProvider.serp.callCount}
              color="bg-purple-500"
              total={data.breakdown.api.thisMonth}
            />
          </div>

          {data.breakdown.api.topOperations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Top Operations by Cost</p>
              {data.breakdown.api.topOperations.slice(0, 3).map((op, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-400">{op.operation}</span>
                  <span className="text-gray-300">${op.totalCost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="font-semibold text-white mb-4">Revenue vs Expenses (30 Days)</h3>
        <div className="h-48 flex items-end gap-1">
          {data.expenses.history.map((expense, i) => {
            const revenue = data.revenue.history.find(r => r.date === expense.date);
            const maxAmount = Math.max(
              ...data.expenses.history.map(e => e.amount),
              ...data.revenue.history.map(r => r.amount),
              1
            );

            return (
              <div key={expense.date} className="flex-1 flex flex-col items-center gap-1 h-full">
                <div className="w-full flex gap-0.5 h-full items-end">
                  <div
                    className="flex-1 bg-green-500/60 rounded-t transition-all"
                    style={{ height: `${(revenue?.amount || 0) / maxAmount * 100}%` }}
                    title={`Revenue: $${revenue?.amount.toFixed(2) || 0}`}
                  />
                  <div
                    className="flex-1 bg-red-500/40 rounded-t transition-all"
                    style={{ height: `${expense.amount / maxAmount * 100}%` }}
                    title={`Expense: $${expense.amount.toFixed(2)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-xs text-gray-400">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/60 rounded" />
            <span className="text-xs text-gray-400">Expenses</span>
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
  const colors = {
    green: 'bg-green-500/10 text-green-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  const isPositive = invertChange ? (change || 0) < 0 : (change || 0) > 0;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
      {change !== undefined && !isMargin && (
        <div className="flex items-center gap-1 mt-2">
          {isPositive ? (
            <ArrowUp className={`w-3 h-3 ${invertChange ? 'text-red-400' : 'text-green-400'}`} />
          ) : (
            <ArrowDown className={`w-3 h-3 ${invertChange ? 'text-green-400' : 'text-red-400'}`} />
          )}
          <span className={`text-xs ${isPositive ? (invertChange ? 'text-red-400' : 'text-green-400') : (invertChange ? 'text-green-400' : 'text-red-400')}`}>
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      )}
      {isMargin && (
        <p className="text-xs text-gray-500 mt-2">Profit margin</p>
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
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-gray-400">{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{calls} calls</span>
          <span className="text-sm text-gray-300">${cost.toFixed(2)}</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
    </div>
  );
}
