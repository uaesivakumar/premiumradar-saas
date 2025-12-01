/**
 * Journey Engine Fallback
 * Sprint S48: Journey Fallback Logic
 *
 * Fallback strategies and recovery:
 * - Strategy execution
 * - Rollback support
 * - Manual review queuing
 * - Notification triggers
 */
import type { StepNode } from '../journey-builder/types';
import type {
  ExecutionContext,
  StateNode,
  FallbackStrategy,
  FallbackConfig,
  StepResult,
  JourneyEvent,
} from './types';
import { JourneyError } from './types';

// =============================================================================
// FALLBACK EXECUTOR
// =============================================================================

/**
 * Result of fallback execution
 */
export interface FallbackResult {
  success: boolean;
  strategy: FallbackStrategy;
  action: string;
  stepResult?: StepResult;
  shouldContinue: boolean;
  shouldPause: boolean;
  shouldFail: boolean;
  message?: string;
  rollbackPerformed?: boolean;
}

/**
 * Execute a fallback strategy
 */
export async function executeFallback(
  strategy: FallbackStrategy,
  config: FallbackConfig,
  step: StepNode,
  node: StateNode,
  context: ExecutionContext,
  error: JourneyError
): Promise<FallbackResult> {
  const executor = fallbackExecutors[strategy];
  if (!executor) {
    return {
      success: false,
      strategy,
      action: 'unknown',
      shouldContinue: false,
      shouldPause: false,
      shouldFail: true,
      message: `Unknown fallback strategy: ${strategy}`,
    };
  }

  try {
    return await executor(config, step, node, context, error);
  } catch (fallbackError) {
    return {
      success: false,
      strategy,
      action: 'fallback_failed',
      shouldContinue: false,
      shouldPause: false,
      shouldFail: true,
      message: `Fallback execution failed: ${(fallbackError as Error).message}`,
    };
  }
}

// =============================================================================
// FALLBACK EXECUTORS
// =============================================================================

type FallbackExecutor = (
  config: FallbackConfig,
  step: StepNode,
  node: StateNode,
  context: ExecutionContext,
  error: JourneyError
) => Promise<FallbackResult>;

