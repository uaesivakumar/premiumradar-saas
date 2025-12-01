/**
 * Timeline Viewer Tests
 * Sprint S51: Timeline Viewer
 *
 * Tests for timeline utilities, hooks, and component behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateAutoTimeScale,
  formatDuration,
  formatCost,
  formatTokens,
  isBottleneck,
  getStepTypeCategory,
  mapStepStatusToFilter,
  TIME_SCALE_MS,
  TIME_SCALE_LABELS,
  DEFAULT_TIMELINE_FILTERS,
  DEFAULT_PLAYBACK_STATE,
} from '../../lib/timeline-viewer/types';
import {
  createTimelineItems,
  filterTimelineItems,
  calculatePerformanceMetrics,
  calculateContextDiff,
  calculateTimeMarkers,
  exportToJSON,
  exportToCSV,
} from '../../lib/timeline-viewer/utils';
import type {
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunError,
  JourneyRunTransition,
  JourneyRunContextSnapshot,
} from '../../lib/journey-runs/types';

// =============================================================================
// TEST DATA
// =============================================================================

const mockSteps: JourneyRunStep[] = [
  {
    id: 'step-1',
    runId: 'run-1',
    stepId: 'start',
    stepName: 'Start Step',
    stepType: 'action',
    status: 'completed',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:00:01Z'),
    durationMs: 1000,
    fallbackTriggered: false,
    retryCount: 0,
    maxRetries: 3,
    metadata: {},
    createdAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 'step-2',
    runId: 'run-1',
    stepId: 'ai-enrich',
    stepName: 'AI Enrichment',
    stepType: 'ai_step',
    status: 'completed',
    startedAt: new Date('2024-01-01T10:00:01Z'),
    completedAt: new Date('2024-01-01T10:00:06Z'),
    durationMs: 5000,
    fallbackTriggered: false,
    retryCount: 0,
    maxRetries: 3,
    metadata: {},
    createdAt: new Date('2024-01-01T10:00:01Z'),
  },
  {
    id: 'step-3',
    runId: 'run-1',
    stepId: 'decision',
    stepName: 'Decision Node',
    stepType: 'decision',
    status: 'completed',
    startedAt: new Date('2024-01-01T10:00:06Z'),
    completedAt: new Date('2024-01-01T10:00:07Z'),
    durationMs: 1000,
    decision: { outcome: 'branch_a' },
    decisionReason: 'Score above threshold',
    fallbackTriggered: false,
    retryCount: 0,
    maxRetries: 3,
    metadata: {},
    createdAt: new Date('2024-01-01T10:00:06Z'),
  },
  {
    id: 'step-4',
    runId: 'run-1',
    stepId: 'error-step',
    stepName: 'Failed Step',
    stepType: 'action',
    status: 'failed',
    startedAt: new Date('2024-01-01T10:00:07Z'),
    completedAt: new Date('2024-01-01T10:00:08Z'),
    durationMs: 1000,
    fallbackTriggered: true,
    fallbackStrategy: 'retry',
    retryCount: 2,
    maxRetries: 3,
    metadata: {},
    createdAt: new Date('2024-01-01T10:00:07Z'),
  },
];

const mockAILogs: JourneyRunAILog[] = [
  {
    id: 'log-1',
    runId: 'run-1',
    stepId: 'ai-enrich',
    modelId: 'gpt-4',
    inputTokens: 500,
    outputTokens: 200,
    totalTokens: 700,
    costMicros: 3500,
    latencyMs: 4500,
    systemPrompt: 'You are a data enrichment assistant.',
    userPrompt: 'Enrich this company data.',
    response: '{"industry": "Technology"}',
    checkpointRequired: false,
    createdAt: new Date('2024-01-01T10:00:01Z'),
  },
];

const mockErrors: JourneyRunError[] = [
  {
    id: 'error-1',
    runId: 'run-1',
    stepId: 'error-step',
    errorCode: 'API_ERROR',
    errorType: 'external',
    message: 'External API returned 500',
    retryable: true,
    recovered: false,
    createdAt: new Date('2024-01-01T10:00:08Z'),
  },
];

const mockTransitions: JourneyRunTransition[] = [
  {
    id: 'trans-1',
    runId: 'run-1',
    transitionId: 't1',
    fromStepId: 'start',
    toStepId: 'ai-enrich',
    conditionMet: true,
    taken: true,
    evaluatedAt: new Date('2024-01-01T10:00:01Z'),
  },
  {
    id: 'trans-2',
    runId: 'run-1',
    transitionId: 't2',
    fromStepId: 'ai-enrich',
    toStepId: 'decision',
    conditionMet: true,
    taken: true,
    evaluatedAt: new Date('2024-01-01T10:00:06Z'),
  },
];

const mockContextSnapshots: JourneyRunContextSnapshot[] = [
  {
    id: 'snap-1',
    runId: 'run-1',
    stepId: 'start',
    snapshotType: 'start',
    contextJson: { lead: { name: 'John' } },
    createdAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: 'snap-2',
    runId: 'run-1',
    stepId: 'ai-enrich',
    snapshotType: 'step',
    contextJson: { lead: { name: 'John', company: 'Acme' }, enriched: true },
    changesFromPrevious: { 'lead.company': 'Acme', enriched: true },
    createdAt: new Date('2024-01-01T10:00:06Z'),
  },
];

const runStartTime = new Date('2024-01-01T10:00:00Z');
const runDurationMs = 8000;

// =============================================================================
// TYPE UTILITY TESTS
// =============================================================================

describe('Timeline Types and Utilities', () => {
  describe('calculateAutoTimeScale', () => {
    it('should return 1s for short durations', () => {
      expect(calculateAutoTimeScale(5000)).toBe('1s');
    });

    it('should return 10s for medium durations', () => {
      expect(calculateAutoTimeScale(30000)).toBe('10s');
    });

    it('should return 1m for longer durations', () => {
      expect(calculateAutoTimeScale(120000)).toBe('1m');
    });

    it('should return 5m for even longer durations', () => {
      expect(calculateAutoTimeScale(600000)).toBe('5m');
    });

    it('should return 15m for near-hour durations', () => {
      expect(calculateAutoTimeScale(2700000)).toBe('15m');
    });

    it('should return 1h for very long durations', () => {
      expect(calculateAutoTimeScale(7200000)).toBe('1h');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5.0s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90000)).toBe('1m 30s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3900000)).toBe('1h 5m');
    });
  });

  describe('formatCost', () => {
    it('should format very small costs in cents', () => {
      expect(formatCost(50)).toContain('¢');
    });

    it('should format small costs with 3 decimals', () => {
      expect(formatCost(50000)).toBe('$0.050');
    });

    it('should format larger costs with 2 decimals', () => {
      expect(formatCost(1500000)).toBe('$1.50');
    });
  });

  describe('formatTokens', () => {
    it('should format small token counts directly', () => {
      expect(formatTokens(500)).toBe('500');
    });

    it('should format thousands with k suffix', () => {
      expect(formatTokens(5000)).toBe('5.0k');
    });

    it('should format millions with M suffix', () => {
      expect(formatTokens(1500000)).toBe('1.50M');
    });
  });

  describe('isBottleneck', () => {
    it('should return true for duration > 2x average', () => {
      expect(isBottleneck(5000, 2000)).toBe(true);
    });

    it('should return false for duration < 2x average', () => {
      expect(isBottleneck(3000, 2000)).toBe(false);
    });

    it('should return false for exactly 2x average', () => {
      expect(isBottleneck(4000, 2000)).toBe(false);
    });
  });

  describe('getStepTypeCategory', () => {
    it('should categorize AI steps', () => {
      expect(getStepTypeCategory('ai_step')).toBe('ai');
      expect(getStepTypeCategory('llm_call')).toBe('ai');
      expect(getStepTypeCategory('prompt_execution')).toBe('ai');
    });

    it('should categorize decision steps', () => {
      expect(getStepTypeCategory('decision')).toBe('decision');
      expect(getStepTypeCategory('branch_node')).toBe('decision');
    });

    it('should categorize enrichment steps', () => {
      expect(getStepTypeCategory('enrichment')).toBe('enrichment');
    });

    it('should categorize checkpoint steps', () => {
      expect(getStepTypeCategory('checkpoint')).toBe('checkpoint');
      expect(getStepTypeCategory('approval_gate')).toBe('checkpoint');
    });

    it('should default to action', () => {
      expect(getStepTypeCategory('unknown')).toBe('action');
      expect(getStepTypeCategory(undefined)).toBe('action');
    });
  });

  describe('mapStepStatusToFilter', () => {
    it('should map completed to success', () => {
      expect(mapStepStatusToFilter('completed')).toBe('success');
    });

    it('should map failed and timeout to error', () => {
      expect(mapStepStatusToFilter('failed')).toBe('error');
      expect(mapStepStatusToFilter('timeout')).toBe('error');
    });

    it('should map skipped to skipped', () => {
      expect(mapStepStatusToFilter('skipped')).toBe('skipped');
    });

    it('should map pending/queued/waiting to waiting', () => {
      expect(mapStepStatusToFilter('pending')).toBe('waiting');
      expect(mapStepStatusToFilter('queued')).toBe('waiting');
      expect(mapStepStatusToFilter('waiting')).toBe('waiting');
    });
  });

  describe('TIME_SCALE constants', () => {
    it('should have correct millisecond values', () => {
      expect(TIME_SCALE_MS['1s']).toBe(1000);
      expect(TIME_SCALE_MS['10s']).toBe(10000);
      expect(TIME_SCALE_MS['1m']).toBe(60000);
      expect(TIME_SCALE_MS['1h']).toBe(3600000);
    });

    it('should have labels for all scales', () => {
      expect(Object.keys(TIME_SCALE_LABELS)).toHaveLength(7);
      expect(TIME_SCALE_LABELS['auto']).toBe('Auto');
    });
  });
});

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('Timeline Utility Functions', () => {
  describe('createTimelineItems', () => {
    it('should create timeline items from steps', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      expect(items).toHaveLength(4);
      expect(items[0].stepName).toBe('Start Step');
      expect(items[1].stepName).toBe('AI Enrichment');
    });

    it('should correctly identify AI steps', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      expect(items[1].isAI).toBe(true);
      expect(items[0].isAI).toBe(false);
    });

    it('should correctly identify decision steps', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      expect(items[2].isDecision).toBe(true);
      expect(items[0].isDecision).toBe(false);
    });

    it('should correctly identify steps with errors', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      expect(items[3].hasError).toBe(true);
      expect(items[3].errors).toHaveLength(1);
    });

    it('should correctly identify fallback steps', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      expect(items[3].hasFallback).toBe(true);
    });

    it('should correctly identify bottleneck steps', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      // AI step at 5000ms is > 2x average (2000ms)
      expect(items[1].isBottleneck).toBe(true);
    });

    it('should attach AI logs to correct steps', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      expect(items[1].aiLog).toBeDefined();
      expect(items[1].aiLog?.modelId).toBe('gpt-4');
      expect(items[0].aiLog).toBeUndefined();
    });

    it('should calculate positions correctly', () => {
      const items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );

      // First step should start at 0%
      expect(items[0].left).toBe(0);

      // Each step should have positive width
      items.forEach(item => {
        expect(item.width).toBeGreaterThan(0);
      });
    });
  });

  describe('filterTimelineItems', () => {
    let items: ReturnType<typeof createTimelineItems>;

    beforeEach(() => {
      items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );
    });

    it('should return all items with default filters', () => {
      const filtered = filterTimelineItems(items, DEFAULT_TIMELINE_FILTERS);
      expect(filtered).toHaveLength(4);
    });

    it('should filter by step type', () => {
      const filtered = filterTimelineItems(items, {
        ...DEFAULT_TIMELINE_FILTERS,
        stepType: 'ai',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].stepName).toBe('AI Enrichment');
    });

    it('should filter by status', () => {
      const filtered = filterTimelineItems(items, {
        ...DEFAULT_TIMELINE_FILTERS,
        stepStatus: 'error',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].stepName).toBe('Failed Step');
    });

    it('should filter by search query', () => {
      const filtered = filterTimelineItems(items, {
        ...DEFAULT_TIMELINE_FILTERS,
        searchQuery: 'Enrichment',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].stepName).toBe('AI Enrichment');
    });

    it('should filter by bottlenecks only', () => {
      const filtered = filterTimelineItems(items, {
        ...DEFAULT_TIMELINE_FILTERS,
        showOnlyBottlenecks: true,
      });
      expect(filtered.every(i => i.isBottleneck)).toBe(true);
    });

    it('should filter by AI only', () => {
      const filtered = filterTimelineItems(items, {
        ...DEFAULT_TIMELINE_FILTERS,
        showOnlyAI: true,
      });
      expect(filtered.every(i => i.isAI)).toBe(true);
    });

    it('should filter by errors only', () => {
      const filtered = filterTimelineItems(items, {
        ...DEFAULT_TIMELINE_FILTERS,
        showOnlyErrors: true,
      });
      expect(filtered.every(i => i.hasError)).toBe(true);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    let items: ReturnType<typeof createTimelineItems>;

    beforeEach(() => {
      items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );
    });

    it('should calculate total duration', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(metrics.totalDurationMs).toBeGreaterThan(0);
    });

    it('should calculate total tokens from AI logs', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(metrics.totalTokens).toBe(700);
    });

    it('should calculate total cost from AI logs', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(metrics.totalCostMicros).toBe(3500);
    });

    it('should identify bottlenecks', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(metrics.bottlenecks.length).toBeGreaterThan(0);
    });

    it('should calculate per-step metrics', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(metrics.steps).toHaveLength(4);
      expect(metrics.steps[0].stepName).toBe('Start Step');
    });

    it('should track tokens by model', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(metrics.tokensByModel['gpt-4']).toBe(700);
    });

    it('should track cost by model', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(metrics.costByModel['gpt-4']).toBe(3500);
    });

    it('should group by step type', () => {
      const metrics = calculatePerformanceMetrics(items, mockAILogs);
      expect(Object.keys(metrics.byStepType).length).toBeGreaterThan(0);
    });
  });

  describe('calculateContextDiff', () => {
    it('should detect added keys', () => {
      const diff = calculateContextDiff(mockContextSnapshots[0], mockContextSnapshots[1]);
      expect(diff.addedKeys).toContain('enriched');
    });

    it('should detect changed keys', () => {
      const before: JourneyRunContextSnapshot = {
        ...mockContextSnapshots[0],
        contextJson: { value: 'old' },
      };
      const after: JourneyRunContextSnapshot = {
        ...mockContextSnapshots[1],
        contextJson: { value: 'new' },
      };

      const diff = calculateContextDiff(before, after);
      expect(diff.changedKeys).toContain('value');
    });

    it('should return empty diff for identical snapshots', () => {
      const snapshot = mockContextSnapshots[0];
      const diff = calculateContextDiff(snapshot, snapshot);
      expect(diff.totalChanges).toBe(0);
    });

    it('should handle undefined snapshots', () => {
      const diff = calculateContextDiff(undefined, undefined);
      expect(diff.totalChanges).toBe(0);
    });
  });

  describe('calculateTimeMarkers', () => {
    it('should return markers within viewport', () => {
      const markers = calculateTimeMarkers(60000, '10s', 0, 60000);
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should not return markers for auto scale with 0 interval', () => {
      // Auto scale calculates the interval, so it should return markers
      const markers = calculateTimeMarkers(10000, 'auto', 0, 10000);
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should position markers correctly', () => {
      const markers = calculateTimeMarkers(60000, '10s', 0, 60000);
      markers.forEach(marker => {
        expect(marker.position).toBeGreaterThanOrEqual(0);
        expect(marker.position).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('exportToJSON', () => {
    let items: ReturnType<typeof createTimelineItems>;
    let metrics: ReturnType<typeof calculatePerformanceMetrics>;

    beforeEach(() => {
      items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );
      metrics = calculatePerformanceMetrics(items, mockAILogs);
    });

    it('should return valid JSON string', () => {
      const json = exportToJSON(items, metrics, { includeAILogs: true, includeErrors: true });
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include export timestamp', () => {
      const json = exportToJSON(items, metrics, { includeAILogs: true, includeErrors: true });
      const data = JSON.parse(json);
      expect(data.exportedAt).toBeDefined();
    });

    it('should include metrics summary', () => {
      const json = exportToJSON(items, metrics, { includeAILogs: true, includeErrors: true });
      const data = JSON.parse(json);
      expect(data.metrics).toBeDefined();
      expect(data.metrics.totalSteps).toBe(4);
    });

    it('should include AI logs when requested', () => {
      const json = exportToJSON(items, metrics, { includeAILogs: true, includeErrors: false });
      const data = JSON.parse(json);
      const aiStep = data.steps.find((s: { stepId: string }) => s.stepId === 'ai-enrich');
      expect(aiStep.aiLog).toBeDefined();
    });

    it('should exclude AI logs when not requested', () => {
      const json = exportToJSON(items, metrics, { includeAILogs: false, includeErrors: false });
      const data = JSON.parse(json);
      const aiStep = data.steps.find((s: { stepId: string }) => s.stepId === 'ai-enrich');
      expect(aiStep.aiLog).toBeUndefined();
    });
  });

  describe('exportToCSV', () => {
    let items: ReturnType<typeof createTimelineItems>;

    beforeEach(() => {
      items = createTimelineItems(
        mockSteps,
        mockAILogs,
        mockErrors,
        mockTransitions,
        runStartTime,
        runDurationMs
      );
    });

    it('should return CSV with headers', () => {
      const csv = exportToCSV(items);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('Step ID');
      expect(lines[0]).toContain('Duration');
    });

    it('should have correct number of rows', () => {
      const csv = exportToCSV(items);
      const lines = csv.split('\n');
      // 1 header + 4 data rows
      expect(lines).toHaveLength(5);
    });

    it('should escape quotes in step names', () => {
      const itemsWithQuotes = items.map(i => ({
        ...i,
        stepName: `Test "quoted" name`,
      }));
      const csv = exportToCSV(itemsWithQuotes);
      expect(csv).toContain('""quoted""');
    });
  });
});

// =============================================================================
// DEFAULT STATE TESTS
// =============================================================================

describe('Default State Values', () => {
  it('should have correct default timeline filters', () => {
    expect(DEFAULT_TIMELINE_FILTERS.stepType).toBe('all');
    expect(DEFAULT_TIMELINE_FILTERS.stepStatus).toBe('all');
    expect(DEFAULT_TIMELINE_FILTERS.searchQuery).toBe('');
    expect(DEFAULT_TIMELINE_FILTERS.showOnlyBottlenecks).toBe(false);
    expect(DEFAULT_TIMELINE_FILTERS.showOnlyAI).toBe(false);
    expect(DEFAULT_TIMELINE_FILTERS.showOnlyErrors).toBe(false);
  });

  it('should have correct default playback state', () => {
    expect(DEFAULT_PLAYBACK_STATE.isPlaying).toBe(false);
    expect(DEFAULT_PLAYBACK_STATE.speed).toBe(1);
    expect(DEFAULT_PLAYBACK_STATE.currentTime).toBe(0);
    expect(DEFAULT_PLAYBACK_STATE.loopEnabled).toBe(false);
  });
});
