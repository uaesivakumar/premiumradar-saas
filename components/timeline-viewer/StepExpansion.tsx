/**
 * Step Expansion Component
 * Sprint S51: Timeline Viewer
 *
 * Expandable step details with context diff, AI logs, and error traces.
 */
'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import type { TimelineItem, StepContextDiff, ContextDiffEntry } from '@/lib/timeline-viewer';
import { formatDuration, formatCost, formatTokens, calculateContextDiff } from '@/lib/timeline-viewer';
import type { JourneyRunContextSnapshot } from '@/lib/journey-runs';

interface StepExpansionProps {
  item: TimelineItem;
  previousSnapshot?: JourneyRunContextSnapshot;
  currentSnapshot?: JourneyRunContextSnapshot;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

type TabType = 'overview' | 'ai' | 'context' | 'errors';

export function StepExpansion({
  item,
  previousSnapshot,
  currentSnapshot,
  isExpanded,
  onToggle,
  onSelect,
  isSelected,
}: StepExpansionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Calculate context diff
  const contextDiff = useMemo(() => {
    return calculateContextDiff(previousSnapshot, currentSnapshot);
  }, [previousSnapshot, currentSnapshot]);

  const getStatusColor = () => {
    if (item.hasError) return 'border-red-300 bg-red-50';
    if (item.hasFallback) return 'border-yellow-300 bg-yellow-50';
    if (item.isBottleneck) return 'border-orange-300 bg-orange-50';
    if (item.status === 'completed') return 'border-green-300 bg-green-50';
    if (item.status === 'running') return 'border-blue-300 bg-blue-50';
    return 'border-gray-200 bg-white';
  };

  const getStatusIcon = () => {
    if (item.hasError) return '❌';
    if (item.hasFallback) return '🔄';
    if (item.isBottleneck) return '⚠️';
    if (item.status === 'completed') return '✅';
    if (item.status === 'running') return '⏳';
    if (item.status === 'skipped') return '⏭️';
    return '○';
  };

  return (
    <div
      className={cn(
        'border rounded-lg transition-all',
        getStatusColor(),
        isSelected && 'ring-2 ring-primary-500'
      )}
    >
      {/* Header - always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onSelect}
      >
        {/* Status icon */}
        <span className="text-lg">{getStatusIcon()}</span>

        {/* Step info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {item.stepName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
              {item.stepType}
            </span>
            {item.isAI && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-600">
                AI
              </span>
            )}
            {item.isDecision && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600">
                Decision
              </span>
            )}
            {item.isBottleneck && (
              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600">
                Bottleneck
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Duration: {formatDuration(item.durationMs)}
            {item.aiLog && (
              <span className="ml-2">
                • Tokens: {formatTokens(item.aiLog.totalTokens || 0)}
                • Cost: {formatCost(item.aiLog.costMicros || 0)}
              </span>
            )}
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        >
          <svg
            className={cn(
              'w-5 h-5 text-gray-500 transition-transform',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['overview', 'ai', 'context', 'errors'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'errors' && item.errors.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                    {item.errors.length}
                  </span>
                )}
                {tab === 'context' && contextDiff.totalChanges > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                    {contextDiff.totalChanges}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'overview' && (
              <OverviewTab item={item} />
            )}
            {activeTab === 'ai' && (
              <AITab item={item} />
            )}
            {activeTab === 'context' && (
              <ContextTab diff={contextDiff} snapshot={currentSnapshot} />
            )}
            {activeTab === 'errors' && (
              <ErrorsTab item={item} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Overview Tab
function OverviewTab({ item }: { item: TimelineItem }) {
  return (
    <div className="space-y-4">
      {/* Timing */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Timing</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">Start</div>
            <div className="text-sm font-mono">{formatDuration(item.startTime)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">End</div>
            <div className="text-sm font-mono">{formatDuration(item.endTime)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Duration</div>
            <div className={cn(
              'text-sm font-mono',
              item.isBottleneck && 'text-orange-600 font-semibold'
            )}>
              {formatDuration(item.durationMs)}
            </div>
          </div>
        </div>
      </div>

      {/* Decision info */}
      {item.isDecision && item.step.decision && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Decision</h4>
          <div className="bg-blue-50 rounded p-3">
            <pre className="text-xs text-blue-800 overflow-auto">
              {JSON.stringify(item.step.decision, null, 2)}
            </pre>
            {item.step.decisionReason && (
              <div className="mt-2 text-xs text-blue-600 italic">
                {item.step.decisionReason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback info */}
      {item.hasFallback && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Fallback</h4>
          <div className="bg-yellow-50 rounded p-3">
            <div className="text-sm text-yellow-800">
              Strategy: {item.step.fallbackStrategy || 'default'}
            </div>
            {item.step.fallbackStepId && (
              <div className="text-xs text-yellow-600 mt-1">
                Fallback to: {item.step.fallbackStepId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Retry info */}
      {item.step.retryCount > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Retries</h4>
          <div className="text-sm">
            {item.step.retryCount} / {item.step.maxRetries} attempts
          </div>
        </div>
      )}

      {/* Transitions */}
      {item.transitions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Transitions</h4>
          <div className="space-y-1">
            {item.transitions.map(t => (
              <div
                key={t.id}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  t.taken ? 'text-green-600' : 'text-gray-400'
                )}
              >
                <span>{t.conditionMet ? '✓' : '✗'}</span>
                <span>→ {t.toStepId}</span>
                {t.taken && (
                  <span className="text-xs bg-green-100 px-1 rounded">taken</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// AI Tab
function AITab({ item }: { item: TimelineItem }) {
  const aiLog = item.aiLog;

  if (!aiLog) {
    return (
      <div className="text-center text-gray-500 py-8">
        No AI activity for this step
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Model info */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500">Model</div>
          <div className="text-sm font-mono">{aiLog.modelId || 'unknown'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Tokens</div>
          <div className="text-sm font-mono">
            {formatTokens(aiLog.inputTokens || 0)} in / {formatTokens(aiLog.outputTokens || 0)} out
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Cost</div>
          <div className="text-sm font-mono">{formatCost(aiLog.costMicros || 0)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Latency</div>
          <div className="text-sm font-mono">{formatDuration(aiLog.latencyMs || 0)}</div>
        </div>
      </div>

      {/* System prompt */}
      {aiLog.systemPrompt && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">System Prompt</h4>
          <div className="bg-gray-50 rounded p-3 max-h-32 overflow-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {aiLog.systemPrompt}
            </pre>
          </div>
        </div>
      )}

      {/* User prompt */}
      {aiLog.userPrompt && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">User Prompt</h4>
          <div className="bg-gray-50 rounded p-3 max-h-32 overflow-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {aiLog.userPrompt}
            </pre>
          </div>
        </div>
      )}

      {/* Response */}
      {aiLog.response && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Response</h4>
          <div className="bg-purple-50 rounded p-3 max-h-48 overflow-auto">
            <pre className="text-xs text-purple-800 whitespace-pre-wrap">
              {aiLog.response}
            </pre>
          </div>
        </div>
      )}

      {/* Decision outcome */}
      {aiLog.selectedOutcome && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Decision</h4>
          <div className="bg-blue-50 rounded p-3">
            <div className="text-sm text-blue-800 font-medium">
              Outcome: {aiLog.selectedOutcome}
            </div>
            {aiLog.confidence !== undefined && (
              <div className="text-xs text-blue-600 mt-1">
                Confidence: {(aiLog.confidence * 100).toFixed(1)}%
              </div>
            )}
            {aiLog.reasoning && (
              <div className="text-xs text-blue-600 mt-2 italic">
                {aiLog.reasoning}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Context Tab
function ContextTab({
  diff,
  snapshot,
}: {
  diff: StepContextDiff;
  snapshot?: JourneyRunContextSnapshot;
}) {
  const [showFullContext, setShowFullContext] = useState(false);

  if (diff.totalChanges === 0 && !snapshot) {
    return (
      <div className="text-center text-gray-500 py-8">
        No context changes for this step
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-600">+{diff.addedKeys.length} added</span>
        <span className="text-red-600">-{diff.removedKeys.length} removed</span>
        <span className="text-yellow-600">~{diff.changedKeys.length} changed</span>
      </div>

      {/* Changes list */}
      {diff.changes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Changes</h4>
          <div className="space-y-1 max-h-64 overflow-auto">
            {diff.changes.map((change, idx) => (
              <ContextDiffRow key={idx} change={change} />
            ))}
          </div>
        </div>
      )}

      {/* Full context toggle */}
      {snapshot && (
        <div>
          <button
            onClick={() => setShowFullContext(!showFullContext)}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            {showFullContext ? 'Hide' : 'Show'} full context
          </button>
          {showFullContext && (
            <div className="mt-2 bg-gray-50 rounded p-3 max-h-64 overflow-auto">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(snapshot.contextJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Context diff row
function ContextDiffRow({ change }: { change: ContextDiffEntry }) {
  const getOperationColor = () => {
    switch (change.operation) {
      case 'added': return 'bg-green-50 border-green-200';
      case 'removed': return 'bg-red-50 border-red-200';
      case 'changed': return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getOperationIcon = () => {
    switch (change.operation) {
      case 'added': return '+';
      case 'removed': return '-';
      case 'changed': return '~';
    }
  };

  return (
    <div className={cn('border rounded p-2 text-xs', getOperationColor())}>
      <div className="flex items-center gap-2">
        <span className="font-bold">{getOperationIcon()}</span>
        <span className="font-mono text-gray-700">{change.path}</span>
      </div>
      {change.operation === 'changed' && (
        <div className="mt-1 pl-4 space-y-1">
          <div className="text-red-600">
            - {JSON.stringify(change.oldValue)}
          </div>
          <div className="text-green-600">
            + {JSON.stringify(change.newValue)}
          </div>
        </div>
      )}
      {change.operation === 'added' && (
        <div className="mt-1 pl-4 text-green-600">
          {JSON.stringify(change.newValue)}
        </div>
      )}
      {change.operation === 'removed' && (
        <div className="mt-1 pl-4 text-red-600">
          {JSON.stringify(change.oldValue)}
        </div>
      )}
    </div>
  );
}

// Errors Tab
function ErrorsTab({ item }: { item: TimelineItem }) {
  if (item.errors.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No errors for this step
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {item.errors.map(error => (
        <div key={error.id} className="bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono px-2 py-0.5 bg-red-100 text-red-700 rounded">
              {error.errorCode}
            </span>
            {error.errorType && (
              <span className="text-xs text-red-600">{error.errorType}</span>
            )}
            {error.recovered && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                Recovered
              </span>
            )}
            {error.retryable && !error.recovered && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                Retryable
              </span>
            )}
          </div>

          <div className="text-sm text-red-800 mb-2">{error.message}</div>

          {error.stacktrace && (
            <details className="text-xs">
              <summary className="cursor-pointer text-red-600 hover:text-red-700">
                Stack trace
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-32 text-red-800">
                {error.stacktrace}
              </pre>
            </details>
          )}

          {error.recoveryAction && (
            <div className="mt-2 text-xs text-green-700">
              Recovery: {error.recoveryAction}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default StepExpansion;
