/**
 * Replay Engine Tests
 * Sprint S52: Replay Engine
 *
 * Comprehensive tests for deterministic journey replay.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildReplayTimeline,
  buildReplaySummary,
  runReplay,
  ReplayRunner,
  createReplayRunner,
  computeContextDiff,
  applyContextDiff,
  createContextSnapshotManager,
  getSpeedMultiplier,
  calculateSimulatedDelay,
  formatReplayTime,
  getEventIcon,
  getEventCategory,
  type ReplayConfig,
  type ReplayTimeline,
  type ReplayEvent,
  type ReplayStep,
  type ReplaySummary,
} from '../../lib/journey-replay';
import type { JourneyRunDetails, JourneyRunStep, JourneyRunAILog } from '../../lib/journey-runs/types';

// =============================================================================
// TEST DATA
// =============================================================================

function createMockRunDetails(overrides?: Partial<JourneyRunDetails>): JourneyRunDetails {
  const now = new Date();
  const startTime = new Date(now.getTime() - 30000);

  return {
    run: {
      id: 'run-123',
      journeyId: 'journey-456',
      tenantId: 'tenant-789',
      status: 'success',
      startedAt: startTime,
      endedAt: now,
      triggeredBy: 'user',
      totalSteps: 3,
      completedSteps: 2,
      failedSteps: 0,
      skippedSteps: 1,
      totalDurationMs: 30000,
      totalCostMicros: 1500,
      totalTokens: 500,
      inputData: { companyId: 'test-company' },
      outputData: { result: 'success' },
      metadata: {},
      tags: ['test'],
      createdAt: startTime,
      updatedAt: now,
    },
    steps: [
      {
        id: 'step-1',
        runId: 'run-123',
        stepId: 'enrich',
        stepName: 'Enrich Company',
        stepType: 'enrichment',
        status: 'completed',
        queuedAt: new Date(startTime.getTime()),
        startedAt: new Date(startTime.getTime() + 100),
        completedAt: new Date(startTime.getTime() + 5000),
        durationMs: 4900,
        inputData: { companyId: 'test-company' },
        outputData: { industry: 'Tech' },
        executionOrder: 0,
        retryCount: 0,
        maxRetries: 3,
        fallbackTriggered: false,
        metadata: {},
        createdAt: startTime,
      },
      {
        id: 'step-2',
        runId: 'run-123',
        stepId: 'ai-qualify',
        stepName: 'AI Qualification',
        stepType: 'ai',
        status: 'completed',
        queuedAt: new Date(startTime.getTime() + 5100),
        startedAt: new Date(startTime.getTime() + 5200),
        completedAt: new Date(startTime.getTime() + 15000),
        durationMs: 9800,
        inputData: { industry: 'Tech' },
        outputData: { qualified: true, score: 85 },
        decision: { outcome: 'qualified' },
        decisionReason: 'High score',
        executionOrder: 1,
        retryCount: 0,
        maxRetries: 3,
        fallbackTriggered: false,
        metadata: {},
        createdAt: new Date(startTime.getTime() + 5100),
      },
      {
        id: 'step-3',
        runId: 'run-123',
        stepId: 'notify',
        stepName: 'Send Notification',
        stepType: 'action',
        status: 'skipped',
        queuedAt: new Date(startTime.getTime() + 15100),
        startedAt: new Date(startTime.getTime() + 15200),
        completedAt: new Date(startTime.getTime() + 15500),
        durationMs: 300,
        inputData: {},
        outputData: {},
        decisionReason: 'Condition not met',
        executionOrder: 2,
        retryCount: 0,
        maxRetries: 3,
        fallbackTriggered: false,
        metadata: {},
        createdAt: new Date(startTime.getTime() + 15100),
      },
    ],
    aiLogs: [
      {
        id: 'ai-log-1',
        runId: 'run-123',
        stepId: 'ai-qualify',
        systemPrompt: 'You are a qualification assistant.',
        userPrompt: 'Qualify this lead.',
        response: 'Qualified with score 85.',
        responseParsed: { qualified: true, score: 85 },
        modelId: 'claude-3-sonnet',
        inputTokens: 150,
        outputTokens: 100,
        totalTokens: 250,
        costMicros: 750,
        latencyMs: 2000,
        selectedOutcome: 'qualified',
        confidence: 0.85,
        reasoning: 'High score indicates good fit',
        checkpointRequired: false,
        createdAt: new Date(startTime.getTime() + 7000),
      },
    ],
    contextSnapshots: [
      {
        id: 'ctx-1',
        runId: 'run-123',
        stepId: 'enrich',
        snapshotType: 'step',
        contextJson: { company: { id: 'test-company' } },
        estimatedTokens: 50,
        createdAt: new Date(startTime.getTime() + 1000),
      },
      {
        id: 'ctx-2',
        runId: 'run-123',
        stepId: 'ai-qualify',
        snapshotType: 'step',
        contextJson: { company: { id: 'test-company', industry: 'Tech' } },
        changesFromPrevious: { industry: 'Tech' },
        estimatedTokens: 80,
        createdAt: new Date(startTime.getTime() + 6000),
      },
    ],
    errors: [],
    checkpoints: [],
    transitions: [
      {
        id: 'trans-1',
        runId: 'run-123',
        transitionId: 't1',
        fromStepId: 'enrich',
        toStepId: 'ai-qualify',
        conditionMet: true,
        taken: true,
        evaluatedAt: new Date(startTime.getTime() + 5000),
      },
      {
        id: 'trans-2',
        runId: 'run-123',
        transitionId: 't2',
        fromStepId: 'ai-qualify',
        toStepId: 'notify',
        conditionEvaluated: { qualified: true },
        conditionMet: false,
        evaluationReason: 'Notification disabled',
        taken: false,
        evaluatedAt: new Date(startTime.getTime() + 15000),
      },
    ],
    osCalls: [
      {
        id: 'os-call-1',
        runId: 'run-123',
        stepId: 'enrich',
        endpoint: '/api/os/enrich',
        method: 'POST',
        requestBody: { companyId: 'test-company' },
        responseBody: { industry: 'Tech' },
        responseStatus: 200,
        latencyMs: 500,
        osCapability: 'enrichment',
        createdAt: new Date(startTime.getTime() + 2000),
      },
    ],
    ...overrides,
  };
}

// =============================================================================
// TIMELINE BUILDER TESTS
// =============================================================================

describe('Replay Timeline Builder', () => {
  describe('buildReplayTimeline', () => {
    it('should build timeline from run details', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      expect(timeline).toBeDefined();
      expect(timeline.runId).toBe('run-123');
      expect(timeline.journeyId).toBe('journey-456');
      expect(timeline.steps.length).toBe(3);
      expect(timeline.events.length).toBeGreaterThan(0);
    });

    it('should order steps by execution order', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      expect(timeline.steps[0].stepId).toBe('enrich');
      expect(timeline.steps[1].stepId).toBe('ai-qualify');
      expect(timeline.steps[2].stepId).toBe('notify');
    });

    it('should calculate correct metrics', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      expect(timeline.metrics.totalSteps).toBe(3);
      expect(timeline.metrics.completedSteps).toBe(2);
      expect(timeline.metrics.skippedSteps).toBe(1);
      expect(timeline.metrics.totalTokens).toBe(250);
    });

    it('should generate journey start and complete events', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      const startEvent = timeline.events.find(e => e.type === 'journey:start');
      const completeEvent = timeline.events.find(e => e.type === 'journey:complete');

      expect(startEvent).toBeDefined();
      expect(completeEvent).toBeDefined();
      expect(startEvent?.timestamp).toBe(0);
    });

    it('should generate step events', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      const stepStartEvents = timeline.events.filter(e => e.type === 'step:start');
      const stepCompleteEvents = timeline.events.filter(e => e.type === 'step:complete');
      const stepSkipEvents = timeline.events.filter(e => e.type === 'step:skip');

      expect(stepStartEvents.length).toBe(3);
      expect(stepCompleteEvents.length).toBe(2);
      expect(stepSkipEvents.length).toBe(1);
    });

    it('should generate AI events', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      const aiPromptEvents = timeline.events.filter(e => e.type === 'ai:prompt');
      const aiResponseEvents = timeline.events.filter(e => e.type === 'ai:response');
      const aiDecisionEvents = timeline.events.filter(e => e.type === 'ai:decision');

      expect(aiPromptEvents.length).toBe(1);
      expect(aiResponseEvents.length).toBe(1);
      expect(aiDecisionEvents.length).toBe(1);
    });

    it('should generate transition events', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      const transitionEvents = timeline.events.filter(e => e.type === 'transition:evaluate');

      expect(transitionEvents.length).toBe(2);
    });

    it('should build branches from transitions', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      expect(timeline.branches.length).toBe(2);
      expect(timeline.branches.some(b => b.taken)).toBe(true);
      expect(timeline.branches.some(b => !b.taken)).toBe(true);
    });

    it('should sort events by timestamp', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);

      for (let i = 1; i < timeline.events.length; i++) {
        expect(timeline.events[i].timestamp).toBeGreaterThanOrEqual(
          timeline.events[i - 1].timestamp
        );
      }
    });
  });

  describe('buildReplaySummary', () => {
    it('should build summary from details and timeline', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);
      const summary = buildReplaySummary(details, timeline);

      expect(summary.runId).toBe('run-123');
      expect(summary.status).toBe('success');
      expect(summary.totalSteps).toBe(3);
      expect(summary.completedSteps).toBe(2);
      expect(summary.skippedSteps).toBe(1);
    });

    it('should calculate AI metrics', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);
      const summary = buildReplaySummary(details, timeline);

      expect(summary.aiCalls).toBe(1);
      expect(summary.totalTokens).toBe(250);
      expect(summary.totalCostMicros).toBe(750);
      expect(summary.modelsUsed).toContain('claude-3-sonnet');
    });

    it('should count decision points', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);
      const summary = buildReplaySummary(details, timeline);

      expect(summary.decisionPoints).toBe(1);
    });

    it('should count branches taken', () => {
      const details = createMockRunDetails();
      const timeline = buildReplayTimeline(details);
      const summary = buildReplaySummary(details, timeline);

      expect(summary.branchesTaken).toBe(1);
    });
  });
});

// =============================================================================
// REPLAY RUNNER TESTS
// =============================================================================

// Note: ReplayRunner tests require browser APIs (requestAnimationFrame)
// These tests are skipped in Node.js environment and should be run in
// browser-based test environments (e.g., Playwright, Cypress)

describe.skip('ReplayRunner (requires browser environment)', () => {
  let runner: ReplayRunner;

  beforeEach(() => {
    runner = createReplayRunner('run-123');
  });

  afterEach(() => {
    runner.dispose();
  });

  describe('load', () => {
    it('should load run details and build timeline', async () => {
      const details = createMockRunDetails();
      await runner.load(details);

      const state = runner.getState();
      expect(state.status).toBe('ready');
      expect(state.totalSteps).toBe(3);
      expect(runner.getTimeline()).toBeDefined();
    });

    it('should set status to error on failure', async () => {
      const invalidDetails = { run: null } as any;

      await expect(runner.load(invalidDetails)).rejects.toThrow();
      expect(runner.getState().status).toBe('error');
    });
  });

  describe('playback controls', () => {
    beforeEach(async () => {
      const details = createMockRunDetails();
      await runner.load(details);
    });

    it('should start playing', () => {
      runner.play();
      expect(runner.isPlaying()).toBe(true);
    });

    it('should pause', () => {
      runner.play();
      runner.pause();
      expect(runner.isPausedState()).toBe(true);
    });

    it('should toggle play/pause', () => {
      runner.togglePlayPause();
      expect(runner.isPlaying()).toBe(true);

      runner.togglePlayPause();
      expect(runner.isPausedState()).toBe(true);
    });

    it('should step forward', () => {
      const initialState = runner.getState();
      runner.stepForward();
      const newState = runner.getState();

      expect(newState.currentEventIndex).toBeGreaterThan(initialState.currentEventIndex);
    });

    it('should step backward', () => {
      runner.stepForward();
      runner.stepForward();
      const midState = runner.getState();

      runner.stepBackward();
      const newState = runner.getState();

      expect(newState.currentEventIndex).toBeLessThan(midState.currentEventIndex);
    });

    it('should reset', () => {
      runner.stepForward();
      runner.stepForward();
      runner.reset();

      const state = runner.getState();
      expect(state.currentEventIndex).toBe(0);
      expect(state.currentTimeMs).toBe(0);
      expect(state.progress).toBe(0);
    });

    it('should jump to step', () => {
      runner.jumpToStep(1);

      const state = runner.getState();
      expect(state.currentStepIndex).toBe(1);
    });

    it('should set speed', () => {
      runner.setSpeed('2x');

      const state = runner.getState();
      expect(state.config.speed).toBe('2x');
    });
  });

  describe('callbacks', () => {
    it('should call onStart when playing', async () => {
      const onStart = vi.fn();
      runner = createReplayRunner('run-123', { onStart });

      const details = createMockRunDetails();
      await runner.load(details);
      runner.play();

      expect(onStart).toHaveBeenCalled();
    });

    it('should call onPause when pausing', async () => {
      const onPause = vi.fn();
      runner = createReplayRunner('run-123', { onPause });

      const details = createMockRunDetails();
      await runner.load(details);
      runner.play();
      runner.pause();

      expect(onPause).toHaveBeenCalled();
    });

    it('should call onEvent for each processed event', async () => {
      const onEvent = vi.fn();
      runner = createReplayRunner('run-123', { onEvent });

      const details = createMockRunDetails();
      await runner.load(details);
      runner.stepForward();

      expect(onEvent).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// CONTEXT DIFF TESTS
// =============================================================================

describe('Context Diff', () => {
  describe('computeContextDiff', () => {
    it('should detect added keys', () => {
      const before = { a: 1 };
      const after = { a: 1, b: 2 };

      const diff = computeContextDiff(before, after);

      expect(diff).toContainEqual({
        path: 'b',
        operation: 'added',
        newValue: 2,
      });
    });

    it('should detect removed keys', () => {
      const before = { a: 1, b: 2 };
      const after = { a: 1 };

      const diff = computeContextDiff(before, after);

      expect(diff).toContainEqual({
        path: 'b',
        operation: 'removed',
        oldValue: 2,
      });
    });

    it('should detect changed values', () => {
      const before = { a: 1 };
      const after = { a: 2 };

      const diff = computeContextDiff(before, after);

      expect(diff).toContainEqual({
        path: 'a',
        operation: 'changed',
        oldValue: 1,
        newValue: 2,
      });
    });

    it('should handle nested objects', () => {
      const before = { obj: { a: 1 } };
      const after = { obj: { a: 2 } };

      const diff = computeContextDiff(before, after);

      expect(diff).toContainEqual({
        path: 'obj.a',
        operation: 'changed',
        oldValue: 1,
        newValue: 2,
      });
    });

    it('should return empty array for identical objects', () => {
      const before = { a: 1, b: { c: 2 } };
      const after = { a: 1, b: { c: 2 } };

      const diff = computeContextDiff(before, after);

      expect(diff).toHaveLength(0);
    });
  });

  describe('applyContextDiff', () => {
    it('should apply added changes', () => {
      const context = { a: 1 };
      const diff = [{ path: 'b', operation: 'added' as const, newValue: 2 }];

      const result = applyContextDiff(context, diff);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should apply removed changes', () => {
      const context = { a: 1, b: 2 };
      const diff = [{ path: 'b', operation: 'removed' as const, oldValue: 2 }];

      const result = applyContextDiff(context, diff);

      expect(result).toEqual({ a: 1 });
    });

    it('should apply changed values', () => {
      const context = { a: 1 };
      const diff = [{ path: 'a', operation: 'changed' as const, oldValue: 1, newValue: 2 }];

      const result = applyContextDiff(context, diff);

      expect(result).toEqual({ a: 2 });
    });

    it('should not mutate original context', () => {
      const context = { a: 1 };
      const diff = [{ path: 'b', operation: 'added' as const, newValue: 2 }];

      applyContextDiff(context, diff);

      expect(context).toEqual({ a: 1 });
    });
  });

  describe('createContextSnapshotManager', () => {
    it('should get snapshot at step', () => {
      const details = createMockRunDetails();
      const manager = createContextSnapshotManager(details);

      const snapshot = manager.getSnapshotAtStep('enrich');

      expect(snapshot).toEqual({ company: { id: 'test-company' } });
    });

    it('should get snapshot before step', () => {
      const details = createMockRunDetails();
      const manager = createContextSnapshotManager(details);

      const snapshot = manager.getSnapshotBefore('ai-qualify');

      expect(snapshot).toEqual({ company: { id: 'test-company' } });
    });

    it('should calculate diff for step', () => {
      const details = createMockRunDetails();
      const manager = createContextSnapshotManager(details);

      const diff = manager.getDiffForStep('ai-qualify');

      expect(diff).toBeDefined();
      expect(diff?.totalChanges).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// SPEED AND TIMING TESTS
// =============================================================================

describe('Speed and Timing', () => {
  describe('getSpeedMultiplier', () => {
    it('should return correct multipliers', () => {
      expect(getSpeedMultiplier('0.25x')).toBe(0.25);
      expect(getSpeedMultiplier('0.5x')).toBe(0.5);
      expect(getSpeedMultiplier('1x')).toBe(1);
      expect(getSpeedMultiplier('2x')).toBe(2);
      expect(getSpeedMultiplier('4x')).toBe(4);
      expect(getSpeedMultiplier('instant')).toBe(Infinity);
    });
  });

  describe('calculateSimulatedDelay', () => {
    it('should calculate correct delays', () => {
      expect(calculateSimulatedDelay(1000, '1x')).toBe(1000);
      expect(calculateSimulatedDelay(1000, '2x')).toBe(500);
      expect(calculateSimulatedDelay(1000, '0.5x')).toBe(2000);
      expect(calculateSimulatedDelay(1000, 'instant')).toBe(0);
    });
  });

  describe('formatReplayTime', () => {
    it('should format milliseconds', () => {
      expect(formatReplayTime(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatReplayTime(5000)).toBe('5.0s');
    });

    it('should format minutes:seconds', () => {
      expect(formatReplayTime(90000)).toBe('1:30');
    });
  });
});

// =============================================================================
// EVENT HELPERS TESTS
// =============================================================================

describe('Event Helpers', () => {
  describe('getEventIcon', () => {
    it('should return icons for event types', () => {
      expect(getEventIcon('journey:start')).toBe('🚀');
      expect(getEventIcon('step:complete')).toBe('✓');
      expect(getEventIcon('ai:decision')).toBe('🎯');
      expect(getEventIcon('error:occur')).toBe('🔴');
    });
  });

  describe('getEventCategory', () => {
    it('should categorize events correctly', () => {
      expect(getEventCategory('journey:start')).toBe('journey');
      expect(getEventCategory('step:complete')).toBe('step');
      expect(getEventCategory('ai:decision')).toBe('ai');
      expect(getEventCategory('transition:take')).toBe('transition');
    });
  });
});

// =============================================================================
// DETERMINISM TESTS
// =============================================================================

describe('Determinism', () => {
  it('should produce identical output for same input', async () => {
    const details = createMockRunDetails();

    const result1 = await runReplay(details);
    const result2 = await runReplay(details);

    // Event IDs will differ, but structure should be same
    expect(result1.events.length).toBe(result2.events.length);
    expect(result1.timeline.steps.length).toBe(result2.timeline.steps.length);
    expect(result1.summary.totalSteps).toBe(result2.summary.totalSteps);
  });

  it('should produce same events in same order', async () => {
    const details = createMockRunDetails();

    const result1 = await runReplay(details);
    const result2 = await runReplay(details);

    const types1 = result1.events.map(e => e.type);
    const types2 = result2.events.map(e => e.type);

    expect(types1).toEqual(types2);
  });

  it('should never mutate input data', async () => {
    const details = createMockRunDetails();
    const originalJSON = JSON.stringify(details);

    await runReplay(details);

    expect(JSON.stringify(details)).toBe(originalJSON);
  });
});

// =============================================================================
// REPLAY CONFIG TESTS
// =============================================================================

describe('Replay Config', () => {
  it('should respect startFromStep', async () => {
    const details = createMockRunDetails();

    const result = await runReplay(details, { startFromStep: 'ai-qualify' });

    const firstStepEvent = result.events.find(e => e.type === 'step:start');
    expect(firstStepEvent?.stepId).toBe('ai-qualify');
  });

  it('should respect stopAtStep', async () => {
    const details = createMockRunDetails();

    const result = await runReplay(details, { stopAtStep: 'ai-qualify' });

    const stepCompleteEvents = result.events.filter(e => e.type === 'step:complete');
    const lastComplete = stepCompleteEvents[stepCompleteEvents.length - 1];
    expect(lastComplete?.stepId).toBe('ai-qualify');
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty steps', async () => {
    const details = createMockRunDetails({
      steps: [],
      aiLogs: [],
      contextSnapshots: [],
      transitions: [],
      osCalls: [],
      errors: [],
      checkpoints: [],
    });
    // Also reset run metrics to match
    details.run.totalSteps = 0;
    details.run.completedSteps = 0;
    details.run.failedSteps = 0;
    details.run.skippedSteps = 0;

    const result = await runReplay(details);

    expect(result.timeline.steps).toHaveLength(0);
    expect(result.summary.totalSteps).toBe(0);
  });

  it('should handle failed runs', async () => {
    const details = createMockRunDetails();
    details.run.status = 'failed';
    details.errors = [
      {
        id: 'error-1',
        runId: 'run-123',
        stepId: 'ai-qualify',
        errorCode: 'STEP_FAILED',
        message: 'AI call failed',
        retryable: false,
        recovered: false,
        createdAt: new Date(),
      },
    ];

    const result = await runReplay(details);

    expect(result.summary.status).toBe('failed');
    expect(result.summary.errorCount).toBe(1);
  });

  it('should handle runs with fallbacks', async () => {
    const details = createMockRunDetails();
    details.steps[1].fallbackTriggered = true;
    details.steps[1].fallbackStrategy = 'retry';

    const result = await runReplay(details);

    const fallbackEvents = result.events.filter(e => e.type === 'fallback:trigger');
    expect(fallbackEvents.length).toBeGreaterThan(0);
  });

  it('should handle runs with checkpoints', async () => {
    const details = createMockRunDetails();
    details.checkpoints = [
      {
        id: 'cp-1',
        runId: 'run-123',
        stepId: 'ai-qualify',
        status: 'approved',
        checkpointType: 'human-review',
        description: 'Review required',
        reviewedBy: 'user-123',
        reviewedAt: new Date(),
        createdAt: new Date(),
      },
    ];

    const result = await runReplay(details);

    expect(result.summary.checkpointsRequired).toBe(1);
    expect(result.summary.checkpointsApproved).toBe(1);
  });
});

// =============================================================================
// REPLAY STEP TESTS
// =============================================================================

describe('ReplayStep', () => {
  it('should contain all required properties', async () => {
    const details = createMockRunDetails();
    const result = await runReplay(details);

    const step = result.timeline.steps[0];

    expect(step.id).toBeDefined();
    expect(step.stepId).toBeDefined();
    expect(step.stepName).toBeDefined();
    expect(step.stepType).toBeDefined();
    expect(step.status).toBeDefined();
    expect(step.startTime).toBeDefined();
    expect(step.endTime).toBeDefined();
    expect(step.durationMs).toBeDefined();
    expect(step.events).toBeInstanceOf(Array);
    expect(step.originalStep).toBeDefined();
  });

  it('should include AI log for AI steps', async () => {
    const details = createMockRunDetails();
    const result = await runReplay(details);

    const aiStep = result.timeline.steps.find(s => s.stepType === 'ai');

    expect(aiStep?.aiLog).toBeDefined();
    expect(aiStep?.tokens).toBeGreaterThan(0);
    expect(aiStep?.costMicros).toBeGreaterThan(0);
  });

  it('should include transitions', async () => {
    const details = createMockRunDetails();
    const result = await runReplay(details);

    const step = result.timeline.steps[0];

    expect(step.outgoingTransitions.length).toBeGreaterThan(0);
  });
});
