'use client';

/**
 * KPIHeader Component
 * Sprint S56-S62: Intelligence Suite
 *
 * Displays key performance indicators at the top of intelligence dashboard.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface KPIItem {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeDirection?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

interface KPIHeaderProps {
  kpis: KPIItem[];
  className?: string;
}

export function KPIHeader({ kpis, className }: KPIHeaderProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

function KPICard({ kpi }: { kpi: KPIItem }) {
  const { label, value, unit, change, changeDirection, icon, color } = kpi;

  const changeColor =
    changeDirection === 'up'
      ? 'text-green-600'
      : changeDirection === 'down'
        ? 'text-red-600'
        : 'text-gray-500';

  const changeIcon =
    changeDirection === 'up' ? '↑' : changeDirection === 'down' ? '↓' : '→';

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700',
        'hover:shadow-md transition-shadow'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold"
          style={{ color: color || 'inherit' }}
        >
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        {unit && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        )}
      </div>

      {change !== undefined && (
        <div className={cn('flex items-center gap-1 mt-2 text-sm', changeColor)}>
          <span>{changeIcon}</span>
          <span>{Math.abs(change)}%</span>
          <span className="text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export default KPIHeader;
