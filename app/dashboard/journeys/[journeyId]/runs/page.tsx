/**
 * Journey Runs List Page
 * Sprint S50: Journey Execution Viewer
 *
 * Lists all runs for a journey with filters and navigation
 */
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useJourneyRuns } from '@/lib/journey-runs';
import type { JourneyRunSummary } from '@/lib/journey-runs';

interface PageProps {
  params: Promise<{ journeyId: string }>;
}

export default function JourneyRunsPage({ params }: PageProps) {
  const { journeyId } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useJourneyRuns(journeyId, {
    limit: 50,
    includeStats: true,
  });

  const handleRunClick = (runId: string) => {
    router.push(`/dashboard/journeys/${journeyId}/runs/${runId}`);
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <p className="text-red-700">Failed to load runs: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Run History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Journey: {journeyId.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {data?.data.stats && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Runs"
            value={data.data.stats.totalRuns}
          />
          <StatCard
            label="Successful"
            value={data.data.stats.successfulRuns}
            variant="success"
          />
          <StatCard
            label="Failed"
            value={data.data.stats.failedRuns}
            variant="error"
          />
          <StatCard
            label="Running"
            value={data.data.stats.runningRuns}
            variant="info"
          />
        </div>
      )}

      {/* Runs table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : !data?.data.runs.length ? (
            <div className="text-center py-12 text-gray-500">
              <p>No runs found for this journey</p>
              <p className="text-sm mt-1">Runs will appear here once the journey executes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Run ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Triggered
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Steps
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.runs.map((run) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      onClick={() => handleRunClick(run.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data?.data.pagination && data.data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
              <p className="text-sm text-gray-500">
                Showing {data.data.runs.length} of {data.data.pagination.total} runs
              </p>
              <div className="flex gap-2">
                <button
                  disabled={data.data.pagination.page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={!data.data.pagination.hasMore}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'error' | 'info';
}) {
  const colors = {
    default: 'text-gray-900',
    success: 'text-green-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-3xl font-bold ${colors[variant]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function RunRow({
  run,
  onClick,
}: {
  run: JourneyRunSummary;
  onClick: () => void;
}) {
  const statusConfig = {
    running: { label: 'Running', variant: 'default' as const },
    success: { label: 'Success', variant: 'success' as const },
    failed: { label: 'Failed', variant: 'destructive' as const },
    paused: { label: 'Paused', variant: 'warning' as const },
    cancelled: { label: 'Cancelled', variant: 'secondary' as const },
  };

  const config = statusConfig[run.status];
  const cost = `$${(run.totalCostMicros / 1_000_000).toFixed(4)}`;

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <td className="py-3 px-4">
        <span className="text-sm font-mono text-gray-900">
          #{run.id.slice(0, 8)}
        </span>
      </td>
      <td className="py-3 px-4">
        <Badge variant={config.variant}>{config.label}</Badge>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600 capitalize">{run.triggeredBy}</span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">
          {formatDateTime(run.startedAt)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">
          {run.totalDurationMs ? formatDuration(run.totalDurationMs) : '—'}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">
          {run.completedSteps}/{run.totalSteps}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-gray-600">{cost}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          {run.errorCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
              {run.errorCount} errors
            </span>
          )}
          {run.pendingCheckpoints > 0 && (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
              {run.pendingCheckpoints} pending
            </span>
          )}
          {run.errorCount === 0 && run.pendingCheckpoints === 0 && (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
