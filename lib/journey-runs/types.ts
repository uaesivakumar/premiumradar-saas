/**
 * Journey Run Types
 * Sprint S50: Journey Execution Viewer
 *
 * TypeScript types for journey run history, step logs,
 * AI execution, context snapshots, and error tracking.
 */
import { z } from 'zod';

// =============================================================================
// ENUMS
// =============================================================================

export const JourneyRunStatusEnum = z.enum([
  'running',
  'success',
  'failed',
  'paused',
  'cancelled',
]);
export type JourneyRunStatus = z.infer<typeof JourneyRunStatusEnum>;

export const JourneyRunTriggerEnum = z.enum([
  'user',
  'autonomous',
  'api',
  'schedule',
  'webhook',
]);
export type JourneyRunTrigger = z.infer<typeof JourneyRunTriggerEnum>;

export const StepRunStatusEnum = z.enum([
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'skipped',
  'waiting',
  'timeout',
]);
export type StepRunStatus = z.infer<typeof StepRunStatusEnum>;

export const CheckpointStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
  'expired',
  'skipped',
]);
export type CheckpointStatus = z.infer<typeof CheckpointStatusEnum>;

export const ContextSnapshotTypeEnum = z.enum([
  'start',
  'step',
  'decision',
  'checkpoint',
  'end',
]);
export type ContextSnapshotType = z.infer<typeof ContextSnapshotTypeEnum>;

// =============================================================================
// JOURNEY RUN
// =============================================================================

export const JourneyRunSchema = z.object({
  id: z.string().uuid(),
  journeyId: z.string().uuid(),
  tenantId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),

  // Status
  status: JourneyRunStatusEnum,

  // Timing
  startedAt: z.date(),
  endedAt: z.date().optional(),

  // Trigger
  triggeredBy: JourneyRunTriggerEnum,
  triggerData: z.record(z.string(), z.unknown()).optional(),

  // Entity
  entityId: z.string().uuid().optional(),
  entityType: z.string().optional(),

  // Summary
  summary: z.string().optional(),

  // I/O
  inputData: z.record(z.string(), z.unknown()).optional(),
  outputData: z.record(z.string(), z.unknown()).optional(),

  // Metrics
  totalSteps: z.number().default(0),
  completedSteps: z.number().default(0),
  failedSteps: z.number().default(0),
  skippedSteps: z.number().default(0),
  totalDurationMs: z.number().optional(),
  totalCostMicros: z.number().default(0),
  totalTokens: z.number().default(0),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),

  createdAt: z.date(),
  updatedAt: z.date(),
});
export type JourneyRun = z.infer<typeof JourneyRunSchema>;

// =============================================================================
// JOURNEY RUN STEP
// =============================================================================

export const JourneyRunStepSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string(),
  stepName: z.string().optional(),
  stepType: z.string().optional(),

  // Status
  status: StepRunStatusEnum,

  // Timing
  queuedAt: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  durationMs: z.number().optional(),

  // Decision
  decision: z.record(z.string(), z.unknown()).optional(),
  decisionReason: z.string().optional(),

  // Fallback
  fallbackStrategy: z.string().optional(),
  fallbackTriggered: z.boolean().default(false),
  fallbackStepId: z.string().optional(),

  // Retry
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  lastRetryAt: z.date().optional(),

  // I/O
  inputData: z.record(z.string(), z.unknown()).optional(),
  outputData: z.record(z.string(), z.unknown()).optional(),

  // Order
  executionOrder: z.number().optional(),

  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
});
export type JourneyRunStep = z.infer<typeof JourneyRunStepSchema>;

// =============================================================================
// JOURNEY RUN AI LOG
// =============================================================================

export const JourneyRunAILogSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string(),

  // Template
  templateId: z.string().optional(),
  templateVersion: z.number().optional(),

  // Prompt
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
  promptVariables: z.record(z.string(), z.unknown()).optional(),

  // Response
  response: z.string().optional(),
  responseParsed: z.record(z.string(), z.unknown()).optional(),

  // Model
  modelId: z.string().optional(),
  modelPreference: z.string().optional(),

  // Tokens
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),

  // Cost (micros = millionths of dollar)
  costMicros: z.number().default(0),

  // Latency
  latencyMs: z.number().optional(),

  // Decision (for AI decision nodes)
  selectedOutcome: z.string().optional(),
  confidence: z.number().optional(),
  reasoning: z.string().optional(),

  // Checkpoint
  checkpointRequired: z.boolean().default(false),
  checkpointId: z.string().uuid().optional(),
  checkpointStatus: z.string().optional(),

  createdAt: z.date(),
});
export type JourneyRunAILog = z.infer<typeof JourneyRunAILogSchema>;

