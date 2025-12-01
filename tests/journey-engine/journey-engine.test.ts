/**
 * Sprint S48 Test Suite: Journey Engine
 *
 * Tests all 6 features of Sprint S48:
 * 1. Journey State Graph Definition
 * 2. Journey State Persistence
 * 3. Step Transitions Engine
 * 4. Transition Preconditions
 * 5. Journey Error Handling
 * 6. Journey Fallback Logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { JourneyDefinition, StepNode, Transition } from '../../lib/journey-builder/types';
import {
  // Types
  JourneyError,
  type ExecutionContext,
  type ExecutionData,
  type StateGraph,
  type StepResult,
  type Precondition,
  type FallbackConfig,
  // State Machine
  JourneyStateMachine,
  createJourneyEngine,
  // Persistence
  InMemoryPersistenceAdapter,
  PersistenceManager,
  createInMemoryPersistence,
  // Transitions
  evaluateCondition,
  selectTransitions,
  findPaths,
  isPathReachable,
  getReachableNodes,
  evaluateExpression,
  evaluateExpressions,
  // Preconditions
  checkPreconditions,
  allPreconditionsPass,
  fieldCheck,
  stepCompleted,
  timeWindow,
  rateLimit,
  featureFlag,
  // Error Handling
  classifyError,
  handleStepError,
  withTimeout,
  withRetry,
  getErrorStats,
  // Fallback
  executeFallback,
  executeFallbackChain,
  getDefaultFallbackChain,
  skipFallback,
  retryFallback,
} from '../../lib/journey-engine';

// =============================================================================
// TEST DATA
// =============================================================================

function createTestJourney(): JourneyDefinition {
  return {
    id: crypto.randomUUID(),
    name: 'Test Journey',
    version: 1,
    steps: [
      {
        id: 'step-1',
        type: 'discovery',
        label: 'Discovery',
        position: { x: 0, y: 0 },
        config: { signalTypes: ['funding'] },
        inputs: [],
        outputs: ['t-1'],
        isStart: true,
        isEnd: false,
      },
      {
        id: 'step-2',
        type: 'enrichment',
        label: 'Enrichment',
        position: { x: 200, y: 0 },
        config: { sources: ['apollo'] },
        inputs: ['t-1'],
        outputs: ['t-2'],
        isStart: false,
        isEnd: false,
      },
      {
        id: 'step-3',
        type: 'outreach',
        label: 'Outreach',
        position: { x: 400, y: 0 },
        config: { channel: 'email' },
        inputs: ['t-2'],
        outputs: [],
        isStart: false,
        isEnd: true,
      },
    ],
    transitions: [
      {
        id: 't-1',
        fromStepId: 'step-1',
        toStepId: 'step-2',
        style: 'solid',
        priority: 0,
      },
      {
        id: 't-2',
        fromStepId: 'step-2',
        toStepId: 'step-3',
        style: 'solid',
        priority: 0,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user',
  };
}

function createTestExecutionData(): ExecutionData {
  return {
    input: { lead: { id: '123', name: 'Test Lead', score: 85 } },
    stepOutputs: {
      'step-1': { found: 5, companies: [{ name: 'Company A' }] },
    },
    variables: { threshold: 70 },
  };
}

// =============================================================================
// FEATURE 1: Journey State Graph Definition
// =============================================================================

describe('Feature 1: Journey State Graph Definition', () => {
  it('should create a state machine from journey definition', () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey);

    expect(engine).toBeInstanceOf(JourneyStateMachine);
    expect(engine.getStatus()).toBe('idle');
  });

  it('should build state graph with nodes and edges', () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey);
    const graph = engine.getGraph();

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    expect(graph.startNodeId).toBeDefined();
    expect(graph.endNodeIds).toHaveLength(1);
  });

  it('should correctly identify start and end nodes', () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey);
    const graph = engine.getGraph();

    const startNode = graph.nodes.find(n => n.id === graph.startNodeId);
    expect(startNode).toBeDefined();
    expect(startNode?.stepId).toBe('step-1');

    const endNodeId = graph.endNodeIds[0];
    const endNode = graph.nodes.find(n => n.id === endNodeId);
    expect(endNode).toBeDefined();
    expect(endNode?.stepId).toBe('step-3');
  });

  it('should map edges correctly', () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey);
    const graph = engine.getGraph();

    // Each edge should reference valid nodes
    graph.edges.forEach(edge => {
      const fromNode = graph.nodes.find(n => n.id === edge.fromNodeId);
      const toNode = graph.nodes.find(n => n.id === edge.toNodeId);
      expect(fromNode).toBeDefined();
      expect(toNode).toBeDefined();
    });
  });

  it('should initialize all nodes as pending', () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey);
    const graph = engine.getGraph();

    graph.nodes.forEach(node => {
      expect(node.status).toBe('pending');
    });
  });
});

// =============================================================================
// FEATURE 2: Journey State Persistence
// =============================================================================

describe('Feature 2: Journey State Persistence', () => {
  let adapter: InMemoryPersistenceAdapter;
  let manager: PersistenceManager;

  beforeEach(() => {
    adapter = new InMemoryPersistenceAdapter();
    manager = new PersistenceManager(adapter);
  });

  it('should save and load checkpoints', async () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey);
    const context = engine.getContext();

    await adapter.saveCheckpoint(context.instanceId, context);
    const loaded = await adapter.loadCheckpoint(context.instanceId);

    expect(loaded).toBeDefined();
    expect(loaded?.instanceId).toBe(context.instanceId);
    expect(loaded?.status).toBe(context.status);
  });

  it('should save and load journey instances', async () => {
    const instance = {
      id: crypto.randomUUID(),
      journeyId: crypto.randomUUID(),
      journeyName: 'Test Journey',
      journeyVersion: 1,
      context: createJourneyEngine(createTestJourney()).getContext(),
      history: [],
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adapter.saveInstance(instance);
    const loaded = await adapter.loadInstance(instance.id);

    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(instance.id);
    expect(loaded?.tenantId).toBe(instance.tenantId);
  });

  it('should update instance', async () => {
    const instance = {
      id: crypto.randomUUID(),
      journeyId: crypto.randomUUID(),
      journeyName: 'Test Journey',
      journeyVersion: 1,
      context: createJourneyEngine(createTestJourney()).getContext(),
      history: [],
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adapter.saveInstance(instance);
    await adapter.updateInstance(instance.id, { journeyName: 'Updated Name' });
    const loaded = await adapter.loadInstance(instance.id);

    expect(loaded?.journeyName).toBe('Updated Name');
  });

  it('should list instances with filters', async () => {
    const instances = [
      {
        id: crypto.randomUUID(),
        journeyId: 'journey-1',
        journeyName: 'Journey 1',
        journeyVersion: 1,
        context: { ...createJourneyEngine(createTestJourney()).getContext(), status: 'running' as const },
        history: [],
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        journeyId: 'journey-2',
        journeyName: 'Journey 2',
        journeyVersion: 1,
        context: { ...createJourneyEngine(createTestJourney()).getContext(), status: 'completed' as const },
        history: [],
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const inst of instances) {
      await adapter.saveInstance(inst);
    }

    const all = await adapter.listInstances({ tenantId: 'tenant-1' });
    expect(all).toHaveLength(2);

    const running = await adapter.listInstances({ tenantId: 'tenant-1', status: 'running' });
    expect(running).toHaveLength(1);
  });

  it('should delete instance', async () => {
    const instance = {
      id: crypto.randomUUID(),
      journeyId: crypto.randomUUID(),
      journeyName: 'Test Journey',
      journeyVersion: 1,
      context: createJourneyEngine(createTestJourney()).getContext(),
      history: [],
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adapter.saveInstance(instance);
    await adapter.deleteInstance(instance.id);
    const loaded = await adapter.loadInstance(instance.id);

    expect(loaded).toBeNull();
  });
});

// =============================================================================
// FEATURE 3: Step Transitions Engine
// =============================================================================

describe('Feature 3: Step Transitions Engine', () => {
  describe('Condition Evaluation', () => {
    it('should evaluate AND conditions', async () => {
      const data = createTestExecutionData();
      const condition = {
        logic: 'and' as const,
        conditions: [
          { field: 'input.lead.score', operator: 'greater_than' as const, value: 70 },
          { field: 'var.threshold', operator: 'less_than' as const, value: 80 },
        ],
      };

      const result = await evaluateCondition(condition, data);
      expect(result).toBe(true);
    });

    it('should evaluate OR conditions', async () => {
      const data = createTestExecutionData();
      const condition = {
        logic: 'or' as const,
        conditions: [
          { field: 'input.lead.score', operator: 'greater_than' as const, value: 90 },
          { field: 'var.threshold', operator: 'less_than' as const, value: 80 },
        ],
      };

      const result = await evaluateCondition(condition, data);
      expect(result).toBe(true);
    });

    it('should handle empty conditions', async () => {
      const data = createTestExecutionData();
      const condition = { logic: 'and' as const, conditions: [] };

      const result = await evaluateCondition(condition, data);
      expect(result).toBe(true);
    });

    it('should evaluate contains operator', async () => {
      const data = createTestExecutionData();
      const condition = {
        logic: 'and' as const,
        conditions: [
          { field: 'input.lead.name', operator: 'contains' as const, value: 'Test' },
        ],
      };

      const result = await evaluateCondition(condition, data);
      expect(result).toBe(true);
    });
  });

  describe('Transition Selection', () => {
    it('should select transitions with passing conditions', async () => {
      const data = createTestExecutionData();
      const transitions = [
        { id: 't-1', condition: { logic: 'and' as const, conditions: [{ field: 'input.lead.score', operator: 'greater_than' as const, value: 90 }] } },
        { id: 't-2', condition: { logic: 'and' as const, conditions: [{ field: 'input.lead.score', operator: 'greater_than' as const, value: 70 }] } },
      ];

      const selected = await selectTransitions(transitions, data);
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe('t-2');
    });

    it('should select multiple transitions when allowed', async () => {
      const data = createTestExecutionData();
      const transitions = [
        { id: 't-1' },
        { id: 't-2' },
      ];

      const selected = await selectTransitions(transitions, data, undefined, { allowMultiple: true });
      expect(selected).toHaveLength(2);
    });

    it('should select transitions without conditions', async () => {
      const data = createTestExecutionData();
      const transitions = [{ id: 't-1' }];

      const selected = await selectTransitions(transitions, data);
      expect(selected).toHaveLength(1);
    });
  });

  describe('Path Finding', () => {
    it('should find all paths from start to end', () => {
      const edges = [
        { fromNodeId: 'A', toNodeId: 'B' },
        { fromNodeId: 'B', toNodeId: 'C' },
      ];

      const paths = findPaths('A', ['C'], edges);
      expect(paths).toHaveLength(1);
      expect(paths[0].complete).toBe(true);
      expect(paths[0].nodes).toEqual(['A', 'B', 'C']);
    });

    it('should check path reachability', () => {
      const edges = [
        { fromNodeId: 'A', toNodeId: 'B' },
        { fromNodeId: 'B', toNodeId: 'C' },
      ];

      expect(isPathReachable('A', 'C', edges)).toBe(true);
      expect(isPathReachable('C', 'A', edges)).toBe(false);
    });

    it('should get reachable nodes', () => {
      const edges = [
        { fromNodeId: 'A', toNodeId: 'B' },
        { fromNodeId: 'A', toNodeId: 'C' },
        { fromNodeId: 'B', toNodeId: 'D' },
      ];

      const reachable = getReachableNodes('A', edges);
      expect(reachable).toContain('A');
      expect(reachable).toContain('B');
      expect(reachable).toContain('C');
      expect(reachable).toContain('D');
    });
  });

  describe('Expression Evaluation', () => {
    it('should evaluate simple expressions', () => {
      const data = createTestExecutionData();
      const result = evaluateExpression('Lead: ${input.lead.name}', data);
      expect(result).toBe('Lead: Test Lead');
    });

    it('should evaluate expressions in objects', () => {
      const data = createTestExecutionData();
      const obj = { message: 'Score is ${input.lead.score}' };
      const result = evaluateExpressions(obj, data);
      expect(result.message).toBe('Score is 85');
    });
  });
});

// =============================================================================
// FEATURE 4: Transition Preconditions
// =============================================================================

describe('Feature 4: Transition Preconditions', () => {
  it('should create field check precondition', () => {
    const precondition = fieldCheck('input.lead.score', '>', 70);
    expect(precondition.type).toBe('field_check');
    expect(precondition.config.field).toBe('input.lead.score');
  });

  it('should create step completed precondition', () => {
    const precondition = stepCompleted('step-1');
    expect(precondition.type).toBe('step_completed');
    expect(precondition.config.stepId).toBe('step-1');
  });

  it('should create time window precondition', () => {
    const precondition = timeWindow(9, 17, { daysOfWeek: [1, 2, 3, 4, 5] });
    expect(precondition.type).toBe('time_window');
    expect(precondition.config.startHour).toBe(9);
    expect(precondition.config.endHour).toBe(17);
  });

  it('should create rate limit precondition', () => {
    const precondition = rateLimit(100, 60000);
    expect(precondition.type).toBe('rate_limit');
    expect(precondition.config.maxExecutions).toBe(100);
    expect(precondition.config.windowMs).toBe(60000);
  });

  it('should create feature flag precondition', () => {
    const precondition = featureFlag('new_feature');
    expect(precondition.type).toBe('feature_flag');
    expect(precondition.config.flagName).toBe('new_feature');
  });

  it('should check preconditions', async () => {
    const step = createTestJourney().steps[0];
    const context = createJourneyEngine(createTestJourney()).getContext();
    const data = createTestExecutionData();

    const preconditions: Precondition[] = [
      fieldCheck('input.lead.score', 'greater_than', 70),
    ];

    const results = await checkPreconditions(preconditions, step, context, data);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });
});

// =============================================================================
// FEATURE 5: Journey Error Handling
// =============================================================================

describe('Feature 5: Journey Error Handling', () => {
  it('should create JourneyError', () => {
    const error = new JourneyError('STEP_FAILED', 'Step execution failed', { stepId: 'step-1' }, true);

    expect(error.code).toBe('STEP_FAILED');
    expect(error.message).toBe('Step execution failed');
    expect(error.details?.stepId).toBe('step-1');
    expect(error.retryable).toBe(true);
  });

  it('should classify errors', () => {
    const error = new JourneyError('TIMEOUT', 'Operation timed out', {}, true);
    const classified = classifyError(error);

    expect(classified.code).toBe('TIMEOUT');
    expect(classified.severity).toBe('medium');
    expect(classified.retryable).toBe(true);
  });

  it('should classify regular errors', () => {
    const error = new Error('Network connection failed');
    error.name = 'NetworkError';
    const classified = classifyError(error);

    expect(classified.code).toBe('EXECUTION_FAILED');
    expect(classified.retryable).toBe(true);
  });

  it('should wrap promises with timeout', async () => {
    const fastPromise = () => Promise.resolve('success');
    const result = await withTimeout(fastPromise(), 1000);
    expect(result).toBe('success');
  });

  it('should timeout slow promises', async () => {
    const slowPromise = () => new Promise(resolve => setTimeout(() => resolve('done'), 100));

    await expect(withTimeout(slowPromise(), 10)).rejects.toThrow('timed out');
  });

  it('should retry failed operations', async () => {
    let attempts = 0;
    const flaky = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Temporary failure');
      return 'success';
    };

    // maxRetries=2 means 1 initial + 2 retries = 3 total attempts
    // Provide shouldRetry to always retry since default uses classifyError
    const result = await withRetry(flaky, {
      maxRetries: 2,
      backoffMs: 1,
      shouldRetry: () => true,
    });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should track error statistics', () => {
    const stats = getErrorStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('byCode');
    expect(stats).toHaveProperty('bySeverity');
  });
});

// =============================================================================
// FEATURE 6: Journey Fallback Logic
// =============================================================================

describe('Feature 6: Journey Fallback Logic', () => {
  it('should create skip fallback config', () => {
    const config = skipFallback();
    expect(config.strategy).toBe('skip');
  });

  it('should create retry fallback config', () => {
    const config = retryFallback(5, { retryDelayMs: 2000 });
    expect(config.strategy).toBe('retry');
    expect(config.maxRetries).toBe(5);
    expect(config.retryDelayMs).toBe(2000);
  });

  it('should execute skip fallback', async () => {
    const journey = createTestJourney();
    const step = journey.steps[0];
    const context = createJourneyEngine(journey).getContext();
    const node = context.graph.nodes[0];
    const error = new JourneyError('STEP_FAILED', 'Failed');
    const config: FallbackConfig = { strategy: 'skip' };

    const result = await executeFallback('skip', config, step, node, context, error);

    expect(result.success).toBe(true);
    expect(result.strategy).toBe('skip');
    expect(result.shouldContinue).toBe(true);
    expect(node.status).toBe('skipped');
  });

  it('should execute fail fallback', async () => {
    const journey = createTestJourney();
    const step = journey.steps[0];
    const context = createJourneyEngine(journey).getContext();
    const node = context.graph.nodes[0];
    const error = new JourneyError('STEP_FAILED', 'Failed');
    const config: FallbackConfig = { strategy: 'fail' };

    const result = await executeFallback('fail', config, step, node, context, error);

    expect(result.success).toBe(true);
    expect(result.strategy).toBe('fail');
    expect(result.shouldFail).toBe(true);
    expect(context.status).toBe('failed');
  });

  it('should get default fallback chain for errors', () => {
    const timeoutError = new JourneyError('TIMEOUT', 'Timed out');
    const chain = getDefaultFallbackChain(timeoutError);

    expect(chain).toContain('retry');
  });

  it('should execute fallback chain', async () => {
    const journey = createTestJourney();
    const step = journey.steps[0];
    const context = createJourneyEngine(journey).getContext();
    const node = context.graph.nodes[0];
    const error = new JourneyError('STEP_FAILED', 'Failed');

    const configs = new Map<string, FallbackConfig>([
      ['skip', { strategy: 'skip' }],
    ]);

    const result = await executeFallbackChain(
      ['skip'],
      configs as Map<"skip" | "retry" | "fallback_step" | "manual_review" | "fail" | "rollback", FallbackConfig>,
      step,
      node,
      context,
      error
    );

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration: Journey Engine', () => {
  it('should export all required modules', () => {
    // State Machine
    expect(JourneyStateMachine).toBeDefined();
    expect(createJourneyEngine).toBeDefined();

    // Persistence
    expect(InMemoryPersistenceAdapter).toBeDefined();
    expect(PersistenceManager).toBeDefined();
    expect(createInMemoryPersistence).toBeDefined();

    // Transitions
    expect(evaluateCondition).toBeDefined();
    expect(selectTransitions).toBeDefined();
    expect(findPaths).toBeDefined();

    // Preconditions
    expect(checkPreconditions).toBeDefined();
    expect(fieldCheck).toBeDefined();

    // Error Handling
    expect(classifyError).toBeDefined();
    expect(withTimeout).toBeDefined();
    expect(withRetry).toBeDefined();

    // Fallback
    expect(executeFallback).toBeDefined();
    expect(getDefaultFallbackChain).toBeDefined();
  });

  it('should create and initialize engine with handlers', () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey, {
      maxConcurrentSteps: 2,
      defaultStepTimeoutMs: 5000,
    });

    // Register handlers
    engine.registerHandler({
      type: 'discovery',
      handler: async (step, context, data) => ({
        stepId: step.id,
        status: 'completed',
        output: { found: 5 },
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 100,
        logs: [],
      }),
    });

    expect(engine.getStatus()).toBe('idle');
  });

  it('should provide context with all required fields', () => {
    const journey = createTestJourney();
    const engine = createJourneyEngine(journey);
    const context = engine.getContext();

    expect(context.instanceId).toBeDefined();
    expect(context.journeyId).toBe(journey.id);
    expect(context.version).toBe(journey.version);
    expect(context.status).toBe('idle');
    expect(context.graph).toBeDefined();
    expect(context.data).toBeDefined();
    expect(context.createdAt).toBeInstanceOf(Date);
    expect(context.lastUpdatedAt).toBeInstanceOf(Date);
  });
});
