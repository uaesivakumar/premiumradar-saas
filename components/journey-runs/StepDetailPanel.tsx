/**
 * Step Detail Panel Component
 * Sprint S50: Journey Execution Viewer
 *
 * Tabbed panel showing step details: Overview, AI Execution, Context, Errors
 */
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import type {
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunContextSnapshot,
  JourneyRunError,
} from '@/lib/journey-runs';

interface StepDetailPanelProps {
  step: JourneyRunStep;
  aiLog?: JourneyRunAILog;
  contextSnapshot?: JourneyRunContextSnapshot;
  errors: JourneyRunError[];
  onClose?: () => void;
}

type Tab = 'overview' | 'ai' | 'context' | 'errors';

export function StepDetailPanel({
  step,
  aiLog,
  contextSnapshot,
  errors,
  onClose,
}: StepDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai', label: 'AI Execution' },
    { id: 'context', label: 'Context' },
    { id: 'errors', label: 'Errors', count: errors.length },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {step.stepName || step.stepId}
          </CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-auto pt-4">
        {activeTab === 'overview' && <OverviewTab step={step} />}
        {activeTab === 'ai' && <AIExecutionTab aiLog={aiLog} />}
        {activeTab === 'context' && <ContextTab snapshot={contextSnapshot} />}
        {activeTab === 'errors' && <ErrorsTab errors={errors} />}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// OVERVIEW TAB
// =============================================================================

function OverviewTab({ step }: { step: JourneyRunStep }) {
  const statusVariant = {
    pending: 'secondary',
    queued: 'secondary',
    running: 'default',
    completed: 'success',
    failed: 'destructive',
    skipped: 'secondary',
    waiting: 'warning',
    timeout: 'destructive',
  } as const;

  return (
    <div className="space-y-4">
      {/* Status row */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-600">Status</span>
        <Badge variant={statusVariant[step.status]}>{step.status}</Badge>
      </div>

      {/* Step info */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="Step ID" value={step.stepId} />
        <InfoItem label="Step Type" value={step.stepType || 'N/A'} />
        <InfoItem
          label="Started"
          value={step.startedAt ? formatDateTime(step.startedAt) : 'Not started'}
        />
        <InfoItem
          label="Completed"
          value={step.completedAt ? formatDateTime(step.completedAt) : 'Not completed'}
        />
        <InfoItem
          label="Duration"
          value={step.durationMs ? formatDuration(step.durationMs) : 'N/A'}
        />
        <InfoItem
          label="Execution Order"
          value={step.executionOrder?.toString() || 'N/A'}
        />
      </div>

      {/* Decision */}
      {step.decision && (
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-700 mb-2">Decision</p>
          <pre className="text-xs text-purple-600 overflow-auto">
            {JSON.stringify(step.decision, null, 2)}
          </pre>
          {step.decisionReason && (
            <p className="mt-2 text-sm text-purple-600 italic">{step.decisionReason}</p>
          )}
        </div>
      )}

      {/* Fallback */}
      {step.fallbackTriggered && (
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm font-medium text-yellow-700 mb-2">Fallback Triggered</p>
          <InfoItem label="Strategy" value={step.fallbackStrategy || 'unknown'} />
          {step.fallbackStepId && (
            <InfoItem label="Fallback Step" value={step.fallbackStepId} />
          )}
        </div>
      )}

      {/* Retry info */}
      {step.retryCount > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Retry Info</p>
          <InfoItem label="Retries" value={`${step.retryCount}/${step.maxRetries}`} />
          {step.lastRetryAt && (
            <InfoItem label="Last Retry" value={formatDateTime(step.lastRetryAt)} />
          )}
        </div>
      )}

      {/* Output data */}
      {step.outputData && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-700 mb-2">Output Data</p>
          <pre className="text-xs text-green-600 overflow-auto max-h-40">
            {JSON.stringify(step.outputData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// AI EXECUTION TAB
// =============================================================================

function AIExecutionTab({ aiLog }: { aiLog?: JourneyRunAILog }) {
  if (!aiLog) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        <p>No AI execution for this step</p>
      </div>
    );
  }

  const cost = aiLog.costMicros ? `$${(aiLog.costMicros / 1_000_000).toFixed(6)}` : 'N/A';

  return (
    <div className="space-y-4">
      {/* Model info */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
        <InfoItem label="Model" value={aiLog.modelId || 'Unknown'} />
        <InfoItem label="Template" value={aiLog.templateId || 'N/A'} />
        <InfoItem label="Version" value={aiLog.templateVersion?.toString() || 'N/A'} />
        <InfoItem label="Latency" value={aiLog.latencyMs ? `${aiLog.latencyMs}ms` : 'N/A'} />
      </div>

      {/* Token usage */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">
            {aiLog.inputTokens?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500">Input Tokens</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-900">
            {aiLog.outputTokens?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500">Output Tokens</p>
        </div>
        <div className="p-3 bg-primary-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-primary-600">{cost}</p>
          <p className="text-xs text-gray-500">Cost</p>
        </div>
      </div>

      {/* System prompt */}
      {aiLog.systemPrompt && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">System Prompt</p>
          <pre className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-40 whitespace-pre-wrap">
            {aiLog.systemPrompt}
          </pre>
        </div>
      )}

      {/* User prompt */}
      {aiLog.userPrompt && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">User Prompt</p>
          <pre className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-40 whitespace-pre-wrap">
            {aiLog.userPrompt}
          </pre>
        </div>
      )}

      {/* Response */}
      {aiLog.response && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Response</p>
          <pre className="p-3 bg-green-50 rounded-lg text-xs text-green-700 overflow-auto max-h-60 whitespace-pre-wrap">
            {aiLog.response}
          </pre>
        </div>
      )}

      {/* Decision outcome */}
      {aiLog.selectedOutcome && (
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm font-medium text-purple-700 mb-2">AI Decision</p>
          <InfoItem label="Outcome" value={aiLog.selectedOutcome} />
          {aiLog.confidence && (
            <InfoItem
              label="Confidence"
              value={`${(aiLog.confidence * 100).toFixed(1)}%`}
            />
          )}
          {aiLog.reasoning && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Reasoning:</p>
              <p className="text-sm text-purple-600">{aiLog.reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Checkpoint */}
      {aiLog.checkpointRequired && (
        <div className="p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm font-medium text-yellow-700">Checkpoint Required</p>
          <InfoItem label="Status" value={aiLog.checkpointStatus || 'Pending'} />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CONTEXT TAB
// =============================================================================

function ContextTab({ snapshot }: { snapshot?: JourneyRunContextSnapshot }) {
  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        <p>No context snapshot for this step</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Snapshot info */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
        <InfoItem label="Type" value={snapshot.snapshotType} />
        <InfoItem
          label="Est. Tokens"
          value={snapshot.estimatedTokens?.toLocaleString() || 'N/A'}
        />
        <InfoItem
          label="Captured"
          value={formatDateTime(snapshot.createdAt)}
        />
        <InfoItem
          label="Sources"
          value={snapshot.sourcesIncluded?.join(', ') || 'N/A'}
        />
      </div>

      {/* Context JSON */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Context Data</p>
        <pre className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-96">
          {JSON.stringify(snapshot.contextJson, null, 2)}
        </pre>
      </div>

      {/* Changes from previous */}
      {snapshot.changesFromPrevious && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Changes from Previous</p>
          <pre className="p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 overflow-auto max-h-40">
            {JSON.stringify(snapshot.changesFromPrevious, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ERRORS TAB
// =============================================================================

function ErrorsTab({ errors }: { errors: JourneyRunError[] }) {
  if (errors.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        <p>No errors for this step</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errors.map((error) => (
        <div key={error.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Badge variant="destructive">{error.errorCode}</Badge>
              {error.errorType && (
                <span className="ml-2 text-xs text-gray-500">{error.errorType}</span>
              )}
            </div>
            <div className="flex gap-2">
              {error.retryable && (
                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                  Retryable
                </span>
              )}
              {error.recovered && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                  Recovered
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-red-700 font-medium">{error.message}</p>

          {error.recoveryAction && (
            <p className="mt-2 text-xs text-gray-600">
              Recovery: {error.recoveryAction}
            </p>
          )}

          {error.stacktrace && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Stack trace
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-auto max-h-40">
                {error.stacktrace}
              </pre>
            </details>
          )}

          <p className="mt-2 text-xs text-gray-400">
            {formatDateTime(error.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
    </div>
  );
}

function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default StepDetailPanel;
