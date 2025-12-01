/**
 * Journey Replay Types
 * Sprint S52: Replay Engine
 *
 * Types for deterministic journey replay without LLM calls.
 * Replays are faithful reconstructions using stored data only.
 */
import { z } from 'zod';
import type {
  JourneyRun,
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunContextSnapshot,
  JourneyRunError,
  JourneyRunTransition,
  JourneyRunCheckpoint,
  JourneyRunOSCall,
  JourneyRunDetails,
} from '@/lib/journey-runs';
import type { TimelineItem, ContextDiffEntry } from '@/lib/timeline-viewer';

// =============================================================================
// REPLAY CONFIG
// =============================================================================

export const ReplaySpeedEnum = z.enum(['0.25x', '0.5x', '1x', '2x', '4x', 'instant']);
export type ReplaySpeed = z.infer<typeof ReplaySpeedEnum>;

export const REPLAY_SPEED_MULTIPLIERS: Record<ReplaySpeed, number> = {
  '0.25x': 0.25,
  '0.5x': 0.5,
  '1x': 1,
  '2x': 2,
  '4x': 4,
  'instant': Infinity,
};

export const ReplayModeEnum = z.enum(['full', 'step-by-step', 'to-step', 'from-step']);
export type ReplayMode = z.infer<typeof ReplayModeEnum>;

export const ReplayConfigSchema = z.object({
  speed: ReplaySpeedEnum.default('1x'),
  mode: ReplayModeEnum.default('full'),
  stopAtStep: z.string().optional(),
  startFromStep: z.string().optional(),
  includeMetrics: z.boolean().default(true),
  includeContextDiffs: z.boolean().default(true),
  includeAILogs: z.boolean().default(true),
  loopEnabled: z.boolean().default(false),
  autoPlay: z.boolean().default(false),
});
export type ReplayConfig = z.infer<typeof ReplayConfigSchema>;

export const DEFAULT_REPLAY_CONFIG: ReplayConfig = {
  speed: '1x',
  mode: 'full',
  includeMetrics: true,
  includeContextDiffs: true,
  includeAILogs: true,
  loopEnabled: false,
  autoPlay: false,
};

// =============================================================================
// REPLAY STATE
// =============================================================================

export const ReplayStatusEnum = z.enum([
  'idle',
  'loading',
  'ready',
  'playing',
  'paused',
  'stepping',
  'completed',
  'error',
]);
export type ReplayStatus = z.infer<typeof ReplayStatusEnum>;

export interface ReplayState {
  status: ReplayStatus;
  runId: string;
  config: ReplayConfig;

  // Current position
  currentStepIndex: number;
  currentEventIndex: number;
  currentTimeMs: number;

  // Total
  totalSteps: number;
  totalEvents: number;
  totalDurationMs: number;

  // Progress
  progress: number; // 0-100

  // Error if any
  error?: string;
}

export const DEFAULT_REPLAY_STATE: Omit<ReplayState, 'runId'> = {
  status: 'idle',
  config: DEFAULT_REPLAY_CONFIG,
  currentStepIndex: 0,
  currentEventIndex: 0,
  currentTimeMs: 0,
  totalSteps: 0,
  totalEvents: 0,
  totalDurationMs: 0,
  progress: 0,
};

// =============================================================================
// REPLAY EVENT TYPES
// =============================================================================

export const ReplayEventTypeEnum = z.enum([
  // Journey lifecycle
  'journey:start',
  'journey:complete',
  'journey:fail',

  // Step lifecycle
  'step:queue',
  'step:start',
  'step:complete',
  'step:fail',
  'step:skip',
  'step:retry',

  // Transitions
  'transition:evaluate',
  'transition:take',

  // AI execution
  'ai:prompt',
  'ai:response',
  'ai:decision',

  // Fallback
  'fallback:trigger',
  'fallback:execute',

  // Context
  'context:snapshot',
  'context:change',

  // Checkpoint
  'checkpoint:require',
  'checkpoint:resolve',

  // OS calls
  'os:call',
  'os:response',

  // Errors
  'error:occur',
  'error:recover',
]);
export type ReplayEventType = z.infer<typeof ReplayEventTypeEnum>;

