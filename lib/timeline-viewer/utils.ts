/**
 * Timeline Viewer Utilities
 * Sprint S51: Timeline Viewer
 *
 * Utility functions for timeline calculations, filtering, and transformations.
 */
import type {
  TimelineItem,
  TimelineFilters,
  TimelinePerformanceMetrics,
  StepPerformanceMetrics,
  StepContextDiff,
  ContextDiffEntry,
  TimeScale,
} from './types';
import {
  calculateAutoTimeScale,
  getStepTypeCategory,
  mapStepStatusToFilter,
  isBottleneck,
  TIME_SCALE_MS,
} from './types';
import type {
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunError,
  JourneyRunTransition,
  JourneyRunContextSnapshot,
} from '@/lib/journey-runs';

// =============================================================================
// TIMELINE ITEM CREATION
// =============================================================================

/**
 * Convert steps to timeline items with positioning
 */
export function createTimelineItems(
  steps: JourneyRunStep[],
  aiLogs: JourneyRunAILog[],
  errors: JourneyRunError[],
  transitions: JourneyRunTransition[],
  runStartTime: Date,
  runDurationMs: number
): TimelineItem[] {
  if (steps.length === 0) return [];

  // Calculate average duration for bottleneck detection
  const durations = steps.map(s => s.durationMs || 0).filter(d => d > 0);
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  // Map logs and errors by step
  const aiLogsByStep = new Map<string, JourneyRunAILog>();
  aiLogs.forEach(log => aiLogsByStep.set(log.stepId, log));

  const errorsByStep = new Map<string, JourneyRunError[]>();
  errors.forEach(error => {
    if (error.stepId) {
      const existing = errorsByStep.get(error.stepId) || [];
      existing.push(error);
      errorsByStep.set(error.stepId, existing);
    }
  });

  const transitionsByStep = new Map<string, JourneyRunTransition[]>();
  transitions.forEach(t => {
    const existing = transitionsByStep.get(t.fromStepId) || [];
    existing.push(t);
    transitionsByStep.set(t.fromStepId, existing);
  });

  // Calculate lanes for parallel branches
  const lanes = calculateLanes(steps, transitions);

  // Create timeline items
  return steps.map((step, index) => {
    const startTime = step.startedAt
      ? step.startedAt.getTime() - runStartTime.getTime()
      : index * 100; // Fallback for steps without start time

    const duration = step.durationMs || 0;
    const endTime = startTime + duration;

    // Calculate position as percentage
    const totalDuration = runDurationMs || 1;
    const left = (startTime / totalDuration) * 100;
    const width = Math.max((duration / totalDuration) * 100, 1); // Minimum 1% width

    const aiLog = aiLogsByStep.get(step.stepId);
    const stepErrors = errorsByStep.get(step.stepId) || [];
    const stepTransitions = transitionsByStep.get(step.stepId) || [];

    const stepType = step.stepType || 'action';
    const isAI = getStepTypeCategory(stepType) === 'ai';
    const isDecisionStep = !!step.decision || getStepTypeCategory(stepType) === 'decision';
    const isCheckpointStep = getStepTypeCategory(stepType) === 'checkpoint';

    return {
      id: step.id,
      stepId: step.stepId,
      stepName: step.stepName || step.stepId,
      stepType,
      status: step.status,

      startTime,
      endTime,
      durationMs: duration,

      left: Math.max(0, Math.min(left, 100)),
      width: Math.max(0.5, Math.min(width, 100 - left)),
      lane: lanes.get(step.stepId) || 0,

      isAI,
      isDecision: isDecisionStep,
      isCheckpoint: isCheckpointStep,
      hasError: stepErrors.length > 0,
      hasFallback: step.fallbackTriggered,
      isBottleneck: isBottleneck(duration, avgDuration),

      aiLog,
      errors: stepErrors,
      transitions: stepTransitions,

      step,
    };
  });
}

/**
 * Calculate lanes for parallel execution visualization
 */
