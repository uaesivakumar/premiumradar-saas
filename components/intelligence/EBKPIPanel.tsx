'use client';

/**
 * EBKPIPanel - EB Journey Phase 5.2
 *
 * Displays KPIs from VerticalConfig for Employee Banking.
 * Shows targets vs actuals for products like Payroll Accounts, Employee Benefits.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertCircle,
  Users,
  DollarSign,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useVerticalConfig, type DefaultKPI } from '@/lib/intelligence/hooks/useVerticalConfig';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';

// =============================================================================
// TYPES
// =============================================================================

interface KPIActual {
  product: string;
  current: number;
  previousPeriod?: number;
}

interface EBKPIPanelProps {
  /** Actual values for KPIs */
  actuals?: KPIActual[];
  /** Current period label */
  periodLabel?: string;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
  'Payroll Accounts': <Users className="w-5 h-5" />,
  'Employee Benefits': <DollarSign className="w-5 h-5" />,
  'Corporate Accounts': <Building2 className="w-5 h-5" />,
};

// Fallback KPIs if VerticalConfig not available
const FALLBACK_KPIS: DefaultKPI[] = [
  { product: 'Payroll Accounts', target: 20, unit: 'accounts', period: 'quarterly' },
  { product: 'Employee Benefits', target: 500000, unit: 'AED', period: 'quarterly' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function EBKPIPanel({
  actuals = [],
  periodLabel = 'This Quarter',
  className = '',
}: EBKPIPanelProps) {
  const { subVerticalName, regionsDisplay } = useSalesContext();
  const { defaultKPIs, isLoading, isConfigured } = useVerticalConfig();

  // Use KPIs from VerticalConfig or fallback
  const kpis = useMemo(() => {
    return defaultKPIs.length > 0 ? defaultKPIs : FALLBACK_KPIS;
  }, [defaultKPIs]);

  // Get actual value for a KPI
  const getActual = (product: string): KPIActual | undefined => {
    return actuals.find((a) => a.product === product);
  };

  // Calculate progress percentage
  const getProgress = (current: number, target: number): number => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Get trend icon and color
  const getTrend = (current: number, previous?: number) => {
    if (previous === undefined) return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-400' };
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return { icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-500' };
    if (change < -5) return { icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-500' };
    return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-400' };
  };

  // Format value with unit
  const formatValue = (value: number, unit: string): string => {
    if (unit === 'AED' || unit === 'USD' || unit === '$') {
      return new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: unit === '$' ? 'USD' : 'AED',
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (unit === '%') {
      return `${value}%`;
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading KPIs...</span>
        </div>
      </div>
    );
  }

  // Calculate overall achievement
  const overallAchievement = useMemo(() => {
    if (actuals.length === 0) return 0;
    const totalProgress = kpis.reduce((sum, kpi) => {
      const actual = getActual(kpi.product);
      return sum + (actual ? getProgress(actual.current, kpi.target) : 0);
    }, 0);
    return Math.round(totalProgress / kpis.length);
  }, [kpis, actuals]);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Performance Targets</h3>
          <p className="text-sm text-gray-500">
            {subVerticalName} • {regionsDisplay} • {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isConfigured && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Using defaults</span>
            </div>
          )}
          {actuals.length > 0 && (
            <div
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium
                ${overallAchievement >= 80 ? 'bg-green-100 text-green-700' : ''}
                ${overallAchievement >= 50 && overallAchievement < 80 ? 'bg-yellow-100 text-yellow-700' : ''}
                ${overallAchievement < 50 ? 'bg-red-100 text-red-700' : ''}
              `}
            >
              {overallAchievement}% Achieved
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {kpis.map((kpi, index) => {
          const actual = getActual(kpi.product);
          const progress = actual ? getProgress(actual.current, kpi.target) : 0;
          const trend = actual ? getTrend(actual.current, actual.previousPeriod) : getTrend(0);
          const icon = PRODUCT_ICONS[kpi.product] || <Target className="w-5 h-5" />;

          return (
            <motion.div
              key={kpi.product}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                    {icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{kpi.product}</h4>
                    <p className="text-xs text-gray-500 capitalize">{kpi.period}</p>
                  </div>
                </div>
                {actual && (
                  <div className={`flex items-center gap-1 ${trend.color}`}>
                    {trend.icon}
                  </div>
                )}
              </div>

              {/* Values */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {actual ? formatValue(actual.current, kpi.unit) : '--'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Target: {formatValue(kpi.target, kpi.unit)}
                  </div>
                </div>
                {actual && progress >= 100 && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>

              {/* Progress Label */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{progress}% of target</span>
                {actual?.previousPeriod && (
                  <span className="text-gray-400">
                    Prev: {formatValue(actual.previousPeriod, kpi.unit)}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer - Quick Stats */}
      {actuals.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-around">
          <div className="text-center">
            <div className="text-sm text-gray-500">On Track</div>
            <div className="text-lg font-bold text-green-600">
              {kpis.filter((kpi) => {
                const actual = getActual(kpi.product);
                return actual && getProgress(actual.current, kpi.target) >= 75;
              }).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">At Risk</div>
            <div className="text-lg font-bold text-amber-600">
              {kpis.filter((kpi) => {
                const actual = getActual(kpi.product);
                const progress = actual ? getProgress(actual.current, kpi.target) : 0;
                return progress >= 50 && progress < 75;
              }).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Behind</div>
            <div className="text-lg font-bold text-red-600">
              {kpis.filter((kpi) => {
                const actual = getActual(kpi.product);
                return !actual || getProgress(actual.current, kpi.target) < 50;
              }).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EBKPIPanel;