// =============================================================================
// REPLAY EVENT
// =============================================================================

export interface ReplayEventBase {
  id: string;
  type: ReplayEventType;
  timestamp: number; // ms from journey start
  absoluteTime: Date;
  stepId?: string;
  stepIndex?: number;
}

export interface JourneyStartEvent extends ReplayEventBase {
  type: 'journey:start';
  data: {
    runId: string;
    journeyId: string;
    triggeredBy: string;
    inputData: Record<string, unknown>;
  };
}

export interface JourneyCompleteEvent extends ReplayEventBase {
  type: 'journey:complete';
  data: {
    status: string;
    outputData: Record<string, unknown>;
    durationMs: number;
  };
}

export interface JourneyFailEvent extends ReplayEventBase {
  type: 'journey:fail';
  data: {
    error: JourneyRunError;
  };
}

export interface StepQueueEvent extends ReplayEventBase {
  type: 'step:queue';
  stepId: string;
  data: {
    stepName: string;
    stepType: string;
    executionOrder: number;
  };
}

export interface StepStartEvent extends ReplayEventBase {
  type: 'step:start';
  stepId: string;
  data: {
    stepName: string;
    stepType: string;
    inputData: Record<string, unknown>;
  };
}

export interface StepCompleteEvent extends ReplayEventBase {
  type: 'step:complete';
  stepId: string;
  data: {
    stepName: string;
    outputData: Record<string, unknown>;
    durationMs: number;
  };
}

export interface StepFailEvent extends ReplayEventBase {
  type: 'step:fail';
  stepId: string;
  data: {
    stepName: string;
    error: JourneyRunError;
    retryCount: number;
  };
}

export interface StepSkipEvent extends ReplayEventBase {
  type: 'step:skip';
  stepId: string;
  data: {
    stepName: string;
    reason: string;
  };
}

export interface StepRetryEvent extends ReplayEventBase {
  type: 'step:retry';
  stepId: string;
  data: {
    stepName: string;
    attempt: number;
    maxRetries: number;
  };
}

export interface TransitionEvaluateEvent extends ReplayEventBase {
  type: 'transition:evaluate';
  data: {
    transition: JourneyRunTransition;
    conditionMet: boolean;
    reason?: string;
  };
}

export interface TransitionTakeEvent extends ReplayEventBase {
  type: 'transition:take';
  data: {
    fromStepId: string;
    toStepId: string;
    transition: JourneyRunTransition;
  };
}

export interface AIPromptEvent extends ReplayEventBase {
  type: 'ai:prompt';
  stepId: string;
  data: {
    systemPrompt?: string;
    userPrompt?: string;
    modelId?: string;
    variables: Record<string, unknown>;
  };
}

export interface AIResponseEvent extends ReplayEventBase {
  type: 'ai:response';
  stepId: string;
  data: {
    response: string;
    responseParsed?: Record<string, unknown>;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    latencyMs: number;
    costMicros: number;
  };
}

export interface AIDecisionEvent extends ReplayEventBase {
  type: 'ai:decision';
  stepId: string;
  data: {
    selectedOutcome: string;
    confidence: number;
    reasoning: string;
    alternatives?: string[];
  };
}

export interface FallbackTriggerEvent extends ReplayEventBase {
  type: 'fallback:trigger';
  stepId: string;
  data: {
    strategy: string;
    reason: string;
  };
}

export interface FallbackExecuteEvent extends ReplayEventBase {
  type: 'fallback:execute';
  stepId: string;
  data: {
    fallbackStepId: string;
    success: boolean;
  };
}

export interface ContextSnapshotEvent extends ReplayEventBase {
  type: 'context:snapshot';
  stepId: string;
  data: {
    snapshot: JourneyRunContextSnapshot;
    estimatedTokens: number;
  };
}

export interface ContextChangeEvent extends ReplayEventBase {
  type: 'context:change';
  stepId: string;
  data: {
    changes: ContextDiffEntry[];
    addedKeys: string[];
    removedKeys: string[];
    changedKeys: string[];
  };
}

