/**
 * Error Dashboard Component
 *
 * Error tracking and visualization.
 */

'use client';

import { useState } from 'react';
import {
  useErrorStore,
  getSeverityInfo,
  getCategoryInfo,
  getStatusInfo,
  formatRelativeTime,
  calculateImpactScore,
  type ErrorGroup,
  type ErrorMetrics,
  type ErrorSeverity,
} from '@/lib/analytics';

interface ErrorDashboardProps {
  metrics: ErrorMetrics;
  groups: ErrorGroup[];
  onStatusChange?: (fingerprint: string, status: ErrorGroup['status']) => void;
}

export function ErrorDashboard({
  metrics,
  groups,
  onStatusChange,
}: ErrorDashboardProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<ErrorSeverity | 'all'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'count' | 'recent' | 'impact'>('count');

  // Filter and sort groups
  const filteredGroups = groups
    .filter((g) => selectedSeverity === 'all' || g.severity === selectedSeverity)
    .sort((a, b) => {
      switch (sortBy) {
        case 'count':
          return b.count - a.count;
        case 'recent':
          return b.lastSeen.getTime() - a.lastSeen.getTime();
        case 'impact':
          return calculateImpactScore(b) - calculateImpactScore(a);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Errors"
          value={metrics.totalErrors.toLocaleString()}
          trend={metrics.trend}
          icon="⚠️"
        />
        <MetricCard
          label="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}/1K`}
          subtext="per 1000 sessions"
          icon="📊"
        />
        <MetricCard
          label="Critical"
          value={metrics.errorsBySeverity.critical.toString()}
          color="red"
          icon="🔴"
        />
        <MetricCard
          label="Unique Issues"
          value={groups.length.toString()}
          icon="🎯"
        />
      </div>

      {/* Error breakdown by severity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Errors by Severity</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Severity filter */}
            <select
              value={selectedSeverity}
              onChange={(e) =>
                setSelectedSeverity(e.target.value as ErrorSeverity | 'all')
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'count' | 'recent' | 'impact')
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <option value="count">Most Frequent</option>
              <option value="recent">Most Recent</option>
              <option value="impact">Highest Impact</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredGroups.map((group) => (
            <ErrorRow
              key={group.fingerprint}
              group={group}
              onStatusChange={onStatusChange}
            />
          ))}

          {filteredGroups.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No errors found</p>
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <CategoryBreakdown metrics={metrics} />
        <SeverityChart metrics={metrics} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  trend,
  color,
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  icon: string;
}) {
  const trendColors = {
    up: 'text-red-500',
    down: 'text-green-500',
    stable: 'text-gray-500',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-sm ${trendColors[trend]}`}>
            {trendIcons[trend]} {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className={`text-2xl font-bold ${color ? `text-${color}-600` : 'text-gray-900'}`}>
          {value}
        </div>
        <div className="text-sm text-gray-500">{subtext || label}</div>
      </div>
    </div>
  );
}

function ErrorRow({
  group,
  onStatusChange,
}: {
  group: ErrorGroup;
  onStatusChange?: (fingerprint: string, status: ErrorGroup['status']) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const severityInfo = getSeverityInfo(group.severity);
  const categoryInfo = getCategoryInfo(group.category);
  const statusInfo = getStatusInfo(group.status);
  const impactScore = calculateImpactScore(group);

  return (
    <div className="px-6 py-4">
      <div
        className="flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Severity indicator */}
        <span className={`px-2 py-1 text-xs rounded ${severityInfo.bgColor}`}>
          {severityInfo.icon} {severityInfo.label}
        </span>

        {/* Error message */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{group.message}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{categoryInfo.icon} {categoryInfo.label}</span>
            <span>•</span>
            <span>{group.count} occurrences</span>
            <span>•</span>
            <span>{group.affectedUsers} users</span>
          </div>
        </div>

        {/* Impact score */}
        <div className="text-center">
          <div
            className={`text-lg font-bold ${
              impactScore >= 70
                ? 'text-red-600'
                : impactScore >= 40
                  ? 'text-orange-600'
                  : 'text-gray-600'
            }`}
          >
            {impactScore}
          </div>
          <div className="text-xs text-gray-500">Impact</div>
        </div>

        {/* Status */}
        <select
          value={group.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange?.(group.fingerprint, e.target.value as ErrorGroup['status']);
          }}
          className={`text-sm px-2 py-1 rounded border ${
            group.status === 'new'
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : group.status === 'investigating'
                ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                : group.status === 'resolved'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="new">New</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>

        {/* Time */}
        <div className="text-right text-sm text-gray-500 w-24">
          {formatRelativeTime(group.lastSeen)}
        </div>

        {/* Expand icon */}
        <span className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pl-8 pr-4 py-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">First seen</div>
              <div className="font-medium">
                {group.firstSeen.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Last seen</div>
              <div className="font-medium">
                {group.lastSeen.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Fingerprint</div>
              <div className="font-mono text-xs">{group.fingerprint}</div>
            </div>
            <div>
              <div className="text-gray-500">Assignee</div>
              <div className="font-medium">{group.assignee || 'Unassigned'}</div>
            </div>
          </div>

          {/* Recent events */}
          {group.events.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-2">Recent Events</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {group.events.slice(-5).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs bg-white p-2 rounded border border-gray-200"
                  >
                    <div className="flex justify-between">
                      <span>{event.pageUrl || 'Unknown page'}</span>
                      <span className="text-gray-400">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryBreakdown({ metrics }: { metrics: ErrorMetrics }) {
  const categories = Object.entries(metrics.errorsByCategory)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = Object.values(metrics.errorsByCategory).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">By Category</h3>
      </div>

      <div className="p-6 space-y-4">
        {categories.map(([category, count]) => {
          const info = getCategoryInfo(category as any);
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">
                  {info.icon} {info.label}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeverityChart({ metrics }: { metrics: ErrorMetrics }) {
  const total = Object.values(metrics.errorsBySeverity).reduce((a, b) => a + b, 0);

  const severities: ErrorSeverity[] = ['critical', 'error', 'warning', 'info'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">By Severity</h3>
      </div>

      <div className="p-6">
        {/* Horizontal stacked bar */}
        <div className="h-8 flex rounded-lg overflow-hidden">
          {severities.map((severity) => {
            const count = metrics.errorsBySeverity[severity];
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const info = getSeverityInfo(severity);

            if (percentage === 0) return null;

            return (
              <div
                key={severity}
                className={`${info.bgColor.split(' ')[0]} flex items-center justify-center`}
                style={{ width: `${percentage}%` }}
                title={`${info.label}: ${count}`}
              >
                {percentage > 10 && (
                  <span className="text-xs font-medium">{percentage.toFixed(0)}%</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {severities.map((severity) => {
            const count = metrics.errorsBySeverity[severity];
            const info = getSeverityInfo(severity);

            return (
              <div key={severity} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded ${info.bgColor.split(' ')[0]}`} />
                <span className="text-sm text-gray-600">{info.label}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
