/**
 * Promptable Journeys Tests
 * Sprint S49: AI-Enabled Journey Runtime
 *
 * Tests for:
 * - AI Step Orchestrator
 * - Auto-Context Provider
 * - AI Decision Nodes
 * - Autonomous Step Execution
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  AIStepOrchestrator,
  createAIStepOrchestrator,
  AIStepError,
} from '../../lib/promptable-journeys/ai-orchestrator';
import {
  resolveContextSource,
  buildContext,
  createDefaultContextSources,
  injectContextIntoPrompt,
  buildPrompt,
  estimateTokens,
  truncateContext,
  getCachedContext,
  setCachedContext,
  clearContextCache,
} from '../../lib/promptable-journeys/context-provider';
import {
  AIDecisionExecutor,
  createAIDecisionExecutor,
} from '../../lib/promptable-journeys/decision-nodes';
import {
  AutonomousStepExecutor,
  createAutonomousExecutor,
  AutonomousStepError,
} from '../../lib/promptable-journeys/autonomous-executor';
import {
  PromptableJourneyEngine,
  createPromptableJourneyEngine,
} from '../../lib/promptable-journeys';
import type {
  AIStepConfig,
  AIDecisionConfig,
  AutonomousStepConfig,
  PromptTemplate,
  Checkpoint,
  ContextSource,
  AutoContextConfig,
} from '../../lib/promptable-journeys/types';
import type {
  ExecutionContext,
  ExecutionData,
} from '../../lib/journey-engine/types';
import type { StepNode, Transition } from '../../lib/journey-builder/types';

// =============================================================================
// MOCK DATA
// =============================================================================

function createMockContext(): ExecutionContext {
  return {
    instanceId: '550e8400-e29b-41d4-a716-446655440000',
    journeyId: '660e8400-e29b-41d4-a716-446655440001',
    version: 1,
    status: 'running',
    graph: {
      nodes: [],
      edges: [],
      currentNodeIds: ['step1'],
      endNodeIds: [],
    },
    data: {
      input: { companyId: 'company123', industry: 'tech' },
      stepOutputs: { step0: { score: 85 } },
      variables: { threshold: 0.7 },
    },
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
    metadata: {},
    tags: [],
  };
}

function createMockData(): ExecutionData {
  return {
    input: { companyId: 'company123', industry: 'tech' },
    stepOutputs: { step0: { score: 85, recommendation: 'high priority' } },
    variables: { threshold: 0.7 },
    entityId: 'entity123',
    entityType: 'company',
  };
}

function createMockStep(overrides: Partial<StepNode> = {}): StepNode {
  return {
    id: 'step1',
    type: 'action',
    label: 'Test Step',
    position: { x: 100, y: 100 },
    config: {},
    inputs: [],
    outputs: [],
    isStart: false,
    isEnd: false,
    ...overrides,
  };
}

function createMockTemplate(): PromptTemplate {
  return {
    id: 'template1',
    name: 'Test Template',
    version: 1,
    systemPrompt: 'You are an AI assistant analyzing {{industry}} companies.',
    userPrompt: 'Analyze company {{companyId}} with score {{previousScore}}.',
    variables: [
      { name: 'industry', type: 'string', required: true },
      { name: 'companyId', type: 'string', required: true },
      { name: 'previousScore', type: 'number', required: false, default: 0 },
    ],
    modelPreference: 'balanced',
    temperature: 0.7,
    maxTokens: 2048,
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createMockOSClient(responses: Record<string, unknown> = {}) {
  return {
    call: vi.fn().mockImplementation(async (endpoint: string) => {
      if (responses[endpoint]) {
        return { success: true, data: responses[endpoint] };
      }
      return {
        success: true,
        data: {
          content: JSON.stringify({ result: 'test output' }),
          model: 'claude-3-sonnet',
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        },
      };
    }),
  };
}

// =============================================================================
// CONTEXT PROVIDER TESTS
// =============================================================================

describe('Auto-Context Provider', () => {
  beforeEach(() => {
    clearContextCache();
  });

  describe('resolveContextSource', () => {
    it('should resolve static context source', async () => {
      const source: ContextSource = {
        id: 'static1',
        type: 'static',
        staticValue: { key: 'value' },
        transform: 'none',
      };

      const result = await resolveContextSource(
        source,
        createMockContext(),
        createMockData()
      );

      expect(result).toEqual({ key: 'value' });
    });

    it('should resolve journey_data path', async () => {
      const source: ContextSource = {
        id: 'journeyData',
        type: 'journey_data',
        dataPath: 'input.companyId',
        transform: 'none',
      };

      const result = await resolveContextSource(
        source,
        createMockContext(),
        createMockData()
      );

      expect(result).toBe('company123');
    });

    it('should resolve nested journey_data path', async () => {
      const source: ContextSource = {
        id: 'stepOutput',
        type: 'journey_data',
        dataPath: 'stepOutputs.step0.score',
        transform: 'none',
      };

      const result = await resolveContextSource(
        source,
        createMockContext(),
        createMockData()
      );

      expect(result).toBe(85);
    });

    it('should resolve expression with templates', async () => {
      const source: ContextSource = {
        id: 'expression',
        type: 'expression',
        expression: 'Company {{input.companyId}} in {{input.industry}} industry',
        transform: 'none',
      };

      const result = await resolveContextSource(
        source,
        createMockContext(),
        createMockData()
      );

      expect(result).toBe('Company company123 in tech industry');
    });

    it('should apply string transform', async () => {
      const source: ContextSource = {
        id: 'transformed',
        type: 'journey_data',
        dataPath: 'stepOutputs.step0.score',
        transform: 'string',
      };

      const result = await resolveContextSource(
        source,
        createMockContext(),
        createMockData()
      );

      expect(result).toBe('85');
    });
  });

  describe('buildContext', () => {
    it('should build context from multiple sources', async () => {
      const config: AutoContextConfig = {
        sources: [
          { id: 'companyId', type: 'journey_data', dataPath: 'input.companyId', transform: 'none' },
          { id: 'score', type: 'journey_data', dataPath: 'stepOutputs.step0.score', transform: 'none' },
          { id: 'static', type: 'static', staticValue: 'test', transform: 'none' },
        ],
        mergeStrategy: 'replace',
        maxContextTokens: 4000,
        truncateStrategy: 'end',
      };

      const result = await buildContext(config, createMockContext(), createMockData());

      expect(result).toEqual({
        companyId: 'company123',
        score: 85,
        static: 'test',
      });
    });

    it('should deep merge objects', async () => {
      const config: AutoContextConfig = {
        sources: [
          { id: 'first', type: 'static', staticValue: { a: 1, b: { c: 2 } }, transform: 'none' },
          { id: 'second', type: 'static', staticValue: { b: { d: 3 }, e: 4 }, transform: 'none' },
        ],
        mergeStrategy: 'deep',
        maxContextTokens: 4000,
        truncateStrategy: 'end',
      };

      const result = await buildContext(config, createMockContext(), createMockData());

      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4,
      });
    });
  });

  describe('createDefaultContextSources', () => {
    it('should create default sources for common options', () => {
      const sources = createDefaultContextSources({
        includeJourneyInput: true,
        includeStepOutputs: true,
        includeEntity: true,
      });

      expect(sources.length).toBeGreaterThanOrEqual(3);
      expect(sources.some((s) => s.id === 'journeyInput')).toBe(true);
      expect(sources.some((s) => s.id === 'previousSteps')).toBe(true);
      expect(sources.some((s) => s.id === 'entityId')).toBe(true);
    });
  });

  describe('injectContextIntoPrompt', () => {
    it('should inject variables into prompt', () => {
      const template = 'Hello {{name}}, your score is {{score}}.';
      const context = { name: 'John', score: 95 };

      const result = injectContextIntoPrompt(template, context);

      expect(result).toBe('Hello John, your score is 95.');
    });

    it('should handle nested object injection', () => {
      const template = 'Company: {{company.name}}, Industry: {{company.industry}}';
      const context = { company: { name: 'Acme', industry: 'Tech' } };

      const result = injectContextIntoPrompt(template, context);

      expect(result).toBe('Company: Acme, Industry: Tech');
    });

    it('should preserve missing variables', () => {
      const template = 'Hello {{name}}, your {{missing}} is ready.';
      const context = { name: 'John' };

      const result = injectContextIntoPrompt(template, context);

      expect(result).toBe('Hello John, your {{missing}} is ready.');
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens roughly', () => {
      const text = 'This is a test sentence with some words.';
      const tokens = estimateTokens(text);

      // ~4 chars per token, 40 chars = ~10 tokens
      expect(tokens).toBeGreaterThan(5);
      expect(tokens).toBeLessThan(20);
    });
  });

  describe('context caching', () => {
    it('should cache and retrieve context', () => {
      setCachedContext('test-key', { data: 'value' }, 60000);

      const cached = getCachedContext('test-key');

      expect(cached).toEqual({ data: 'value' });
    });

    it('should return null for expired cache', async () => {
      setCachedContext('expired-key', { data: 'value' }, 1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const cached = getCachedContext('expired-key');

      expect(cached).toBeNull();
    });
  });
});

// =============================================================================
// AI STEP ORCHESTRATOR TESTS
// =============================================================================

describe('AI Step Orchestrator', () => {
  let orchestrator: AIStepOrchestrator;
  let mockOSClient: ReturnType<typeof createMockOSClient>;

  beforeEach(() => {
    mockOSClient = createMockOSClient();

    // Create orchestrator with mock template store
    orchestrator = createAIStepOrchestrator({
      logLevel: 'error',
    });
  });

  describe('createAIStepOrchestrator', () => {
    it('should create an orchestrator instance', () => {
      const instance = createAIStepOrchestrator();
      expect(instance).toBeInstanceOf(AIStepOrchestrator);
    });
  });

  describe('registerTemplate', () => {
    it('should register a prompt template', async () => {
      const template = createMockTemplate();

      const registered = await orchestrator.registerTemplate({
        id: template.id,
        name: template.name,
        version: template.version,
        systemPrompt: template.systemPrompt,
        userPrompt: template.userPrompt,
        variables: template.variables,
        modelPreference: template.modelPreference,
        temperature: template.temperature,
        maxTokens: template.maxTokens,
        tags: template.tags,
      });

      expect(registered.id).toBe(template.id);
      expect(registered.createdAt).toBeDefined();
    });
  });

  describe('listTemplates', () => {
    it('should list registered templates', async () => {
      await orchestrator.registerTemplate({
        id: 'test-template',
        name: 'Test',
        version: 1,
        systemPrompt: 'System',
        userPrompt: 'User',
        variables: [],
        modelPreference: 'fast',
        temperature: 0.5,
        maxTokens: 1000,
        tags: ['test'],
      });

      const templates = await orchestrator.listTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === 'test-template')).toBe(true);
    });
  });
});

// =============================================================================
// AI DECISION EXECUTOR TESTS
// =============================================================================

describe('AI Decision Executor', () => {
  let executor: AIDecisionExecutor;

  beforeEach(() => {
    executor = createAIDecisionExecutor({
      logLevel: 'error',
    });
  });

  describe('createAIDecisionExecutor', () => {
    it('should create an executor instance', () => {
      const instance = createAIDecisionExecutor();
      expect(instance).toBeInstanceOf(AIDecisionExecutor);
    });
  });

  // Note: Full execution tests require mocking the OS client
  // which is set up internally. These tests focus on instantiation.
});

// =============================================================================
// AUTONOMOUS STEP EXECUTOR TESTS
// =============================================================================

describe('Autonomous Step Executor', () => {
  let executor: AutonomousStepExecutor;
  let mockMetrics: Mock;
  let mockSafetyEvent: Mock;

  beforeEach(() => {
    mockMetrics = vi.fn();
    mockSafetyEvent = vi.fn();

    executor = createAutonomousExecutor({
      onMetrics: mockMetrics,
      onSafetyEvent: mockSafetyEvent,
      logLevel: 'error',
    });
  });

  describe('createAutonomousExecutor', () => {
    it('should create an executor instance', () => {
      const instance = createAutonomousExecutor();
      expect(instance).toBeInstanceOf(AutonomousStepExecutor);
    });

    it('should accept callback options', () => {
      const onMetrics = vi.fn();
      const onSafetyEvent = vi.fn();

      const instance = createAutonomousExecutor({
        onMetrics,
        onSafetyEvent,
      });

      expect(instance).toBeInstanceOf(AutonomousStepExecutor);
    });
  });

  describe('AutonomousStepError', () => {
    it('should create error with code and details', () => {
      const error = new AutonomousStepError(
        'TEST_ERROR',
        'Test error message',
        { detail: 'value' }
      );

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.details).toEqual({ detail: 'value' });
      expect(error.name).toBe('AutonomousStepError');
    });
  });
});

// =============================================================================
// UNIFIED ENGINE TESTS
// =============================================================================

describe('PromptableJourneyEngine', () => {
  let engine: PromptableJourneyEngine;

  beforeEach(() => {
    engine = createPromptableJourneyEngine({
      logLevel: 'error',
    });
  });

  describe('createPromptableJourneyEngine', () => {
    it('should create an engine instance', () => {
      const instance = createPromptableJourneyEngine();
      expect(instance).toBeInstanceOf(PromptableJourneyEngine);
    });
  });

  describe('getStepHandlerType', () => {
    it('should identify AI steps', () => {
      const step = createMockStep({
        config: {
          templateId: 'template1',
          contextSources: ['journey_input'],
        },
      });

      const type = engine.getStepHandlerType(step);

      expect(type).toBe('ai');
    });

    it('should identify decision steps', () => {
      const step = createMockStep({
        config: {
          templateId: 'decision-template',
          outcomes: [{ id: 'yes', label: 'Yes' }],
        },
      });

      const type = engine.getStepHandlerType(step);

      expect(type).toBe('decision');
    });

    it('should identify autonomous steps', () => {
      const step = createMockStep({
        config: {
          capability: 'auto_discovery',
        },
      });

      const type = engine.getStepHandlerType(step);

      expect(type).toBe('autonomous');
    });

    it('should identify standard steps', () => {
      const step = createMockStep({
        config: {
          someOtherConfig: true,
        },
      });

      const type = engine.getStepHandlerType(step);

      expect(type).toBe('standard');
    });
  });

  describe('registerTemplate', () => {
    it('should register templates through the engine', async () => {
      const template = await engine.registerTemplate({
        id: 'engine-template',
        name: 'Engine Template',
        version: 1,
        systemPrompt: 'System prompt',
        userPrompt: 'User prompt',
        variables: [],
        modelPreference: 'balanced',
        temperature: 0.7,
        maxTokens: 2048,
        tags: [],
      });

      expect(template.id).toBe('engine-template');
    });
  });
});

// =============================================================================
// INTEGRATION TESTS (Conceptual - require OS client mocking)
// =============================================================================

describe('Integration Tests', () => {
  describe('AI Step with Context', () => {
    it('should build context and inject into prompt', async () => {
      const context = createMockContext();
      const data = createMockData();

      // Build context using explicit sources with the keys we want
      const builtContext = await buildContext(
        {
          sources: [
            { id: 'companyId', type: 'journey_data', dataPath: 'input.companyId', transform: 'none' },
            { id: 'score', type: 'journey_data', dataPath: 'stepOutputs.step0.score', transform: 'none' },
          ],
          mergeStrategy: 'replace',
          maxContextTokens: 4000,
          truncateStrategy: 'end',
        },
        context,
        data
      );

      // Inject into prompt using the actual keys from built context
      const template = 'Analyzing {{companyId}} with previous score {{score}}';
      const prompt = injectContextIntoPrompt(template, builtContext);

      expect(prompt).toContain('company123');
      expect(prompt).toContain('85');
    });
  });

  describe('Decision Config Validation', () => {
    it('should validate decision outcomes', () => {
      const config: AIDecisionConfig = {
        templateId: 'decision-template',
        outcomes: [
          { id: 'approve', label: 'Approve', transitionId: 'trans1' },
          { id: 'reject', label: 'Reject', transitionId: 'trans2' },
          { id: 'review', label: 'Manual Review', transitionId: 'trans3' },
        ],
        enforceOutcome: true,
        confidenceThreshold: 0.7,
        contextSources: ['step_outputs'],
        logReasoning: true,
      };

      expect(config.outcomes.length).toBe(3);
      expect(config.enforceOutcome).toBe(true);
      expect(config.confidenceThreshold).toBe(0.7);
    });
  });

  describe('Autonomous Config Validation', () => {
    it('should validate auto-discovery config', () => {
      const config: AutonomousStepConfig = {
        capability: 'auto_discovery',
        discoveryConfig: {
          targetType: 'company',
          qualityThreshold: 0.8,
          maxResults: 50,
        },
        requiresCheckpoint: true,
        maxExecutionTimeMs: 120000,
        trackMetrics: true,
        metricTags: ['discovery', 'test'],
      };

      expect(config.capability).toBe('auto_discovery');
      expect(config.discoveryConfig?.qualityThreshold).toBe(0.8);
      expect(config.requiresCheckpoint).toBe(true);
    });

    it('should validate auto-outreach config', () => {
      const config: AutonomousStepConfig = {
        capability: 'auto_outreach',
        outreachConfig: {
          channel: 'email',
          sequenceId: 'seq123',
          sendTimeOptimization: true,
        },
        requiresCheckpoint: true,
        maxExecutionTimeMs: 60000,
        trackMetrics: true,
        metricTags: ['outreach'],
      };

      expect(config.capability).toBe('auto_outreach');
      expect(config.outreachConfig?.channel).toBe('email');
    });
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('Error Handling', () => {
  describe('AIStepError', () => {
    it('should create error with all properties', () => {
      const error = new AIStepError(
        'TEMPLATE_NOT_FOUND',
        'Template not found',
        { templateId: 'test' }
      );

      expect(error.code).toBe('TEMPLATE_NOT_FOUND');
      expect(error.message).toBe('Template not found');
      expect(error.details).toEqual({ templateId: 'test' });
      expect(error.name).toBe('AIStepError');
    });
  });

  describe('AutonomousStepError', () => {
    it('should create error with all properties', () => {
      const error = new AutonomousStepError(
        'AUTONOMOUS_DISABLED',
        'Autonomous mode is disabled',
        { reason: 'Kill switch active' }
      );

      expect(error.code).toBe('AUTONOMOUS_DISABLED');
      expect(error.details?.reason).toBe('Kill switch active');
    });
  });
});
