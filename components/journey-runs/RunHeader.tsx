/**
 * Run Header Component
 * Sprint S50: Journey Execution Viewer
 *
 * Displays run status, timing, trigger info, and cost summary
 */
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type { JourneyRun, AIUsageMetrics } from '@/lib/journey-runs';

interface RunHeaderProps {
  run: JourneyRun;
  aiUsage?: AIUsageMetrics;
}

export function RunHeader({ run, aiUsage }: RunHeaderProps) {
  const statusConfig = {
    running: { label: 'Running', variant: 'default' as const, dot: 'bg-blue-500 animate-pulse' },
    success: { label: 'Success', variant: 'success' as const, dot: 'bg-green-500' },
    failed: { label: 'Failed', variant: 'destructive' as const, dot: 'bg-red-500' },
    paused: { label: 'Paused', variant: 'warning' as const, dot: 'bg-yellow-500' },
    cancelled: { label: 'Cancelled', variant: 'secondary' as const, dot: 'bg-gray-500' },
  };

  const triggerLabels = {
    user: 'Manual',
    autonomous: 'Autonomous',
    api: 'API',
    schedule: 'Scheduled',
    webhook: 'Webhook',
  };

  const config = statusConfig[run.status];
  const duration = run.totalDurationMs
    ? formatDuration(run.totalDurationMs)
    : run.endedAt
      ? formatDuration(new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime())
      : 'In progress...';

  const cost = aiUsage?.totalCostMicros
    ? `$${(aiUsage.totalCostMicros / 1_000_000).toFixed(4)}`
    : run.totalCostMicros
      ? `$${(run.totalCostMicros / 1_000_000).toFixed(4)}`
      : '$0.00';

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {/* Status and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', config.dot)} />
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Run #{run.id.slice(0, 8)}
              </p>
              <p className="text-xs text-gray-500">
                Triggered by {triggerLabels[run.triggeredBy]}
              </p>
            </div>
          </div>

          {/* Timing */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">Started</p>
              <p className="text-sm font-medium">
                {formatDateTime(run.startedAt)}
              </p>
            </div>
            {run.endedAt && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Ended</p>
                <p className="text-sm font-medium">
                  {formatDateTime(run.endedAt)}
                </p>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-medium">{duration}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500">Steps</p>
              <p className="text-sm font-medium">
                {run.completedSteps}/{run.totalSteps}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Tokens</p>
              <p className="text-sm font-medium">
                {(aiUsage?.totalTokens || run.totalTokens || 0).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Cost</p>
              <p className="text-sm font-medium text-primary-600">{cost}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {run.summary && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">{run.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
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

export default RunHeader;