const fallbackExecutors: Record<FallbackStrategy, FallbackExecutor> = {
  /**
   * Skip the failed step and continue
   */
  skip: async (_config, step, node, _context, error) => {
    node.status = 'skipped';
    node.completedAt = new Date();

    return {
      success: true,
      strategy: 'skip',
      action: 'step_skipped',
      stepResult: {
        stepId: step.id,
        status: 'skipped',
        startedAt: node.startedAt ?? new Date(),
        completedAt: new Date(),
        durationMs: node.startedAt
          ? Date.now() - node.startedAt.getTime()
          : 0,
        error: {
          code: error.code,
          message: error.message,
          retryable: false,
        },
        logs: [
          {
            level: 'warn',
            message: `Step skipped due to error: ${error.message}`,
            timestamp: new Date(),
          },
        ],
      },
      shouldContinue: true,
      shouldPause: false,
      shouldFail: false,
      message: `Step ${step.id} skipped: ${error.message}`,
    };
  },

  /**
   * Retry the step
   */
  retry: async (config, step, node, _context, error) => {
    const maxRetries = config.maxRetries ?? 3;
    const retryDelayMs = config.retryDelayMs ?? 1000;
    const backoffMultiplier = config.retryBackoffMultiplier ?? 2;

    if (node.retryCount >= maxRetries) {
      return {
        success: false,
        strategy: 'retry',
        action: 'retry_exhausted',
        shouldContinue: false,
        shouldPause: false,
        shouldFail: true,
        message: `Max retries (${maxRetries}) exhausted for step ${step.id}`,
      };
    }

    // Calculate delay with backoff
    const delay = retryDelayMs * Math.pow(backoffMultiplier, node.retryCount);

    // Wait for delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    node.retryCount++;
    node.lastRetryAt = new Date();
    node.status = 'queued';

    return {
      success: true,
      strategy: 'retry',
      action: 'retry_scheduled',
      shouldContinue: true, // Will retry in main loop
      shouldPause: false,
      shouldFail: false,
      message: `Retry ${node.retryCount}/${maxRetries} for step ${step.id} after ${delay}ms`,
    };
  },

  /**
   * Execute a fallback step
   */
  fallback_step: async (config, step, node, context, error) => {
    const fallbackStepId = config.fallbackStepId;
    if (!fallbackStepId) {
      return {
        success: false,
        strategy: 'fallback_step',
        action: 'no_fallback_configured',
        shouldContinue: false,
        shouldPause: false,
        shouldFail: true,
        message: 'No fallback step configured',
      };
    }

    // Find fallback node
    const fallbackNode = context.graph.nodes.find(
      (n) => n.stepId === fallbackStepId
    );

    if (!fallbackNode) {
      return {
        success: false,
        strategy: 'fallback_step',
        action: 'fallback_not_found',
        shouldContinue: false,
        shouldPause: false,
        shouldFail: true,
        message: `Fallback step ${fallbackStepId} not found`,
      };
    }

    // Mark original as failed
    node.status = 'failed';
    node.completedAt = new Date();
    node.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };

    // Queue fallback node
    fallbackNode.status = 'queued';
    fallbackNode.queuedAt = new Date();
    context.graph.currentNodeIds = [fallbackNode.id];

    return {
      success: true,
      strategy: 'fallback_step',
      action: 'fallback_queued',
      shouldContinue: true,
      shouldPause: false,
      shouldFail: false,
      message: `Fallback step ${fallbackStepId} queued for execution`,
    };
  },

  /**
   * Mark for manual review and pause
   */
  manual_review: async (config, step, node, context, error) => {
    node.status = 'waiting';
    context.status = 'paused';
    context.pausedAt = new Date();
    context.pauseReason = `Manual review required: ${error.message}`;

    // Add to manual review queue (in metadata)
    const reviewQueue = (context.metadata.manualReviewQueue as Array<{
      stepId: string;
      error: string;
      queuedAt: Date;
    }>) ?? [];

    reviewQueue.push({
      stepId: step.id,
      error: error.message,
      queuedAt: new Date(),
    });

    context.metadata.manualReviewQueue = reviewQueue;

    // Trigger notification if configured
    if (config.notifyOnFallback && config.notificationChannels) {
      await sendNotifications(config.notificationChannels, {
        type: 'manual_review_required',
        instanceId: context.instanceId,
        journeyId: context.journeyId,
        stepId: step.id,
        error: error.message,
      });
    }

    return {
      success: true,
      strategy: 'manual_review',
      action: 'queued_for_review',
      shouldContinue: false,
      shouldPause: true,
      shouldFail: false,
      message: `Step ${step.id} queued for manual review`,
    };
  },

  /**
   * Fail the entire journey
   */
  fail: async (_config, step, node, context, error) => {
    node.status = 'failed';
    node.completedAt = new Date();
    node.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };

    context.status = 'failed';
    context.completedAt = new Date();

    return {
      success: true,
      strategy: 'fail',
      action: 'journey_failed',
      shouldContinue: false,
      shouldPause: false,
      shouldFail: true,
      message: `Journey failed at step ${step.id}: ${error.message}`,
    };
  },

  /**
   * Rollback to previous state
   */
  rollback: async (_config, step, node, context, error) => {
    // Find the last successful checkpoint
    const completedNodes = context.graph.nodes.filter(
      (n) => n.status === 'completed' && n.id !== node.id
    );

    if (completedNodes.length === 0) {
      // Nothing to rollback to
      return {
        success: false,
        strategy: 'rollback',
        action: 'no_checkpoint',
        shouldContinue: false,
        shouldPause: false,
        shouldFail: true,
        message: 'No previous checkpoint to rollback to',
        rollbackPerformed: false,
      };
    }

    // Mark failed node
    node.status = 'failed';
    node.completedAt = new Date();
    node.error = {
      code: error.code,
      message: error.message,
      details: error.details,
    };

    // Find last completed node
    const sortedCompleted = completedNodes.sort((a, b) => {
      const aTime = a.completedAt?.getTime() ?? 0;
      const bTime = b.completedAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    const rollbackTarget = sortedCompleted[0];

    // Reset nodes after rollback point
    for (const n of context.graph.nodes) {
      if (n.startedAt && rollbackTarget.completedAt) {
        if (n.startedAt > rollbackTarget.completedAt) {
          n.status = 'pending';
          n.startedAt = undefined;
          n.completedAt = undefined;
          n.result = undefined;
          n.error = undefined;
          n.retryCount = 0;
        }
      }
    }

    // Reset edges
    for (const edge of context.graph.edges) {
      const toNode = context.graph.nodes.find((n) => n.id === edge.toNodeId);
      if (toNode?.status === 'pending') {
        edge.evaluated = false;
        edge.conditionMet = undefined;
        edge.taken = false;
      }
    }

    // Set current to rollback target's outgoing nodes
    const outgoingEdges = context.graph.edges.filter(
      (e) => e.fromNodeId === rollbackTarget.id
    );
    context.graph.currentNodeIds = outgoingEdges.map((e) => e.toNodeId);

    return {
      success: true,
      strategy: 'rollback',
      action: 'rollback_performed',
      shouldContinue: true,
      shouldPause: false,
      shouldFail: false,
      message: `Rolled back to step ${rollbackTarget.stepId}`,
      rollbackPerformed: true,
    };
  },
};

// =============================================================================
// NOTIFICATION
// =============================================================================

interface NotificationPayload {
  type: string;
  instanceId: string;
  journeyId: string;
  stepId: string;
  error: string;
}

/**
 * Send notifications through configured channels
 */
async function sendNotifications(
  channels: string[],
  payload: NotificationPayload
): Promise<void> {
  for (const channel of channels) {
    try {
      await sendToChannel(channel, payload);
    } catch (error) {
      console.error(`Failed to send notification to ${channel}:`, error);
    }
  }
}

/**
 * Send to a specific channel
 */
async function sendToChannel(
  channel: string,
  payload: NotificationPayload
): Promise<void> {
  // Implementation would depend on the channel type
  // This is a placeholder - actual implementation would integrate with:
  // - Email service
  // - Slack webhook
  // - PagerDuty
  // - SMS gateway
  // etc.

  console.log(`[Notification:${channel}]`, payload);
}

// =============================================================================
// FALLBACK CONFIG BUILDERS
// =============================================================================

/**
 * Create skip fallback config
 */
export function skipFallback(): FallbackConfig {
  return {
    strategy: 'skip',
  };
}

/**
 * Create retry fallback config
 */
export function retryFallback(
  maxRetries: number = 3,
  options?: {
    retryDelayMs?: number;
    backoffMultiplier?: number;
  }
): FallbackConfig {
  return {
    strategy: 'retry',
    maxRetries,
    retryDelayMs: options?.retryDelayMs ?? 1000,
    retryBackoffMultiplier: options?.backoffMultiplier ?? 2,
  };
}

/**
 * Create fallback step config
 */
export function fallbackStepConfig(
  fallbackStepId: string,
  options?: {
    notifyOnFallback?: boolean;
    notificationChannels?: string[];
  }
): FallbackConfig {
  return {
    strategy: 'fallback_step',
    fallbackStepId,
    notifyOnFallback: options?.notifyOnFallback ?? false,
    notificationChannels: options?.notificationChannels,
  };
}

/**
 * Create manual review fallback config
 */
export function manualReviewFallback(options?: {
  notificationChannels?: string[];
}): FallbackConfig {
  return {
    strategy: 'manual_review',
    notifyOnFallback: true,
    notificationChannels: options?.notificationChannels ?? ['email'],
  };
}

/**
 * Create fail fallback config
 */
export function failFallback(): FallbackConfig {
  return {
    strategy: 'fail',
  };
}

/**
 * Create rollback fallback config
 */
export function rollbackFallback(): FallbackConfig {
  return {
    strategy: 'rollback',
  };
}

// =============================================================================
// FALLBACK CHAIN
// =============================================================================

/**
 * Execute a chain of fallback strategies
 */
export async function executeFallbackChain(
  strategies: FallbackStrategy[],
  configs: Map<FallbackStrategy, FallbackConfig>,
  step: StepNode,
  node: StateNode,
  context: ExecutionContext,
  error: JourneyError
): Promise<FallbackResult> {
  for (const strategy of strategies) {
    const config = configs.get(strategy) ?? { strategy };
    const result = await executeFallback(
      strategy,
      config,
      step,
      node,
      context,
      error
    );

    if (result.success) {
      return result;
    }

    // If strategy failed, try next one
    console.warn(
      `Fallback strategy ${strategy} failed: ${result.message}. Trying next...`
    );
  }

  // All strategies failed
  return {
    success: false,
    strategy: 'fail',
    action: 'all_fallbacks_failed',
    shouldContinue: false,
    shouldPause: false,
    shouldFail: true,
    message: 'All fallback strategies exhausted',
  };
}

// =============================================================================
// DEFAULT FALLBACK CHAIN
// =============================================================================

/**
 * Get default fallback chain for error type
 */
export function getDefaultFallbackChain(
  error: JourneyError
): FallbackStrategy[] {
  switch (error.code) {
    case 'STEP_TIMEOUT':
    case 'EXECUTION_FAILED':
      // Retryable errors: retry first, then skip
      return ['retry', 'skip'];

    case 'PRECONDITION_FAILED':
      // Precondition failures: wait or skip
      return ['skip'];

    case 'INVALID_STATE':
    case 'STATE_CORRUPTED':
      // State errors: try rollback, then fail
      return ['rollback', 'fail'];

    case 'HANDLER_NOT_FOUND':
    case 'INVALID_DEFINITION':
      // Configuration errors: fail immediately
      return ['fail'];

    default:
      // Default: retry, skip, then fail
      return ['retry', 'skip', 'fail'];
  }
}
