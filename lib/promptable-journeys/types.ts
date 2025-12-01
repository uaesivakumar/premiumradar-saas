/**
 * Promptable Journeys Types
 * Sprint S49: AI-Enabled Journey Runtime
 *
 * Types for AI-powered journey execution:
 * - AI Step Orchestrator
 * - Auto-Context Provider
 * - AI Decision Nodes
 * - Autonomous Step Execution
 */
import { z } from 'zod';
import type {
  ExecutionContext,
  ExecutionData,
  StepResult,
  StepHandler,
  JourneyEventHandler,
} from '../journey-engine/types';
import type { StepNode } from '../journey-builder/types';

// =============================================================================
// PROMPT TEMPLATE
// =============================================================================

/**
 * Versioned prompt template for deterministic AI execution
 */
export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number(),

  // Template content with variable placeholders
  systemPrompt: z.string(),
  userPrompt: z.string(),

  // Variables that can be injected
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
    required: z.boolean().default(true),
    default: z.unknown().optional(),
    description: z.string().optional(),
  })).default([]),

  // Output schema for structured responses
  outputSchema: z.record(z.string(), z.unknown()).optional(),

  // Model preferences
  modelPreference: z.enum(['fast', 'balanced', 'quality']).default('balanced'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().default(2048),

  // Metadata
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

// =============================================================================
// AI STEP CONFIGURATION
// =============================================================================

/**
 * Configuration for an AI-executed step
 */
export const AIStepConfigSchema = z.object({
  // Template reference
  templateId: z.string(),
  templateVersion: z.number().optional(), // If not specified, use latest

  // Variable overrides for this step
  variableOverrides: z.record(z.string(), z.unknown()).default({}),

  // Context injection settings
  contextSources: z.array(z.enum([
    'journey_input',     // Original journey input
    'step_outputs',      // Previous step outputs
    'entity_data',       // Current entity being processed
    'variables',         // Journey variables
    'evidence',          // OS evidence data
    'object_intel',      // OS object intelligence
  ])).default(['journey_input', 'step_outputs']),

  // Execution settings
  requiresCheckpoint: z.boolean().default(false), // Require human checkpoint
  cacheable: z.boolean().default(true), // Can cache results
  cacheKeyFields: z.array(z.string()).default([]), // Fields to include in cache key

  // Fallback behavior
  fallbackOnError: z.enum(['skip', 'retry', 'fail', 'manual_review']).default('retry'),
  maxRetries: z.number().default(3),
});
export type AIStepConfig = z.infer<typeof AIStepConfigSchema>;

// =============================================================================
// AI DECISION NODE
// =============================================================================

/**
 * Configuration for an AI decision (branching) node
 */
export const AIDecisionConfigSchema = z.object({
  // Decision prompt template
  templateId: z.string(),
  templateVersion: z.number().optional(),

  // Possible outcomes that must match transition conditions
  outcomes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    transitionId: z.string(), // Maps to which transition to take
  })),

  // Determinism settings
  enforceOutcome: z.boolean().default(true), // Must select from outcomes
  defaultOutcome: z.string().optional(), // Fallback if AI output doesn't match
  confidenceThreshold: z.number().min(0).max(1).default(0.7), // Min confidence

  // Context for decision
  contextSources: z.array(z.string()).default(['step_outputs', 'entity_data']),

  // Audit trail
  logReasoning: z.boolean().default(true), // Log AI's reasoning
});
export type AIDecisionConfig = z.infer<typeof AIDecisionConfigSchema>;

// =============================================================================
// AUTONOMOUS STEP CONFIGURATION
// =============================================================================

/**
 * Configuration for autonomous (S67-S70) integrated steps
 */
export const AutonomousStepConfigSchema = z.object({
  // Which autonomous capability to invoke
  capability: z.enum([
    'auto_discovery',   // S67: Auto-Discovery Engine
    'auto_outreach',    // S68: Auto-Outreach Engine
    'self_tuning',      // S69: ML Self-Tuning
    'performance',      // S70: Autonomous Observability
  ]),

  // Capability-specific config
  discoveryConfig: z.object({
    targetType: z.string().optional(),
    qualityThreshold: z.number().min(0).max(1).default(0.6),
    maxResults: z.number().default(100),
  }).optional(),

  outreachConfig: z.object({
    channel: z.enum(['email', 'linkedin', 'phone']).optional(),
    sequenceId: z.string().optional(),
    sendTimeOptimization: z.boolean().default(true),
  }).optional(),

  tuningConfig: z.object({
    signalType: z.string().optional(),
    feedbackType: z.enum(['win', 'loss', 'neutral']).optional(),
  }).optional(),

  metricsConfig: z.object({
    metricTypes: z.array(z.string()).default(['cost', 'performance', 'conversion']),
    aggregation: z.enum(['sum', 'avg', 'max', 'min']).default('sum'),
  }).optional(),

  // Safety settings (routes through autonomousSafety S66)
  requiresCheckpoint: z.boolean().default(true),
  maxExecutionTimeMs: z.number().default(300000), // 5 minutes

  // Metrics tracking (flows to autonomousMetrics S70)
  trackMetrics: z.boolean().default(true),
  metricTags: z.array(z.string()).default([]),
});
export type AutonomousStepConfig = z.infer<typeof AutonomousStepConfigSchema>;

// =============================================================================
// CONTEXT PROVIDER
// =============================================================================

/**
 * Context source definition for auto-injection
 */
