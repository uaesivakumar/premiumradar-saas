/**
 * KPI Grid Component
 * Sprint S54: Vertical Dashboards
 *
 * Displays KPI blocks in a responsive grid layout.
 */

import React from 'react';
import type { KPIBlock } from '../../lib/dashboard';

interface KPIGridProps {
  kpis: KPIBlock[];
  columns?: 2 | 3 | 4;
  loading?: boolean;
}

export function KPIGrid({ kpis, columns = 4, loading = false }: KPIGridProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-4`}>
        {Array.from({ length: columns }).map((_, i) => (
          <KPIBlockSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No KPI data available
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-4`}>
      {kpis.map((kpi) => (
        <KPIBlockCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

interface KPIBlockCardProps {
  kpi: KPIBlock;
}

function KPIBlockCard({ kpi }: KPIBlockCardProps) {
  const changeColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  }[kpi.changeDirection || 'neutral'];

  const changeIcon = {
    up: '↑',
    down: '↓',
    neutral: '→',
  }[kpi.changeDirection || 'neutral'];

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
      style={{ borderLeftColor: kpi.color || '#3b82f6', borderLeftWidth: '4px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{kpi.icon || '📊'}</span>
        {kpi.change !== undefined && (
          <span className={`text-sm font-medium ${changeColor}`}>
            {changeIcon} {Math.abs(kpi.change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {formatValue(kpi.value)}
        {kpi.unit && <span className="text-sm font-normal text-gray-500">{kpi.unit}</span>}
      </div>
      <div className="text-sm text-gray-600 mt-1">{kpi.label}</div>
    </div>
  );
}

function KPIBlockSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 bg-gray-200 rounded" />
        <div className="w-12 h-4 bg-gray-200 rounded" />
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded mb-2" />
      <div className="w-24 h-4 bg-gray-200 rounded" />
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export default KPIGrid;
