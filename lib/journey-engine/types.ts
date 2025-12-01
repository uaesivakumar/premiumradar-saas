/**
 * Journey Engine Types
 * Sprint S48: Journey Engine Runtime
 *
 * State graph types for journey execution:
 * - State machine definitions
 * - Execution context
 * - Step results
 * - Error types
 */
import { z } from 'zod';
import type {
  JourneyDefinition,
  StepNode,
  Transition,
  ConditionGroup,
  StepType,
  StepStatus,
} from '../journey-builder/types';

// =============================================================================
// EXECUTION STATUS
// =============================================================================

export const ExecutionStatusEnum = z.enum([
  'idle',
  'running',
  'paused',
  'waiting',
  'completed',
  'failed',
  'cancelled',
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusEnum>;

export const StepExecutionStatusEnum = z.enum([
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'skipped',
  'waiting',
  'timeout',
]);
export type StepExecutionStatus = z.infer<typeof StepExecutionStatusEnum>;

// =============================================================================
// STATE GRAPH NODE
// =============================================================================

/**
 * Runtime representation of a step in the state graph
 */
export const StateNodeSchema = z.object({
  id: z.string(),
  stepId: z.string(), // Reference to StepNode in definition
  status: StepExecutionStatusEnum,

  // Execution timing
  queuedAt: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),

  // Results
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.unknown()).optional(),
      stack: z.string().optional(),
    })
    .optional(),

  // Retry tracking
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  lastRetryAt: z.date().optional(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type StateNode = z.infer<typeof StateNodeSchema>;

// =============================================================================
// STATE GRAPH EDGE
// =============================================================================

/**
 * Runtime representation of a transition in the state graph
 */
export const StateEdgeSchema = z.object({
  id: z.string(),
  transitionId: z.string(), // Reference to Transition in definition
  fromNodeId: z.string(),
  toNodeId: z.string(),

  // Evaluation
  evaluated: z.boolean().default(false),
  conditionMet: z.boolean().optional(),
  evaluatedAt: z.date().optional(),

  // Path taken flag
  taken: z.boolean().default(false),
});
export type StateEdge = z.infer<typeof StateEdgeSchema>;

// =============================================================================
// STATE GRAPH
// =============================================================================

/**
 * Complete runtime state graph
 */
export const StateGraphSchema = z.object({
  nodes: z.array(StateNodeSchema),
  edges: z.array(StateEdgeSchema),

  // Current position(s) in the graph
  currentNodeIds: z.array(z.string()),

  // Start node
  startNodeId: z.string().optional(),

  // End nodes (can have multiple)
  endNodeIds: z.array(z.string()).default([]),
});
export type StateGraph = z.infer<typeof StateGraphSchema>;

// =============================================================================
// EXECUTION CONTEXT
// =============================================================================

/**
 * Data passed between steps during execution
 */
export const ExecutionDataSchema = z.object({
  // Initial input to the journey
  input: z.record(z.string(), z.unknown()).default({}),

  // Accumulated data from steps
  stepOutputs: z.record(z.string(), z.unknown()).default({}),

  // Variables set during execution
  variables: z.record(z.string(), z.unknown()).default({}),

  // Entity being processed
  entityId: z.string().optional(),
  entityType: z.string().optional(),
});
export type ExecutionData = z.infer<typeof ExecutionDataSchema>;

/**
 * Full execution context
 */
export const ExecutionContextSchema = z.object({
  // Instance identification
  instanceId: z.string().uuid(),
  journeyId: z.string().uuid(),
  version: z.number(),

  // Status
  status: ExecutionStatusEnum,

  // State graph
  graph: StateGraphSchema,

  // Data
  data: ExecutionDataSchema,

  // Timing
  createdAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  lastUpdatedAt: z.date(),

  // Timeout configuration
  timeoutMs: z.number().optional(),
  timeoutAt: z.date().optional(),

  // Pause/Resume
  pausedAt: z.date().optional(),
  pauseReason: z.string().optional(),

  // Triggering
  triggeredBy: z.string().optional(),
  triggerData: z.record(z.string(), z.unknown()).optional(),

  // Tenant context
  tenantId: z.string().optional(),
  workspaceId: z.string().optional(),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
});
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

// =============================================================================
// STEP EXECUTION RESULT
// =============================================================================

export const StepResultSchema = z.object({
  stepId: z.string(),
  status: StepExecutionStatusEnum,

  // Output data
  output: z.unknown().optional(),

  // Timing
  startedAt: z.date(),
  completedAt: z.date(),
  durationMs: z.number(),

  // Error if failed
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean().default(false),
      details: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),

  // Logs/traces
  logs: z
    .array(
      z.object({
        level: z.enum(['debug', 'info', 'warn', 'error']),
        message: z.string(),
        timestamp: z.date(),
        data: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([]),
});
export type StepResult = z.infer<typeof StepResultSchema>;

// =============================================================================
// TRANSITION EVALUATION
// =============================================================================

export const TransitionEvaluationSchema = z.object({
  transitionId: z.string(),
  fromStepId: z.string(),
  toStepId: z.string(),

  // Condition evaluation
  condition: z.unknown().optional(), // The condition that was evaluated
  result: z.boolean(),
  reason: z.string().optional(), // Why condition passed/failed

  // Timing
  evaluatedAt: z.date(),
});
export type TransitionEvaluation = z.infer<typeof TransitionEvaluationSchema>;

// =============================================================================
// PRECONDITION
// =============================================================================

export const PreconditionTypeEnum = z.enum([
  'field_check', // Check a field value
  'step_completed', // Previous step must be completed
  'time_window', // Only execute during certain times
  'rate_limit', // Limit execution frequency
  'feature_flag', // Check feature flag
  'custom', // Custom function
]);
export type PreconditionType = z.infer<typeof PreconditionTypeEnum>;

export const PreconditionSchema = z.object({
  id: z.string(),
  type: PreconditionTypeEnum,
  name: z.string(),
  description: z.string().optional(),

  // Configuration
  config: z.record(z.string(), z.unknown()),

  // Failure behavior
  failureAction: z.enum(['skip', 'fail', 'wait', 'retry']).default('fail'),
  failureMessage: z.string().optional(),

  // Evaluation result (runtime)
  passed: z.boolean().optional(),
  evaluatedAt: z.date().optional(),
});
export type Precondition = z.infer<typeof PreconditionSchema>;

// =============================================================================
// STEP HANDLER
// =============================================================================

/**
 * Handler function signature for step execution
 */
export type StepHandler = (
  step: StepNode,
  context: ExecutionContext,
  data: ExecutionData
) => Promise<StepResult>;

/**
 * Step handler registry entry
 */
export interface StepHandlerEntry {
  type: StepType;
  handler: StepHandler;
  preconditions?: Precondition[];
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export const JourneyErrorCodeEnum = z.enum([
  // Execution errors
  'EXECUTION_FAILED',
  'STEP_FAILED',
  'STEP_TIMEOUT',
  'TRANSITION_FAILED',
  'PRECONDITION_FAILED',

  // State errors
  'INVALID_STATE',
  'STATE_NOT_FOUND',
  'STATE_CORRUPTED',

  // Configuration errors
  'INVALID_DEFINITION',
  'HANDLER_NOT_FOUND',
  'INVALID_TRANSITION',

  // Runtime errors
  'TIMEOUT',
  'CANCELLED',
  'PAUSED',
  'RETRY_EXHAUSTED',

  // Persistence errors
  'PERSISTENCE_FAILED',
  'LOAD_FAILED',
  'SAVE_FAILED',
]);
export type JourneyErrorCode = z.infer<typeof JourneyErrorCodeEnum>;

export class JourneyError extends Error {
  constructor(
    public code: JourneyErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'JourneyError';
  }
}

// =============================================================================
// FALLBACK STRATEGY
// =============================================================================

export const FallbackStrategyEnum = z.enum([
  'skip', // Skip the failed step and continue
  'retry', // Retry the step
  'fallback_step', // Execute a fallback step
  'manual_review', // Mark for manual review and pause
  'fail', // Fail the entire journey
  'rollback', // Rollback to previous state
]);
export type FallbackStrategy = z.infer<typeof FallbackStrategyEnum>;

export const FallbackConfigSchema = z.object({
  strategy: FallbackStrategyEnum,

  // Retry config
  maxRetries: z.number().optional(),
  retryDelayMs: z.number().optional(),
  retryBackoffMultiplier: z.number().optional(),

  // Fallback step
  fallbackStepId: z.string().optional(),

  // Notification
  notifyOnFallback: z.boolean().optional(),
  notificationChannels: z.array(z.string()).optional(),

  // Custom handler
  customHandler: z.string().optional(),
});
export type FallbackConfig = z.infer<typeof FallbackConfigSchema>;

// =============================================================================
// JOURNEY INSTANCE
// =============================================================================

/**
 * A running or completed journey instance
 */
export const JourneyInstanceSchema = z.object({
  id: z.string().uuid(),

  // Journey definition
  journeyId: z.string().uuid(),
  journeyName: z.string(),
  journeyVersion: z.number(),

  // Execution
  context: ExecutionContextSchema,

  // History
  history: z
    .array(
      z.object({
        timestamp: z.date(),
        event: z.string(),
        stepId: z.string().optional(),
        data: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .default([]),

  // Metrics
  metrics: z
    .object({
      totalSteps: z.number(),
      completedSteps: z.number(),
      failedSteps: z.number(),
      skippedSteps: z.number(),
      totalDurationMs: z.number().optional(),
      averageStepDurationMs: z.number().optional(),
    })
    .optional(),

  // Tenant
  tenantId: z.string(),
  workspaceId: z.string().optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type JourneyInstance = z.infer<typeof JourneyInstanceSchema>;

// =============================================================================
// ENGINE EVENTS
// =============================================================================

export type JourneyEvent =
  | { type: 'journey:started'; instanceId: string; journeyId: string; timestamp: Date }
  | { type: 'journey:completed'; instanceId: string; status: ExecutionStatus; timestamp: Date }
  | { type: 'journey:failed'; instanceId: string; error: JourneyError; timestamp: Date }
  | { type: 'journey:paused'; instanceId: string; reason: string; timestamp: Date }
  | { type: 'journey:resumed'; instanceId: string; timestamp: Date }
  | { type: 'journey:cancelled'; instanceId: string; timestamp: Date }
  | { type: 'step:started'; instanceId: string; stepId: string; timestamp: Date }
  | { type: 'step:completed'; instanceId: string; stepId: string; result: StepResult; timestamp: Date }
  | { type: 'step:failed'; instanceId: string; stepId: string; error: JourneyError; timestamp: Date }
  | { type: 'step:skipped'; instanceId: string; stepId: string; reason: string; timestamp: Date }
  | { type: 'step:retrying'; instanceId: string; stepId: string; attempt: number; timestamp: Date }
  | { type: 'transition:evaluated'; instanceId: string; evaluation: TransitionEvaluation; timestamp: Date }
  | { type: 'precondition:checked'; instanceId: string; stepId: string; precondition: Precondition; timestamp: Date }
  | { type: 'fallback:triggered'; instanceId: string; stepId: string; strategy: FallbackStrategy; timestamp: Date };

export type JourneyEventHandler = (event: JourneyEvent) => void | Promise<void>;

// =============================================================================
// ENGINE OPTIONS
// =============================================================================

export interface JourneyEngineOptions {
  // Execution
  maxConcurrentSteps?: number;
  defaultStepTimeoutMs?: number;
  defaultRetryConfig?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };

  // Persistence
  persistenceEnabled?: boolean;
  persistenceAdapter?: PersistenceAdapter;

  // Events
  eventHandlers?: JourneyEventHandler[];

  // Logging
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// =============================================================================
// PERSISTENCE ADAPTER
// =============================================================================

export interface PersistenceAdapter {
  saveInstance(instance: JourneyInstance): Promise<void>;
  loadInstance(instanceId: string): Promise<JourneyInstance | null>;
  updateInstance(instanceId: string, updates: Partial<JourneyInstance>): Promise<void>;
  deleteInstance(instanceId: string): Promise<void>;
  listInstances(filters?: {
    journeyId?: string;
    tenantId?: string;
    status?: ExecutionStatus;
    limit?: number;
    offset?: number;
  }): Promise<JourneyInstance[]>;
  saveCheckpoint(instanceId: string, context: ExecutionContext): Promise<void>;
  loadCheckpoint(instanceId: string): Promise<ExecutionContext | null>;
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export type { JourneyDefinition, StepNode, Transition, ConditionGroup, StepType, StepStatus };