// =============================================================================
// JOURNEY RUN CONTEXT SNAPSHOT
// =============================================================================

export const JourneyRunContextSnapshotSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string(),

  snapshotType: ContextSnapshotTypeEnum,
  contextJson: z.record(z.string(), z.unknown()),
  changesFromPrevious: z.record(z.string(), z.unknown()).optional(),
  sourcesIncluded: z.array(z.string()).optional(),
  estimatedTokens: z.number().optional(),

  createdAt: z.date(),
});
export type JourneyRunContextSnapshot = z.infer<typeof JourneyRunContextSnapshotSchema>;

// =============================================================================
// JOURNEY RUN ERROR
// =============================================================================

export const JourneyRunErrorSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string().optional(),

  errorCode: z.string(),
  errorType: z.string().optional(),
  message: z.string(),
  stacktrace: z.string().optional(),

  contextSnapshot: z.record(z.string(), z.unknown()).optional(),

  retryable: z.boolean().default(false),
  recovered: z.boolean().default(false),
  recoveryAction: z.string().optional(),

  createdAt: z.date(),
});
export type JourneyRunError = z.infer<typeof JourneyRunErrorSchema>;

// =============================================================================
// JOURNEY RUN CHECKPOINT
// =============================================================================

export const JourneyRunCheckpointSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string(),

  status: CheckpointStatusEnum,
  checkpointType: z.string().optional(),
  riskLevel: z.string().optional(),
  description: z.string().optional(),

  proposedAction: z.record(z.string(), z.unknown()).optional(),

  reviewedBy: z.string().uuid().optional(),
  reviewedAt: z.date().optional(),
  reviewNotes: z.string().optional(),

  expiresAt: z.date().optional(),
  createdAt: z.date(),
});
export type JourneyRunCheckpoint = z.infer<typeof JourneyRunCheckpointSchema>;

// =============================================================================
// JOURNEY RUN TRANSITION
// =============================================================================

export const JourneyRunTransitionSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),

  transitionId: z.string(),
  fromStepId: z.string(),
  toStepId: z.string(),

  conditionEvaluated: z.record(z.string(), z.unknown()).optional(),
  conditionMet: z.boolean(),
  evaluationReason: z.string().optional(),

  taken: z.boolean().default(false),
  evaluatedAt: z.date(),
});
export type JourneyRunTransition = z.infer<typeof JourneyRunTransitionSchema>;

// =============================================================================
// JOURNEY RUN OS CALL
// =============================================================================

export const JourneyRunOSCallSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  stepId: z.string().optional(),

  endpoint: z.string(),
  method: z.string().default('POST'),
  requestBody: z.record(z.string(), z.unknown()).optional(),

  responseBody: z.record(z.string(), z.unknown()).optional(),
  responseStatus: z.number().optional(),

  latencyMs: z.number().optional(),
  osCapability: z.string().optional(),

  createdAt: z.date(),
});
export type JourneyRunOSCall = z.infer<typeof JourneyRunOSCallSchema>;

// =============================================================================
// COMPOSITE TYPES FOR API RESPONSES
// =============================================================================

/**
 * Summary for run list view
 */
export interface JourneyRunSummary {
  id: string;
  journeyId: string;
  status: JourneyRunStatus;
  triggeredBy: JourneyRunTrigger;
  startedAt: Date;
  endedAt?: Date;
  totalDurationMs?: number;
  completedSteps: number;
  totalSteps: number;
  totalCostMicros: number;
  totalTokens: number;
  summary?: string;
  errorCount: number;
  pendingCheckpoints: number;
}

/**
 * Full run details with all related data
 */
export interface JourneyRunDetails {
  run: JourneyRun;
  steps: JourneyRunStep[];
  aiLogs: JourneyRunAILog[];
  contextSnapshots: JourneyRunContextSnapshot[];
  errors: JourneyRunError[];
  checkpoints: JourneyRunCheckpoint[];
  transitions: JourneyRunTransition[];
  osCalls: JourneyRunOSCall[];
}

