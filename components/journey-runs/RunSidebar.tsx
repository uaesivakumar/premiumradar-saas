/**
 * Run Sidebar Component
 * Sprint S50: Journey Execution Viewer
 *
 * Navigation sidebar for browsing journey runs with filters
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import type { JourneyRunSummary, JourneyRunStatus, JourneyRunTrigger } from '@/lib/journey-runs';

interface RunSidebarProps {
  journeyId: string;
  runs: JourneyRunSummary[];
  currentRunId?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function RunSidebar({
  journeyId,
  runs,
  currentRunId,
  isLoading,
  onLoadMore,
  hasMore,
}: RunSidebarProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<JourneyRunStatus | 'all'>('all');
  const [triggerFilter, setTriggerFilter] = useState<JourneyRunTrigger | 'all'>('all');

  const filteredRuns = runs.filter((run) => {
    if (statusFilter !== 'all' && run.status !== statusFilter) return false;
    if (triggerFilter !== 'all' && run.triggeredBy !== triggerFilter) return false;
    return true;
  });

  const handleRunClick = (runId: string) => {
    router.push(`/dashboard/journeys/${journeyId}/runs/${runId}`);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Run History</h2>
        <p className="text-sm text-gray-500">{runs.length} runs</p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        {/* Status filter */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </label>
          <div className="mt-1 flex flex-wrap gap-1">
            {(['all', 'success', 'failed', 'running', 'paused'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors',
                  statusFilter === status
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Trigger filter */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Triggered By
          </label>
          <div className="mt-1 flex flex-wrap gap-1">
            {(['all', 'user', 'autonomous', 'api'] as const).map((trigger) => (
              <button
                key={trigger}
                onClick={() => setTriggerFilter(trigger)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors',
                  triggerFilter === trigger
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {trigger === 'all' ? 'All' : trigger.charAt(0).toUpperCase() + trigger.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Run list */}
      <div className="flex-grow overflow-auto">
        {isLoading && filteredRuns.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
            <p className="mt-2 text-sm">Loading runs...</p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No runs match the filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRuns.map((run) => (
              <RunListItem
                key={run.id}
                run={run}
                isActive={run.id === currentRunId}
                onClick={() => handleRunClick(run.id)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="p-4">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load more runs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface RunListItemProps {
  run: JourneyRunSummary;
  isActive: boolean;
  onClick: () => void;
}

function RunListItem({ run, isActive, onClick }: RunListItemProps) {
  const statusConfig = {
    running: { color: 'bg-blue-500', pulse: true },
    success: { color: 'bg-green-500', pulse: false },
    failed: { color: 'bg-red-500', pulse: false },
    paused: { color: 'bg-yellow-500', pulse: false },
    cancelled: { color: 'bg-gray-500', pulse: false },
  };

  const config = statusConfig[run.status];
  const triggerLabel = {
    user: 'Manual',
    autonomous: 'Auto',
    api: 'API',
    schedule: 'Sched',
    webhook: 'Hook',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 text-left transition-colors',
        isActive ? 'bg-primary-50' : 'hover:bg-gray-50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <span
          className={cn(
            'mt-1 w-2 h-2 rounded-full flex-shrink-0',
            config.color,
            config.pulse && 'animate-pulse'
          )}
        />

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              #{run.id.slice(0, 8)}
            </p>
            <span className="text-xs text-gray-400">
              {triggerLabel[run.triggeredBy]}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-0.5">
            {formatRelativeTime(run.startedAt)}
          </p>

          {/* Quick stats */}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>{run.completedSteps}/{run.totalSteps} steps</span>
            {run.errorCount > 0 && (
              <span className="text-red-500">{run.errorCount} errors</span>
            )}
            {run.pendingCheckpoints > 0 && (
              <span className="text-yellow-500">{run.pendingCheckpoints} pending</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default RunSidebar;
