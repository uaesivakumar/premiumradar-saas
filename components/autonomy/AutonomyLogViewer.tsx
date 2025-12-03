'use client';

/**
 * AutonomyLogViewer Component
 * Sprint S58: Autonomous Safety UI
 *
 * Displays autonomous activity log with filtering and search.
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { AutonomousActivity } from '@/lib/intelligence-suite/types';

interface AutonomyLogViewerProps {
  activities: AutonomousActivity[];
  className?: string;
}

export function AutonomyLogViewer({ activities, className }: AutonomyLogViewerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AutonomousActivity['status'] | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Get unique types
  const activityTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.type));
    return Array.from(types);
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (statusFilter !== 'all' && activity.status !== statusFilter) return false;
      if (typeFilter !== 'all' && activity.type !== typeFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          activity.action.toLowerCase().includes(searchLower) ||
          activity.type.toLowerCase().includes(searchLower) ||
          activity.result?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [activities, statusFilter, typeFilter, search]);

  const getStatusIcon = (status: AutonomousActivity['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'cancelled':
        return '⊘';
      default:
        return '○';
    }
  };

  const getStatusColor = (status: AutonomousActivity['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'running':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Activity Log
          </h3>
          <span className="text-sm text-gray-500">
            {filteredActivities.length} of {activities.length} activities
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AutonomousActivity['status'] | 'all')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Types</option>
            {activityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Entries */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {filteredActivities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}

        {filteredActivities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No activities found
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityRowProps {
  activity: AutonomousActivity;
}

function ActivityRow({ activity }: ActivityRowProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status: AutonomousActivity['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'running':
        return '🔄';
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'cancelled':
        return '⊘';
      default:
        return '○';
    }
  };

  const getStatusColor = (status: AutonomousActivity['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status Icon */}
        <span className={cn('text-lg', getStatusColor(activity.status))}>
          {getStatusIcon(activity.status)}
        </span>

        {/* Time */}
        <span className="text-xs text-gray-400 font-mono w-20 flex-shrink-0">
          {new Date(activity.startedAt).toLocaleTimeString()}
        </span>

        {/* Type Badge */}
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
          {activity.type}
        </span>

        {/* Action */}
        <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
          {activity.action}
        </span>

        {/* Duration */}
        {activity.duration && (
          <span className="text-xs text-gray-500">
            {activity.duration}ms
          </span>
        )}

        {/* Expand */}
        <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-2 ml-8 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm space-y-2">
          {activity.result && (
            <div>
              <span className="text-gray-500">Result:</span>{' '}
              <span className="text-gray-900 dark:text-white">{activity.result}</span>
            </div>
          )}
          {activity.error && (
            <div className="text-red-600">
              <span className="font-medium">Error:</span> {activity.error}
            </div>
          )}
          {activity.completedAt && (
            <div className="text-gray-500 text-xs">
              Completed: {new Date(activity.completedAt).toLocaleString()}
            </div>
          )}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div>
              <span className="text-gray-500">Metadata:</span>
              <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutonomyLogViewer;
