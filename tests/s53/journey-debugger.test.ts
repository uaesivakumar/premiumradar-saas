/**
 * Journey Debugger Tests
 * Sprint S53: Journey Debugger
 *
 * Comprehensive tests for the debugging toolkit.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Types
  getVariableType,
  isExpandable,
  formatValue,
  createVariable,
  getVariableChildren,
  generateDebugId,
  evaluateHitCondition,
  DEFAULT_DEBUG_CONFIG,
  DEFAULT_DEBUG_STATE,
  // Breakpoint Manager
  BreakpointManager,
  createBreakpointManager,
  // Watch Evaluator
  WatchEvaluator,
  VariableInspector,
  createWatchEvaluator,
  // Debugger Engine
  DebuggerEngine,
  createDebuggerEngine,
} from '../../lib/journey-debugger';

// =============================================================================
// TEST DATA
// =============================================================================

const mockSteps = [
  {
    id: 'step-run-1',
    runId: 'run-123',
    stepId: 'step-1',
    stepType: 'ai_call',
    stepName: 'Analyze Company',
    status: 'pending' as const,
    executionOrder: 0,
    startedAt: new Date(),
    durationMs: 0,
    inputData: { company: 'Acme' },
    retryCount: 0,
    maxRetries: 3,
    fallbackTriggered: false,
    metadata: {},
    createdAt: new Date(),
  },
  {
    id: 'step-run-2',
    runId: 'run-123',
    stepId: 'step-2',
    stepType: 'condition',
    stepName: 'Check Industry',
    status: 'pending' as const,
    executionOrder: 1,
    startedAt: new Date(),
    durationMs: 0,
    inputData: {},
    retryCount: 0,
    maxRetries: 3,
    fallbackTriggered: false,
    metadata: {},
    createdAt: new Date(),
  },
  {
    id: 'step-run-3',
    runId: 'run-123',
    stepId: 'step-3',
    stepType: 'action',
    stepName: 'Send Email',
    status: 'pending' as const,
    executionOrder: 2,
    startedAt: new Date(),
    durationMs: 0,
    inputData: {},
    retryCount: 0,
    maxRetries: 3,
    fallbackTriggered: false,
    metadata: {},
    createdAt: new Date(),
  },
];

const mockContext = {
  company: { name: 'Acme', industry: 'Tech' },
  score: 85,
  signals: ['hiring', 'expansion'],
  active: true,
};

// =============================================================================
// TYPE HELPER TESTS
// =============================================================================

describe('Type Helpers', () => {
  describe('getVariableType', () => {
    it('should identify string type', () => {
      expect(getVariableType('hello')).toBe('string');
    });

    it('should identify number type', () => {
      expect(getVariableType(42)).toBe('number');
      expect(getVariableType(3.14)).toBe('number');
    });

    it('should identify boolean type', () => {
      expect(getVariableType(true)).toBe('boolean');
      expect(getVariableType(false)).toBe('boolean');
    });

    it('should identify null type', () => {
      expect(getVariableType(null)).toBe('null');
    });

    it('should identify undefined type', () => {
      expect(getVariableType(undefined)).toBe('undefined');
    });

    it('should identify array type', () => {
      expect(getVariableType([])).toBe('array');
      expect(getVariableType([1, 2, 3])).toBe('array');
    });

    it('should identify object type', () => {
      expect(getVariableType({})).toBe('object');
      expect(getVariableType({ key: 'value' })).toBe('object');
    });

    it('should identify date type', () => {
      expect(getVariableType(new Date())).toBe('date');
    });

    it('should identify function type', () => {
      expect(getVariableType(() => {})).toBe('function');
    });
  });

  describe('isExpandable', () => {
    it('should return true for non-empty arrays', () => {
      expect(isExpandable([1, 2, 3])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(isExpandable([])).toBe(false);
    });

    it('should return true for non-empty objects', () => {
      expect(isExpandable({ key: 'value' })).toBe(true);
    });

    it('should return false for empty objects', () => {
      expect(isExpandable({})).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isExpandable('string')).toBe(false);
      expect(isExpandable(42)).toBe(false);
      expect(isExpandable(true)).toBe(false);
      expect(isExpandable(null)).toBe(false);
      expect(isExpandable(undefined)).toBe(false);
    });
  });

  describe('formatValue', () => {
    it('should format null', () => {
      expect(formatValue(null)).toBe('null');
    });

    it('should format undefined', () => {
      expect(formatValue(undefined)).toBe('undefined');
    });

    it('should format strings with quotes', () => {
      expect(formatValue('hello')).toBe('"hello"');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(200);
      const result = formatValue(longString, 50);
      expect(result.length).toBeLessThan(60);
      expect(result).toContain('...');
    });

    it('should format numbers', () => {
      expect(formatValue(42)).toBe('42');
      expect(formatValue(3.14)).toBe('3.14');
    });

    it('should format booleans', () => {
      expect(formatValue(true)).toBe('true');
      expect(formatValue(false)).toBe('false');
    });

    it('should format arrays with length', () => {
      expect(formatValue([1, 2, 3])).toBe('Array(3)');
    });

    it('should format objects with keys', () => {
      const result = formatValue({ a: 1, b: 2 });
      expect(result).toContain('Object');
      expect(result).toContain('a');
    });
  });

  describe('createVariable', () => {
    it('should create variable from string', () => {
      const variable = createVariable('name', 'John', 'ctx.name');
      expect(variable.name).toBe('name');
      expect(variable.value).toBe('John');
      expect(variable.type).toBe('string');
      expect(variable.expandable).toBe(false);
      expect(variable.path).toBe('ctx.name');
    });

    it('should create expandable variable from object', () => {
      const variable = createVariable('user', { name: 'John' }, 'ctx.user');
      expect(variable.expandable).toBe(true);
      expect(variable.type).toBe('object');
    });
  });

  describe('getVariableChildren', () => {
    it('should return empty for non-expandable', () => {
      const variable = createVariable('name', 'John', 'ctx.name');
      expect(getVariableChildren(variable)).toEqual([]);
    });

    it('should return children for array', () => {
      const variable = createVariable('items', [1, 2], 'ctx.items');
      variable.expandable = true;
      const children = getVariableChildren(variable);
      expect(children.length).toBe(2);
      expect(children[0].name).toBe('0');
      expect(children[0].value).toBe(1);
    });

    it('should return children for object', () => {
      const variable = createVariable('user', { name: 'John', age: 30 }, 'ctx.user');
      variable.expandable = true;
      const children = getVariableChildren(variable);
      expect(children.length).toBe(2);
      expect(children.find(c => c.name === 'name')?.value).toBe('John');
    });
  });

  describe('generateDebugId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateDebugId('test');
      const id2 = generateDebugId('test');
      expect(id1).not.toBe(id2);
    });

    it('should use prefix', () => {
      const id = generateDebugId('bp');
      expect(id.startsWith('bp_')).toBe(true);
    });
  });

  describe('evaluateHitCondition', () => {
    it('should evaluate > condition', () => {
      expect(evaluateHitCondition(5, '> 3')).toBe(true);
      expect(evaluateHitCondition(2, '> 3')).toBe(false);
    });

    it('should evaluate >= condition', () => {
      expect(evaluateHitCondition(3, '>= 3')).toBe(true);
      expect(evaluateHitCondition(2, '>= 3')).toBe(false);
    });

    it('should evaluate == condition', () => {
      expect(evaluateHitCondition(3, '== 3')).toBe(true);
      expect(evaluateHitCondition(4, '== 3')).toBe(false);
    });

    it('should return true for empty condition', () => {
      expect(evaluateHitCondition(5, '')).toBe(true);
    });
  });
});

// =============================================================================
// BREAKPOINT MANAGER TESTS
// =============================================================================

describe('BreakpointManager', () => {
  let manager: BreakpointManager;

  beforeEach(() => {
    manager = createBreakpointManager('journey-123');
  });

  describe('addBreakpoint', () => {
    it('should add step breakpoint', () => {
      const bp = manager.addStepBreakpoint('step-1', 0);
      expect(bp.type).toBe('step');
      expect(bp.stepId).toBe('step-1');
      expect(bp.enabled).toBe(true);
      expect(bp.hitCount).toBe(0);
    });

    it('should add conditional breakpoint', () => {
      const bp = manager.addConditionalBreakpoint('step-1', 'score > 50');
      expect(bp.type).toBe('conditional');
      expect(bp.condition).toBe('score > 50');
    });

    it('should add logpoint', () => {
      const bp = manager.addLogpoint('step-1', 'Score is {score}');
      expect(bp.type).toBe('logpoint');
      expect(bp.logMessage).toBe('Score is {score}');
    });

    it('should add error breakpoint', () => {
      const bp = manager.addErrorBreakpoint();
      expect(bp.type).toBe('error');
    });

    it('should add context change breakpoint', () => {
      const bp = manager.addContextChangeBreakpoint('score');
      expect(bp.type).toBe('context_change');
      expect(bp.contextKey).toBe('score');
    });
  });

  describe('removeBreakpoint', () => {
    it('should remove breakpoint', () => {
      const bp = manager.addStepBreakpoint('step-1');
      expect(manager.getAllBreakpoints().length).toBe(1);

      manager.removeBreakpoint(bp.id);
      expect(manager.getAllBreakpoints().length).toBe(0);
    });

    it('should return false for non-existent breakpoint', () => {
      const result = manager.removeBreakpoint('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('toggleBreakpoint', () => {
    it('should toggle enabled state', () => {
      const bp = manager.addStepBreakpoint('step-1');
      expect(bp.enabled).toBe(true);

      manager.toggleBreakpoint(bp.id);
      expect(manager.getBreakpoint(bp.id)?.enabled).toBe(false);

      manager.toggleBreakpoint(bp.id);
      expect(manager.getBreakpoint(bp.id)?.enabled).toBe(true);
    });
  });

  describe('getBreakpointsForStep', () => {
    it('should return breakpoints for step', () => {
      manager.addStepBreakpoint('step-1');
      manager.addStepBreakpoint('step-2');
      manager.addStepBreakpoint('step-1');

      const step1Bps = manager.getBreakpointsForStep('step-1');
      expect(step1Bps.length).toBe(2);
    });
  });

  describe('clearAllBreakpoints', () => {
    it('should remove all breakpoints', () => {
      manager.addStepBreakpoint('step-1');
      manager.addStepBreakpoint('step-2');
      expect(manager.getAllBreakpoints().length).toBe(2);

      manager.clearAllBreakpoints();
      expect(manager.getAllBreakpoints().length).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should export and import breakpoints', () => {
      manager.addStepBreakpoint('step-1');
      manager.addConditionalBreakpoint('step-2', 'x > 5');

      const exported = manager.toJSON();
      expect(exported.length).toBe(2);

      const newManager = createBreakpointManager('journey-123');
      newManager.fromJSON(exported);
      expect(newManager.getAllBreakpoints().length).toBe(2);
    });
  });
});

// =============================================================================
// WATCH EVALUATOR TESTS
// =============================================================================

describe('WatchEvaluator', () => {
  let evaluator: WatchEvaluator;

  beforeEach(() => {
    evaluator = createWatchEvaluator();
  });

  describe('addExpression', () => {
    it('should add expression', () => {
      const expr = evaluator.addExpression('company.name', 'Company Name');
      expect(expr.expression).toBe('company.name');
      expect(expr.name).toBe('Company Name');
      expect(expr.enabled).toBe(true);
    });
  });

  describe('removeExpression', () => {
    it('should remove expression', () => {
      const expr = evaluator.addExpression('company.name');
      expect(evaluator.getAllExpressions().length).toBe(1);

      evaluator.removeExpression(expr.id);
      expect(evaluator.getAllExpressions().length).toBe(0);
    });
  });

  describe('evaluate', () => {
    it('should evaluate simple property access', () => {
      const expr = evaluator.addExpression('score');
      const result = evaluator.evaluate(expr, mockContext);

      expect(result.value).toBe(85);
      expect(result.type).toBe('number');
      expect(result.error).toBeUndefined();
    });

    it('should evaluate nested property access', () => {
      const expr = evaluator.addExpression('company.name');
      const result = evaluator.evaluate(expr, mockContext);

      expect(result.value).toBe('Acme');
      expect(result.type).toBe('string');
    });

    it('should handle array access', () => {
      evaluator.addExpression('signals[0]');
      const results = evaluator.evaluateAll(mockContext);

      expect(results[0].value).toBe('hiring');
    });

    it('should handle errors gracefully', () => {
      const expr = evaluator.addExpression('nonexistent.deep.path');
      const result = evaluator.evaluate(expr, mockContext);

      expect(result.value).toBeUndefined();
    });

    it('should evaluate all expressions', () => {
      evaluator.addExpression('score');
      evaluator.addExpression('company.name');

      const results = evaluator.evaluateAll(mockContext);
      expect(results.length).toBe(2);
    });
  });

  describe('toggleExpression', () => {
    it('should toggle enabled state', () => {
      const expr = evaluator.addExpression('score');
      expect(expr.enabled).toBe(true);

      evaluator.toggleExpression(expr.id);
      expect(evaluator.getExpression(expr.id)?.enabled).toBe(false);
    });
  });

  describe('evaluateSingle', () => {
    it('should evaluate single expression without adding', () => {
      const result = evaluator.evaluateSingle('score + 10', mockContext);
      expect(result.value).toBe(95);
    });
  });
});

// =============================================================================
// VARIABLE INSPECTOR TESTS
// =============================================================================

describe('VariableInspector', () => {
  describe('createScopes', () => {
    it('should create context scope', () => {
      const scopes = VariableInspector.createScopes(mockContext);
      expect(scopes.length).toBe(1);
      expect(scopes[0].name).toBe('Context');
      expect(scopes[0].variables.length).toBe(4);
    });

    it('should create additional scopes', () => {
      const scopes = VariableInspector.createScopes(mockContext, {
        Local: { temp: 'value' },
      });
      expect(scopes.length).toBe(2);
      expect(scopes[1].name).toBe('Local');
    });
  });

  describe('createVariables', () => {
    it('should create variables from object', () => {
      const variables = VariableInspector.createVariables(
        { name: 'John', age: 30 },
        'ctx'
      );
      expect(variables.length).toBe(2);
      expect(variables[0].path).toBe('ctx.name');
    });
  });

  describe('getValueAtPath', () => {
    it('should get nested value', () => {
      const value = VariableInspector.getValueAtPath(mockContext, 'ctx.company.name');
      expect(value).toBe('Acme');
    });

    it('should return undefined for invalid path', () => {
      const value = VariableInspector.getValueAtPath(mockContext, 'ctx.invalid.path');
      expect(value).toBeUndefined();
    });
  });
});

// =============================================================================
// DEBUGGER ENGINE TESTS
// =============================================================================

describe('DebuggerEngine', () => {
  let engine: DebuggerEngine;

  beforeEach(() => {
    engine = createDebuggerEngine();
  });

  describe('startSession', () => {
    it('should start a new session', () => {
      const session = engine.startSession('journey-123', mockSteps, mockContext);

      expect(session.id).toBeDefined();
      expect(session.journeyId).toBe('journey-123');
      expect(session.status).toBe('paused'); // pauseOnStart default
      expect(session.currentStepIndex).toBe(0);
    });

    it('should initialize breakpoint manager', () => {
      engine.startSession('journey-123', mockSteps);
      expect(engine.getBreakpointManager()).not.toBeNull();
    });

    it('should initialize watch evaluator', () => {
      engine.startSession('journey-123', mockSteps);
      expect(engine.getWatchEvaluator()).not.toBeNull();
    });
  });

  describe('stopSession', () => {
    it('should stop and cleanup session', () => {
      engine.startSession('journey-123', mockSteps);
      engine.stopSession();

      expect(engine.getSession()).toBeNull();
      expect(engine.getBreakpointManager()).toBeNull();
    });
  });

  describe('context management', () => {
    it('should update context', () => {
      engine.startSession('journey-123', mockSteps, { score: 50 });
      engine.updateContext('score', 100);

      expect(engine.getContext().score).toBe(100);
    });

    it('should get context', () => {
      engine.startSession('journey-123', mockSteps, mockContext);
      const ctx = engine.getContext();

      expect(ctx.score).toBe(85);
    });
  });

  describe('step navigation', () => {
    it('should jump to step', () => {
      engine.startSession('journey-123', mockSteps);
      engine.jumpToStep(2);

      const session = engine.getSession();
      expect(session?.currentStepIndex).toBe(2);
      expect(session?.currentStepId).toBe('step-run-3');
    });

    it('should not jump to invalid step', () => {
      engine.startSession('journey-123', mockSteps);
      engine.jumpToStep(100);

      const session = engine.getSession();
      expect(session?.currentStepIndex).toBe(0);
    });

    it('should get step at index', () => {
      engine.startSession('journey-123', mockSteps);
      const step = engine.getStepAt(1);

      expect(step?.stepName).toBe('Check Industry');
    });
  });

  describe('expression evaluation', () => {
    it('should evaluate expression', () => {
      engine.startSession('journey-123', mockSteps, mockContext);
      const result = engine.evaluateExpression('score');

      expect(result?.value).toBe(85);
    });
  });

  describe('events', () => {
    it('should track events', () => {
      engine.startSession('journey-123', mockSteps);
      const events = engine.getEvents();

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('session_started');
    });
  });

  describe('callbacks', () => {
    it('should call onSessionStart callback', () => {
      const onStart = vi.fn();
      const engineWithCallbacks = createDebuggerEngine({}, { onSessionStart: onStart });

      engineWithCallbacks.startSession('journey-123', mockSteps);
      expect(onStart).toHaveBeenCalled();
    });

    it('should call onSessionComplete callback', () => {
      const onComplete = vi.fn();
      const engineWithCallbacks = createDebuggerEngine({}, { onSessionComplete: onComplete });

      engineWithCallbacks.startSession('journey-123', mockSteps);
      engineWithCallbacks.stopSession();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('config', () => {
    it('should use custom config', () => {
      const customEngine = createDebuggerEngine({
        pauseOnStart: false,
        pauseOnError: false,
      });

      const session = customEngine.startSession('journey-123', mockSteps);
      expect(session.status).toBe('running');
    });
  });
});

// =============================================================================
// DEFAULT VALUES TESTS
// =============================================================================

describe('Default Values', () => {
  it('should have correct DEFAULT_DEBUG_CONFIG', () => {
    expect(DEFAULT_DEBUG_CONFIG.pauseOnStart).toBe(true);
    expect(DEFAULT_DEBUG_CONFIG.pauseOnError).toBe(true);
    expect(DEFAULT_DEBUG_CONFIG.pauseOnCaughtError).toBe(false);
    expect(DEFAULT_DEBUG_CONFIG.maxCallStackDepth).toBe(100);
  });

  it('should have correct DEFAULT_DEBUG_STATE', () => {
    expect(DEFAULT_DEBUG_STATE.session).toBeNull();
    expect(DEFAULT_DEBUG_STATE.isConnected).toBe(false);
    expect(DEFAULT_DEBUG_STATE.isLoading).toBe(false);
    expect(DEFAULT_DEBUG_STATE.error).toBeNull();
    expect(DEFAULT_DEBUG_STATE.events).toEqual([]);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration', () => {
  it('should work end-to-end', () => {
    // Create engine
    const engine = createDebuggerEngine();

    // Start session
    const session = engine.startSession('journey-123', mockSteps, mockContext);
    expect(session.status).toBe('paused');

    // Add breakpoint
    const bpManager = engine.getBreakpointManager()!;
    bpManager.addStepBreakpoint('step-run-2');
    expect(bpManager.getAllBreakpoints().length).toBe(1);

    // Add watch
    const watchEval = engine.getWatchEvaluator()!;
    watchEval.addExpression('company.name');
    const results = watchEval.evaluateAll(engine.getContext());
    expect(results[0].value).toBe('Acme');

    // Navigate
    engine.jumpToStep(1);
    expect(engine.getSession()?.currentStepIndex).toBe(1);

    // Update context
    engine.updateContext('newKey', 'newValue');
    expect(engine.getContext().newKey).toBe('newValue');

    // Stop session
    engine.stopSession();
    expect(engine.getSession()).toBeNull();
  });
});
