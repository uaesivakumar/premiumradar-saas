/**
 * Dashboard Container Component
 * Sprint S54: Vertical Dashboards
 *
 * Main container that orchestrates all dashboard widgets.
 */

import React from 'react';
import type { VerticalId, VerticalConfig, DateRange } from '../../lib/dashboard';
import { useDashboard, useVerticalConfig } from '../../lib/dashboard';
import { KPIGrid } from './KPIGrid';
import { OutreachFunnel } from './OutreachFunnel';
import { PersonaRanking } from './PersonaRanking';
import { DiscoveryHeatmap } from './DiscoveryHeatmap';
import { MetricsTrend } from './MetricsTrend';
import { IntelligenceSignalList } from './IntelligenceSignalList';
import { VerticalSelector } from './VerticalSelector';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';

interface DashboardContainerProps {
  initialVertical?: VerticalId;
  territory?: string;
  dateRange?: DateRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onVerticalChange?: (vertical: VerticalId) => void;
}

export function DashboardContainer({
  initialVertical = 'banking',
  territory,
  dateRange,
  autoRefresh = true,
  refreshInterval = 60,
  onVerticalChange,
}: DashboardContainerProps) {
  const [selectedVertical, setSelectedVertical] = React.useState<VerticalId>(initialVertical);
  const { config, allVerticals } = useVerticalConfig(selectedVertical);

  const { data, isLoading, error, refresh, lastUpdated } = useDashboard(selectedVertical, {
    territory,
    dateRange,
    autoRefresh,
    refreshInterval,
  });

  const handleVerticalChange = (vertical: VerticalId) => {
    setSelectedVertical(vertical);
    onVerticalChange?.(vertical);
  };

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <DashboardHeader
          config={config}
          verticals={allVerticals}
          selected={selectedVertical}
          onVerticalChange={handleVerticalChange}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          isRefreshing={isLoading}
        />
        <DashboardErrorState error={error} onRetry={refresh} showDetails />
      </div>
    );
  }

  // Empty state
  if (!isLoading && data && isDataEmpty(data)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <DashboardHeader
          config={config}
          verticals={allVerticals}
          selected={selectedVertical}
          onVerticalChange={handleVerticalChange}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          isRefreshing={isLoading}
        />
        <DashboardEmptyState
          vertical={config || undefined}
          title="No Intelligence Data Yet"
          description="Start by running discovery and outreach to see your dashboard come to life."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <DashboardHeader
          config={config}
          verticals={allVerticals}
          selected={selectedVertical}
          onVerticalChange={handleVerticalChange}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          isRefreshing={isLoading}
        />

        <div className="space-y-6">
          {/* KPI Row */}
          <section>
            <KPIGrid kpis={data?.kpis || []} loading={isLoading} columns={4} />
          </section>

          {/* Main Grid: Funnel + Personas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              <OutreachFunnel funnel={data?.funnel || null} loading={isLoading} />
            </section>
            <section>
              <PersonaRanking personas={data?.personas || []} loading={isLoading} />
            </section>
          </div>

          {/* Analytics Row: Heatmap + Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              <DiscoveryHeatmap heatmap={data?.heatmap || null} loading={isLoading} />
            </section>
            <section>
              <MetricsTrend trends={data?.trends || []} loading={isLoading} />
            </section>
          </div>

          {/* Intelligence Signals */}
          <section>
            <IntelligenceSignalList
              signals={data?.signals || []}
              loading={isLoading}
              maxDisplay={10}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

interface DashboardHeaderProps {
  config: VerticalConfig | null;
  verticals: VerticalConfig[];
  selected: VerticalId;
  onVerticalChange: (vertical: VerticalId) => void;
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function DashboardHeader({
  config,
  verticals,
  selected,
  onVerticalChange,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {config?.icon} {config?.name || 'Dashboard'} Intelligence
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {config?.description || 'Real-time intelligence dashboard'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`
              p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors
              ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title="Refresh data"
          >
            <svg
              className={`w-5 h-5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <VerticalSelector
        verticals={verticals}
        selected={selected}
        onChange={onVerticalChange}
        disabled={isRefreshing}
      />
    </div>
  );
}

function isDataEmpty(data: ReturnType<typeof useDashboard>['data']): boolean {
  if (!data) return true;
  return (
    data.kpis.length === 0 &&
    data.funnel.stages.length === 0 &&
    data.personas.length === 0 &&
    data.signals.length === 0
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString();
}

export default DashboardContainer;