function calculateLanes(
  steps: JourneyRunStep[],
  transitions: JourneyRunTransition[]
): Map<string, number> {
  const lanes = new Map<string, number>();

  // Build graph of transitions
  const outgoing = new Map<string, string[]>();
  transitions.forEach(t => {
    const existing = outgoing.get(t.fromStepId) || [];
    existing.push(t.toStepId);
    outgoing.set(t.fromStepId, existing);
  });

  // Find parallel branches (steps with same parent having multiple children)
  let currentLane = 0;
  const visited = new Set<string>();

  function assignLane(stepId: string, lane: number) {
    if (visited.has(stepId)) return;
    visited.add(stepId);
    lanes.set(stepId, lane);

    const children = outgoing.get(stepId) || [];
    if (children.length > 1) {
      // Parallel branches - assign different lanes
      children.forEach((childId, idx) => {
        assignLane(childId, lane + idx);
      });
    } else if (children.length === 1) {
      // Sequential - same lane
      assignLane(children[0], lane);
    }
  }

  // Start from first step
  if (steps.length > 0) {
    assignLane(steps[0].stepId, 0);
  }

  // Assign remaining unvisited steps
  steps.forEach(step => {
    if (!visited.has(step.stepId)) {
      lanes.set(step.stepId, currentLane++);
    }
  });

  return lanes;
}

// =============================================================================
// FILTERING
// =============================================================================

/**
 * Filter timeline items based on filters
 */
export function filterTimelineItems(
  items: TimelineItem[],
  filters: TimelineFilters
): TimelineItem[] {
  return items.filter(item => {
    // Step type filter
    if (filters.stepType !== 'all') {
      const category = getStepTypeCategory(item.stepType);
      if (category !== filters.stepType) return false;
    }

    // Status filter
    if (filters.stepStatus !== 'all') {
      const statusFilter = mapStepStatusToFilter(item.status);
      if (statusFilter !== filters.stepStatus) return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = item.stepName.toLowerCase().includes(query);
      const matchesType = item.stepType.toLowerCase().includes(query);
      const matchesId = item.stepId.toLowerCase().includes(query);
      if (!matchesName && !matchesType && !matchesId) return false;
    }

    // Time range
    if (filters.timeRange.start && item.startTime < filters.timeRange.start.getTime()) {
      return false;
    }
    if (filters.timeRange.end && item.endTime > filters.timeRange.end.getTime()) {
      return false;
    }

    // Quick filters
    if (filters.showOnlyBottlenecks && !item.isBottleneck) return false;
    if (filters.showOnlyAI && !item.isAI) return false;
    if (filters.showOnlyErrors && !item.hasError) return false;

    return true;
  });
}

// =============================================================================
// PERFORMANCE METRICS
// =============================================================================

/**
 * Calculate performance metrics from timeline items
 */