export interface CheckpointRequireEvent extends ReplayEventBase {
  type: 'checkpoint:require';
  stepId: string;
  data: {
    checkpoint: JourneyRunCheckpoint;
    riskLevel: string;
    description: string;
  };
}

export interface CheckpointResolveEvent extends ReplayEventBase {
  type: 'checkpoint:resolve';
  stepId: string;
  data: {
    checkpoint: JourneyRunCheckpoint;
    status: string;
    reviewedBy?: string;
    reviewNotes?: string;
  };
}

export interface OSCallEvent extends ReplayEventBase {
  type: 'os:call';
  stepId?: string;
  data: {
    endpoint: string;
    method: string;
    requestBody: Record<string, unknown>;
    capability?: string;
  };
}

export interface OSResponseEvent extends ReplayEventBase {
  type: 'os:response';
  stepId?: string;
  data: {
    endpoint: string;
    responseBody: Record<string, unknown>;
    responseStatus: number;
    latencyMs: number;
  };
}

export interface ErrorOccurEvent extends ReplayEventBase {
  type: 'error:occur';
  stepId?: string;
  data: {
    error: JourneyRunError;
  };
}

export interface ErrorRecoverEvent extends ReplayEventBase {
  type: 'error:recover';
  stepId?: string;
  data: {
    error: JourneyRunError;
    recoveryAction: string;
  };
}

export type ReplayEvent =
  | JourneyStartEvent
  | JourneyCompleteEvent
  | JourneyFailEvent
  | StepQueueEvent
  | StepStartEvent
  | StepCompleteEvent
  | StepFailEvent
  | StepSkipEvent
  | StepRetryEvent
  | TransitionEvaluateEvent
  | TransitionTakeEvent
  | AIPromptEvent
  | AIResponseEvent
  | AIDecisionEvent
  | FallbackTriggerEvent
  | FallbackExecuteEvent
  | ContextSnapshotEvent
  | ContextChangeEvent
  | CheckpointRequireEvent
  | CheckpointResolveEvent
  | OSCallEvent
  | OSResponseEvent
  | ErrorOccurEvent
  | ErrorRecoverEvent;

// =============================================================================
// REPLAY STEP (aggregated view)
// =============================================================================

export interface ReplayStep {
  id: string;
  stepId: string;
  stepName: string;
  stepType: string;
  status: string;

  // Timing
  startTime: number;
  endTime: number;
  durationMs: number;

  // Events for this step
  events: ReplayEvent[];

  // AI data (if any)
  aiLog?: JourneyRunAILog;

  // Context
  contextBefore?: Record<string, unknown>;
  contextAfter?: Record<string, unknown>;
  contextDiff?: ContextDiffEntry[];

  // Transitions
  incomingTransitions: JourneyRunTransition[];
  outgoingTransitions: JourneyRunTransition[];

  // Errors
  errors: JourneyRunError[];

  // Fallback
  fallbackTriggered: boolean;
  fallbackStrategy?: string;

  // Metrics
  tokens?: number;
  costMicros?: number;

  // Original data
  originalStep: JourneyRunStep;
}

// =============================================================================
// REPLAY TIMELINE
// =============================================================================

export interface ReplayTimeline {
  runId: string;
  journeyId: string;
  totalDurationMs: number;
  startTime: Date;
  endTime?: Date;

  // Steps in order
  steps: ReplayStep[];

  // All events in order
  events: ReplayEvent[];

  // Metrics
  metrics: {
    totalSteps: number;
    completedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    totalTokens: number;
    totalCostMicros: number;
    totalOSCalls: number;
    totalFallbacks: number;
    totalCheckpoints: number;
    totalErrors: number;
    avgStepDurationMs: number;
  };

  // Branches (for visualization)
  branches: ReplayBranch[];
}

export interface ReplayBranch {
  id: string;
  fromStepId: string;
  toStepId: string;
  condition?: string;
  taken: boolean;
}

// =============================================================================
// REPLAY SUMMARY
// =============================================================================

export interface ReplaySummary {
  runId: string;
  journeyId: string;
  journeyName?: string;
  status: string;