export const ContextSourceSchema = z.object({
  id: z.string(),
  type: z.enum([
    'static',           // Static value
    'journey_data',     // From journey context
    'os_api',           // From OS API call
    'expression',       // Computed expression
  ]),

  // Source-specific config
  staticValue: z.unknown().optional(),
  dataPath: z.string().optional(), // JSON path for journey_data
  osEndpoint: z.string().optional(), // OS API endpoint
  osParams: z.record(z.string(), z.unknown()).optional(),
  expression: z.string().optional(), // Template expression

  // Transform the result
  transform: z.enum(['none', 'json', 'string', 'number', 'boolean']).default('none'),

  // Caching
  cacheTtlMs: z.number().optional(),
});
export type ContextSource = z.infer<typeof ContextSourceSchema>;

/**
 * Auto-context provider configuration
 */
export const AutoContextConfigSchema = z.object({
  // Context sources to include
  sources: z.array(ContextSourceSchema),

  // How to merge multiple sources
  mergeStrategy: z.enum(['shallow', 'deep', 'replace']).default('deep'),

  // Maximum context size (tokens)
  maxContextTokens: z.number().default(4000),

  // Truncation strategy if too large
  truncateStrategy: z.enum(['start', 'end', 'middle', 'summarize']).default('end'),
});
export type AutoContextConfig = z.infer<typeof AutoContextConfigSchema>;

// =============================================================================
// AI EXECUTION RESULT
// =============================================================================

/**
 * Result from an AI step execution
 */
export const AIExecutionResultSchema = z.object({
  // Original step result
  stepResult: z.unknown(), // StepResult - avoid circular import

  // AI-specific data
  promptUsed: z.object({
    system: z.string(),
    user: z.string(),
    variables: z.record(z.string(), z.unknown()),
  }),

  // Model response
  modelResponse: z.object({
    content: z.string(),
    parsed: z.unknown().optional(), // Structured output if schema provided
    tokensUsed: z.number(),
    modelId: z.string(),
    durationMs: z.number(),
  }),

  // For decision nodes
  decision: z.object({
    selectedOutcome: z.string(),
    confidence: z.number(),
    reasoning: z.string().optional(),
  }).optional(),

  // Checkpoint info (if required)
  checkpoint: z.object({
    id: z.string(),
    approved: z.boolean().optional(),
    approvedBy: z.string().optional(),
    approvedAt: z.date().optional(),
  }).optional(),

  // Metrics (for S70 tracking)
  metrics: z.object({
    costUsd: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    latencyMs: z.number(),
  }),
});
export type AIExecutionResult = z.infer<typeof AIExecutionResultSchema>;

// =============================================================================
// CHECKPOINT (Safety/Human-in-the-Loop)
// =============================================================================

/**
 * Checkpoint for human approval before AI execution
 */
export const CheckpointSchema = z.object({
  id: z.string().uuid(),
  instanceId: z.string().uuid(), // Journey instance
  stepId: z.string(),

  // State
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),

  // Context for reviewer
  previewData: z.object({
    stepType: z.string(),
    input: z.record(z.string(), z.unknown()),
    promptPreview: z.string().optional(),
    estimatedCost: z.number().optional(),
    riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  }),

  // Resolution
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  resolution: z.string().optional(), // Reason for approval/rejection

  // Expiry
  expiresAt: z.date(),

  // Timestamps
  createdAt: z.date(),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;

// =============================================================================
// ORCHESTRATOR OPTIONS
// =============================================================================

/**
 * Options for the AI Step Orchestrator
 */
export interface AIStepOrchestratorOptions {
  // OS Client for API calls
  osBaseUrl?: string;
  osApiKey?: string;

  // Template storage
  templateStore?: PromptTemplateStore;

  // Checkpoint handling
  checkpointStore?: CheckpointStore;
  checkpointTimeoutMs?: number;

  // Metrics callback (for S70)
  onMetrics?: (metrics: AIExecutionResult['metrics'], stepId: string) => void | Promise<void>;

  // Safety callback (for S66)
  onCheckpointRequired?: (checkpoint: Checkpoint) => void | Promise<void>;

  // Event handlers
  eventHandlers?: JourneyEventHandler[];

  // Logging
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// =============================================================================
// STORAGE INTERFACES
// =============================================================================

/**
 * Store for prompt templates
 */
export interface PromptTemplateStore {
  getTemplate(id: string, version?: number): Promise<PromptTemplate | null>;
  saveTemplate(template: PromptTemplate): Promise<void>;
  listTemplates(filters?: {
    category?: string;
    tags?: string[];
  }): Promise<PromptTemplate[]>;
  getLatestVersion(id: string): Promise<number>;
}

/**
 * Store for checkpoints
 */
export interface CheckpointStore {
  createCheckpoint(checkpoint: Checkpoint): Promise<void>;
  getCheckpoint(id: string): Promise<Checkpoint | null>;
  updateCheckpoint(id: string, updates: Partial<Checkpoint>): Promise<void>;
  listPendingCheckpoints(instanceId?: string): Promise<Checkpoint[]>;
  expireOldCheckpoints(): Promise<number>;
}

// =============================================================================
// AI STEP HANDLER SIGNATURE
// =============================================================================

/**
 * Extended step handler for AI-powered steps
 */
export type AIStepHandler = (
  step: StepNode,
  context: ExecutionContext,
  data: ExecutionData,
  aiConfig: AIStepConfig | AIDecisionConfig | AutonomousStepConfig
) => Promise<AIExecutionResult>;

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  ExecutionContext,
  ExecutionData,
  StepResult,
  StepHandler,
  JourneyEventHandler,
  StepNode,
};