export function calculatePerformanceMetrics(
  items: TimelineItem[],
  aiLogs: JourneyRunAILog[]
): TimelinePerformanceMetrics {
  if (items.length === 0) {
    return {
      totalDurationMs: 0,
      totalTokens: 0,
      totalCostMicros: 0,
      avgStepDurationMs: 0,
      medianStepDurationMs: 0,
      p95StepDurationMs: 0,
      bottlenecks: [],
      byStepType: {},
      tokensByModel: {},
      costByModel: {},
      steps: [],
    };
  }

  // Calculate total duration
  const maxEndTime = Math.max(...items.map(i => i.endTime));
  const minStartTime = Math.min(...items.map(i => i.startTime));
  const totalDurationMs = maxEndTime - minStartTime;

  // Calculate token and cost totals from AI logs
  let totalTokens = 0;
  let totalCostMicros = 0;
  const tokensByModel: Record<string, number> = {};
  const costByModel: Record<string, number> = {};

  aiLogs.forEach(log => {
    totalTokens += log.totalTokens || 0;
    totalCostMicros += log.costMicros || 0;

    if (log.modelId) {
      tokensByModel[log.modelId] = (tokensByModel[log.modelId] || 0) + (log.totalTokens || 0);
      costByModel[log.modelId] = (costByModel[log.modelId] || 0) + (log.costMicros || 0);
    }
  });

  // Calculate step durations
  const durations = items.map(i => i.durationMs).filter(d => d > 0).sort((a, b) => a - b);
  const avgStepDurationMs = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  const medianStepDurationMs = durations.length > 0
    ? durations[Math.floor(durations.length / 2)]
    : 0;
  const p95StepDurationMs = durations.length > 0
    ? durations[Math.floor(durations.length * 0.95)]
    : 0;

  // Calculate by step type
  const byStepType: Record<string, {
    count: number;
    totalDurationMs: number;
    avgDurationMs: number;
    totalTokens: number;
    totalCostMicros: number;
  }> = {};

  items.forEach(item => {
    const type = item.stepType || 'unknown';
    if (!byStepType[type]) {
      byStepType[type] = {
        count: 0,
        totalDurationMs: 0,
        avgDurationMs: 0,
        totalTokens: 0,
        totalCostMicros: 0,
      };
    }
    byStepType[type].count++;
    byStepType[type].totalDurationMs += item.durationMs;

    if (item.aiLog) {
      byStepType[type].totalTokens += item.aiLog.totalTokens || 0;
      byStepType[type].totalCostMicros += item.aiLog.costMicros || 0;
    }
  });

  // Calculate averages
  Object.values(byStepType).forEach(stats => {
    stats.avgDurationMs = stats.count > 0 ? stats.totalDurationMs / stats.count : 0;
  });

  // Create step metrics
  const steps: StepPerformanceMetrics[] = items.map(item => ({
    stepId: item.stepId,
    stepName: item.stepName,
    stepType: item.stepType,
    durationMs: item.durationMs,
    percentOfTotal: totalDurationMs > 0 ? (item.durationMs / totalDurationMs) * 100 : 0,
    tokensUsed: item.aiLog?.totalTokens || 0,
    costMicros: item.aiLog?.costMicros || 0,
    isBottleneck: item.isBottleneck,
    bottleneckReason: item.isBottleneck
      ? `Duration ${item.durationMs}ms is ${(item.durationMs / avgStepDurationMs).toFixed(1)}x average`
      : undefined,
  }));

  // Find bottlenecks
  const bottlenecks = steps.filter(s => s.isBottleneck).sort((a, b) => b.durationMs - a.durationMs);

  return {
    totalDurationMs,
    totalTokens,
    totalCostMicros,
    avgStepDurationMs,
    medianStepDurationMs,
    p95StepDurationMs,
    bottlenecks,
    byStepType,
    tokensByModel,
    costByModel,
    steps,
  };
}

// =============================================================================
// CONTEXT DIFF
// =============================================================================

/**
 * Calculate context diff between two snapshots
 */
export function calculateContextDiff(
  before: JourneyRunContextSnapshot | undefined,
  after: JourneyRunContextSnapshot | undefined
): StepContextDiff {
  const stepId = after?.stepId || before?.stepId || '';
  const changes: ContextDiffEntry[] = [];
  const addedKeys: string[] = [];
  const removedKeys: string[] = [];
  const changedKeys: string[] = [];

  if (!before && !after) {
    return { stepId, changes, addedKeys, removedKeys, changedKeys, totalChanges: 0 };
  }

  const beforeContext = before?.contextJson || {};
  const afterContext = after?.contextJson || {};

  // Find added and changed keys
  function traverse(obj: Record<string, unknown>, path: string = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const beforeValue = getNestedValue(beforeContext, fullPath);
      const afterValue = getNestedValue(afterContext, fullPath);

      if (beforeValue === undefined && afterValue !== undefined) {
        addedKeys.push(fullPath);
        changes.push({ path: fullPath, operation: 'added', newValue: afterValue });
      } else if (beforeValue !== undefined && afterValue === undefined) {
        removedKeys.push(fullPath);
        changes.push({ path: fullPath, operation: 'removed', oldValue: beforeValue });
      } else if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changedKeys.push(fullPath);
        changes.push({ path: fullPath, operation: 'changed', oldValue: beforeValue, newValue: afterValue });
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        traverse(value as Record<string, unknown>, fullPath);
      }
    });
  }

  traverse(afterContext);

  // Check for removed keys not in after
  function findRemoved(obj: Record<string, unknown>, path: string = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const afterValue = getNestedValue(afterContext, fullPath);

      if (afterValue === undefined && !removedKeys.includes(fullPath)) {
        removedKeys.push(fullPath);
        changes.push({ path: fullPath, operation: 'removed', oldValue: value });
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        findRemoved(value as Record<string, unknown>, fullPath);
      }
    });
  }

  findRemoved(beforeContext);

  return {
    stepId,
    changes,
    addedKeys,
    removedKeys,
    changedKeys,
    totalChanges: changes.length,
  };
}