  // Timing
  startedAt: Date;
  endedAt?: Date;
  totalDurationMs: number;

  // Counts
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  retryCount: number;

  // AI
  aiCalls: number;
  totalTokens: number;
  totalCostMicros: number;
  modelsUsed: string[];

  // Decision points
  decisionPoints: number;
  branchesTaken: number;

  // Fallbacks
  fallbacksTriggered: number;
  fallbacksSucceeded: number;

  // Checkpoints
  checkpointsRequired: number;
  checkpointsApproved: number;
  checkpointsRejected: number;

  // OS
  osCalls: number;
  osCallsSucceeded: number;

  // Errors
  errorCount: number;
  recoveredErrors: number;
}

// =============================================================================
// REPLAY CALLBACKS
// =============================================================================

export interface ReplayCallbacks {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onPause?: () => void;
  onResume?: () => void;

  onStepStart?: (step: ReplayStep) => void;
  onStepEnd?: (step: ReplayStep) => void;
  onStepError?: (step: ReplayStep, error: JourneyRunError) => void;

  onEvent?: (event: ReplayEvent) => void;
  onDecision?: (event: AIDecisionEvent) => void;
  onFallback?: (event: FallbackTriggerEvent) => void;
  onContextChange?: (event: ContextChangeEvent) => void;

  onProgress?: (progress: number, currentStep: number, totalSteps: number) => void;
  onTimeUpdate?: (currentTimeMs: number) => void;
}

// =============================================================================
// API REQUEST/RESPONSE
// =============================================================================

export interface StartReplayRequest {
  runId: string;
  config?: Partial<ReplayConfig>;
}

export interface StartReplayResponse {
  success: boolean;
  timeline: ReplayTimeline;
  events: ReplayEvent[];
  error?: string;
}

export interface GetReplaySummaryRequest {
  runId: string;
}

export interface GetReplaySummaryResponse {
  success: boolean;
  summary: ReplaySummary;
  error?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get speed multiplier from ReplaySpeed
 */
export function getSpeedMultiplier(speed: ReplaySpeed): number {
  return REPLAY_SPEED_MULTIPLIERS[speed];
}

/**
 * Calculate simulated delay based on real duration and replay speed
 */
export function calculateSimulatedDelay(realDurationMs: number, speed: ReplaySpeed): number {
  const multiplier = getSpeedMultiplier(speed);
  if (multiplier === Infinity) return 0;
  return Math.round(realDurationMs / multiplier);
}

/**
 * Format replay time for display
 */
export function formatReplayTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get event icon based on type
 */
export function getEventIcon(type: ReplayEventType): string {
  const icons: Record<ReplayEventType, string> = {
    'journey:start': '🚀',
    'journey:complete': '✅',
    'journey:fail': '❌',
    'step:queue': '📋',
    'step:start': '▶️',
    'step:complete': '✓',
    'step:fail': '✗',
    'step:skip': '⏭️',
    'step:retry': '🔄',
    'transition:evaluate': '🔀',
    'transition:take': '➡️',
    'ai:prompt': '💬',
    'ai:response': '🤖',
    'ai:decision': '🎯',
    'fallback:trigger': '⚠️',
    'fallback:execute': '🔧',
    'context:snapshot': '📸',
    'context:change': '📝',
    'checkpoint:require': '⏸️',
    'checkpoint:resolve': '✔️',
    'os:call': '📡',
    'os:response': '📨',
    'error:occur': '🔴',
    'error:recover': '🟢',
  };
  return icons[type] || '•';
}

/**
 * Get event category for grouping
 */
export function getEventCategory(type: ReplayEventType): string {
  if (type.startsWith('journey:')) return 'journey';
  if (type.startsWith('step:')) return 'step';
  if (type.startsWith('transition:')) return 'transition';
  if (type.startsWith('ai:')) return 'ai';
  if (type.startsWith('fallback:')) return 'fallback';
  if (type.startsWith('context:')) return 'context';
  if (type.startsWith('checkpoint:')) return 'checkpoint';
  if (type.startsWith('os:')) return 'os';
  if (type.startsWith('error:')) return 'error';
  return 'other';
}