/**
 * Step with related AI logs and errors
 */
export interface StepWithDetails {
  step: JourneyRunStep;
  aiLog?: JourneyRunAILog;
  contextSnapshot?: JourneyRunContextSnapshot;
  errors: JourneyRunError[];
  transitions: JourneyRunTransition[];
}

/**
 * AI usage metrics for a run
 */
export interface AIUsageMetrics {
  totalCalls: number;
  totalTokens: number;
  totalCostMicros: number;
  avgLatencyMs: number;
  modelsUsed: string[];
  byModel: Record<string, {
    calls: number;
    tokens: number;
    costMicros: number;
  }>;
}

/**
 * OS intelligence summary for a journey
 */
export interface JourneyIntelligenceSummary {
  priority: number;
  patterns: string[];
  personaEffectiveness: number;
  journeyHealth: number;
  recommendations: string[];
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface ListRunsRequest {
  journeyId: string;
  page?: number;
  limit?: number;
  status?: JourneyRunStatus;
  triggeredBy?: JourneyRunTrigger;
  startedAfter?: Date;
  startedBefore?: Date;
}

export interface ListRunsResponse {
  runs: JourneyRunSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetRunDetailsRequest {
  journeyId: string;
  runId: string;
  includeAILogs?: boolean;
  includeContextSnapshots?: boolean;
  includeOSCalls?: boolean;
}

export interface GetRunDetailsResponse {
  details: JourneyRunDetails;
  aiUsage: AIUsageMetrics;
}

// =============================================================================
// DB ROW TO ENTITY MAPPERS
// =============================================================================

/**
 * Map database row to JourneyRun entity
 */
export function mapRowToJourneyRun(row: Record<string, unknown>): JourneyRun {
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    tenantId: row.tenant_id as string,
    workspaceId: row.workspace_id as string | undefined,
    status: row.status as JourneyRunStatus,
    startedAt: new Date(row.started_at as string),
    endedAt: row.ended_at ? new Date(row.ended_at as string) : undefined,
    triggeredBy: row.triggered_by as JourneyRunTrigger,
    triggerData: row.trigger_data as Record<string, unknown> | undefined,
    entityId: row.entity_id as string | undefined,
    entityType: row.entity_type as string | undefined,
    summary: row.summary as string | undefined,
    inputData: row.input_data as Record<string, unknown> | undefined,
    outputData: row.output_data as Record<string, unknown> | undefined,
    totalSteps: (row.total_steps as number) || 0,
    completedSteps: (row.completed_steps as number) || 0,
    failedSteps: (row.failed_steps as number) || 0,
    skippedSteps: (row.skipped_steps as number) || 0,
    totalDurationMs: row.total_duration_ms as number | undefined,
    totalCostMicros: (row.total_cost_micros as number) || 0,
    totalTokens: (row.total_tokens as number) || 0,
    metadata: (row.metadata as Record<string, unknown>) || {},
    tags: (row.tags as string[]) || [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Map database row to JourneyRunStep entity
 */
export function mapRowToJourneyRunStep(row: Record<string, unknown>): JourneyRunStep {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    stepId: row.step_id as string,
    stepName: row.step_name as string | undefined,
    stepType: row.step_type as string | undefined,
    status: row.status as StepRunStatus,
    queuedAt: row.queued_at ? new Date(row.queued_at as string) : undefined,
    startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    durationMs: row.duration_ms as number | undefined,
    decision: row.decision as Record<string, unknown> | undefined,
    decisionReason: row.decision_reason as string | undefined,
    fallbackStrategy: row.fallback_strategy as string | undefined,
    fallbackTriggered: (row.fallback_triggered as boolean) || false,
    fallbackStepId: row.fallback_step_id as string | undefined,
    retryCount: (row.retry_count as number) || 0,
    maxRetries: (row.max_retries as number) || 3,
    lastRetryAt: row.last_retry_at ? new Date(row.last_retry_at as string) : undefined,
    inputData: row.input_data as Record<string, unknown> | undefined,
    outputData: row.output_data as Record<string, unknown> | undefined,
    executionOrder: row.execution_order as number | undefined,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Map database row to JourneyRunAILog entity
 */
export function mapRowToJourneyRunAILog(row: Record<string, unknown>): JourneyRunAILog {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    stepId: row.step_id as string,
    templateId: row.template_id as string | undefined,
    templateVersion: row.template_version as number | undefined,
    systemPrompt: row.system_prompt as string | undefined,
    userPrompt: row.user_prompt as string | undefined,
    promptVariables: row.prompt_variables as Record<string, unknown> | undefined,
    response: row.response as string | undefined,
    responseParsed: row.response_parsed as Record<string, unknown> | undefined,
    modelId: row.model_id as string | undefined,
    modelPreference: row.model_preference as string | undefined,
    inputTokens: row.input_tokens as number | undefined,
    outputTokens: row.output_tokens as number | undefined,
    totalTokens: row.total_tokens as number | undefined,
    costMicros: (row.cost_micros as number) || 0,
    latencyMs: row.latency_ms as number | undefined,
    selectedOutcome: row.selected_outcome as string | undefined,
    confidence: row.confidence as number | undefined,
    reasoning: row.reasoning as string | undefined,
    checkpointRequired: (row.checkpoint_required as boolean) || false,
    checkpointId: row.checkpoint_id as string | undefined,
    checkpointStatus: row.checkpoint_status as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Map database row to JourneyRunError entity
 */
export function mapRowToJourneyRunError(row: Record<string, unknown>): JourneyRunError {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    stepId: row.step_id as string | undefined,
    errorCode: row.error_code as string,
    errorType: row.error_type as string | undefined,
    message: row.message as string,
    stacktrace: row.stacktrace as string | undefined,
    contextSnapshot: row.context_snapshot as Record<string, unknown> | undefined,
    retryable: (row.retryable as boolean) || false,
    recovered: (row.recovered as boolean) || false,
    recoveryAction: row.recovery_action as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Map database row to JourneyRunCheckpoint entity
 */
export function mapRowToJourneyRunCheckpoint(row: Record<string, unknown>): JourneyRunCheckpoint {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    stepId: row.step_id as string,
    status: row.status as CheckpointStatus,
    checkpointType: row.checkpoint_type as string | undefined,
    riskLevel: row.risk_level as string | undefined,
    description: row.description as string | undefined,
    proposedAction: row.proposed_action as Record<string, unknown> | undefined,
    reviewedBy: row.reviewed_by as string | undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at as string) : undefined,
    reviewNotes: row.review_notes as string | undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Map database row to JourneyRunContextSnapshot entity
 */
export function mapRowToJourneyRunContextSnapshot(
  row: Record<string, unknown>
): JourneyRunContextSnapshot {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    stepId: row.step_id as string,
    snapshotType: row.snapshot_type as ContextSnapshotType,
    contextJson: row.context_json as Record<string, unknown>,
    changesFromPrevious: row.changes_from_previous as Record<string, unknown> | undefined,
    sourcesIncluded: row.sources_included as string[] | undefined,
    estimatedTokens: row.estimated_tokens as number | undefined,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Map database row to JourneyRunTransition entity
 */
export function mapRowToJourneyRunTransition(row: Record<string, unknown>): JourneyRunTransition {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    transitionId: row.transition_id as string,
    fromStepId: row.from_step_id as string,
    toStepId: row.to_step_id as string,
    conditionEvaluated: row.condition_evaluated as Record<string, unknown> | undefined,
    conditionMet: row.condition_met as boolean,
    evaluationReason: row.evaluation_reason as string | undefined,
    taken: (row.taken as boolean) || false,
    evaluatedAt: new Date(row.evaluated_at as string),
  };
}

/**
 * Map database row to JourneyRunOSCall entity
 */
export function mapRowToJourneyRunOSCall(row: Record<string, unknown>): JourneyRunOSCall {
  return {
    id: row.id as string,
    runId: row.run_id as string,
    stepId: row.step_id as string | undefined,
    endpoint: row.endpoint as string,
    method: (row.method as string) || 'POST',
    requestBody: row.request_body as Record<string, unknown> | undefined,
    responseBody: row.response_body as Record<string, unknown> | undefined,
    responseStatus: row.response_status as number | undefined,
    latencyMs: row.latency_ms as number | undefined,
    osCapability: row.os_capability as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}