/**
 * Get nested value from object by path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// =============================================================================
// TIME SCALE CALCULATIONS
// =============================================================================

/**
 * Calculate time markers for the timeline
 */
export function calculateTimeMarkers(
  durationMs: number,
  scale: TimeScale,
  viewportStart: number,
  viewportEnd: number
): { time: number; label: string; position: number }[] {
  const actualScale = scale === 'auto' ? calculateAutoTimeScale(durationMs) : scale;
  const interval = TIME_SCALE_MS[actualScale];

  if (interval === 0) return [];

  const markers: { time: number; label: string; position: number }[] = [];
  const viewportDuration = viewportEnd - viewportStart;

  let currentTime = Math.floor(viewportStart / interval) * interval;
  while (currentTime <= viewportEnd) {
    if (currentTime >= viewportStart) {
      const position = ((currentTime - viewportStart) / viewportDuration) * 100;
      markers.push({
        time: currentTime,
        label: formatTimeMarker(currentTime),
        position,
      });
    }
    currentTime += interval;
  }

  return markers;
}

/**
 * Format time for marker display
 */
function formatTimeMarker(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes < 60) return seconds > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
}

// =============================================================================
// EXPORT HELPERS
// =============================================================================

/**
 * Export timeline data to JSON
 */
export function exportToJSON(
  items: TimelineItem[],
  metrics: TimelinePerformanceMetrics,
  options: { includeAILogs: boolean; includeErrors: boolean }
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    metrics: {
      totalDuration: metrics.totalDurationMs,
      totalSteps: items.length,
      totalTokens: metrics.totalTokens,
      totalCost: metrics.totalCostMicros / 1_000_000,
      bottlenecks: metrics.bottlenecks.length,
    },
    steps: items.map(item => ({
      stepId: item.stepId,
      stepName: item.stepName,
      stepType: item.stepType,
      status: item.status,
      durationMs: item.durationMs,
      startTime: item.startTime,
      endTime: item.endTime,
      isBottleneck: item.isBottleneck,
      ...(options.includeAILogs && item.aiLog ? {
        aiLog: {
          modelId: item.aiLog.modelId,
          tokens: item.aiLog.totalTokens,
          cost: (item.aiLog.costMicros || 0) / 1_000_000,
          latencyMs: item.aiLog.latencyMs,
        },
      } : {}),
      ...(options.includeErrors && item.errors.length > 0 ? {
        errors: item.errors.map(e => ({
          code: e.errorCode,
          message: e.message,
          recovered: e.recovered,
        })),
      } : {}),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export timeline data to CSV
 */
export function exportToCSV(items: TimelineItem[]): string {
  const headers = [
    'Step ID',
    'Step Name',
    'Step Type',
    'Status',
    'Duration (ms)',
    'Start Time (ms)',
    'End Time (ms)',
    'Is Bottleneck',
    'Has Error',
    'Tokens Used',
    'Cost ($)',
  ];

  const rows = items.map(item => [
    item.stepId,
    `"${item.stepName.replace(/"/g, '""')}"`,
    item.stepType,
    item.status,
    item.durationMs,
    item.startTime,
    item.endTime,
    item.isBottleneck,
    item.hasError,
    item.aiLog?.totalTokens || 0,
    ((item.aiLog?.costMicros || 0) / 1_000_000).toFixed(6),
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
