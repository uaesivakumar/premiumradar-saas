/**
 * Journey Engine Error Handling
 * Sprint S48: Journey Error Handling
 *
 * Error classification and handling:
 * - Error categorization
 * - Retry strategies
 * - Error recovery
 * - Logging and monitoring
 */
import type { StepNode } from '../journey-builder/types';
import type {
  ExecutionContext,
  StateNode,
  JourneyErrorCode,
  FallbackStrategy,
  StepResult,
} from './types';
import { JourneyError } from './types';

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Classified error with metadata
 */
export interface ClassifiedError {
  original: Error;
  code: JourneyErrorCode;
  severity: ErrorSeverity;
  retryable: boolean;
  userFacing: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Classify an error
 */
export function classifyError(error: Error): ClassifiedError {
  // If already a JourneyError, use its classification
  if (error instanceof JourneyError) {
    return {
      original: error,
      code: error.code,
      severity: getErrorSeverity(error.code),
      retryable: error.retryable,
      userFacing: isUserFacingError(error.code),
      message: error.message,
      details: error.details,
    };
  }

  // Classify based on error characteristics
  const errorInfo = classifyByErrorType(error);

  return {
    original: error,
    code: errorInfo.code,
    severity: errorInfo.severity ?? 'medium',
    retryable: errorInfo.retryable ?? false,
    userFacing: errorInfo.userFacing ?? false,
    message: errorInfo.message ?? error.message,
    details: errorInfo.details,
  };
}

/**
 * Classify error by its type/name
 */
function classifyByErrorType(error: Error): Partial<ClassifiedError> & {
  code: JourneyErrorCode;
} {
  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();

  // Network/timeout errors
  if (
    name.includes('timeout') ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return {
      code: 'TIMEOUT',
      severity: 'medium',
      retryable: true,
      userFacing: false,
    };
  }

  if (
    name.includes('network') ||
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  ) {
    return {
      code: 'EXECUTION_FAILED',
      severity: 'medium',
      retryable: true,
      userFacing: false,
      details: { type: 'network_error' },
    };
  }

  // Validation errors
  if (name.includes('validation') || message.includes('invalid')) {
    return {
      code: 'INVALID_STATE',
      severity: 'low',
      retryable: false,
      userFacing: true,
    };
  }

  // Permission errors
  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return {
      code: 'EXECUTION_FAILED',
      severity: 'high',
      retryable: false,
      userFacing: true,
      details: { type: 'permission_error' },
    };
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return {
      code: 'EXECUTION_FAILED',
      severity: 'low',
      retryable: true,
      userFacing: false,
      details: { type: 'rate_limit' },
    };
  }

  // Default: execution failed
  return {
    code: 'EXECUTION_FAILED',
    severity: 'medium',
    retryable: false,
    userFacing: false,
  };
}

/**
 * Get severity for error code
 */
function getErrorSeverity(code: JourneyErrorCode): ErrorSeverity {
  switch (code) {
    case 'INVALID_DEFINITION':
    case 'STATE_CORRUPTED':
      return 'critical';

    case 'EXECUTION_FAILED':
    case 'STEP_FAILED':
    case 'PERSISTENCE_FAILED':
      return 'high';

    case 'STEP_TIMEOUT':
    case 'TRANSITION_FAILED':
    case 'PRECONDITION_FAILED':
    case 'TIMEOUT':
    case 'RETRY_EXHAUSTED':
      return 'medium';

    case 'INVALID_STATE':
    case 'STATE_NOT_FOUND':
    case 'HANDLER_NOT_FOUND':
    case 'INVALID_TRANSITION':
    case 'CANCELLED':
    case 'PAUSED':
    case 'LOAD_FAILED':
    case 'SAVE_FAILED':
      return 'low';

    default:
      return 'medium';
  }
}

/**
 * Check if error should be shown to users
 */
function isUserFacingError(code: JourneyErrorCode): boolean {
  return [
    'INVALID_STATE',
    'INVALID_DEFINITION',
    'PRECONDITION_FAILED',
    'CANCELLED',
  ].includes(code);
}

// =============================================================================
// STEP ERROR HANDLER
// =============================================================================

export interface StepErrorResult {
  handled: boolean;
  fallbackStrategy?: FallbackStrategy;
  result?: StepResult;
  shouldPause?: boolean;
  shouldFail?: boolean;
}

/**
 * Handle a step error
 */
export async function handleStepError(
  error: JourneyError,
  step: StepNode,
  context: ExecutionContext,
  node: StateNode
): Promise<StepErrorResult> {
  const classified = classifyError(error);

  // Log the error
  logError(classified, {
    stepId: step.id,
    stepType: step.type,
    instanceId: context.instanceId,
    journeyId: context.journeyId,
    retryCount: node.retryCount,
  });

  // Determine fallback strategy based on step config or defaults
  const stepConfig = step.config as {
    fallbackStrategy?: FallbackStrategy;
    skipOnError?: boolean;
    pauseOnError?: boolean;
  };

  // Check for explicit fallback config
  if (stepConfig.fallbackStrategy) {
    return {
      handled: true,
      fallbackStrategy: stepConfig.fallbackStrategy,
    };
  }

  // Skip on certain errors
  if (stepConfig.skipOnError && classified.severity !== 'critical') {
    return {
      handled: true,
      fallbackStrategy: 'skip',
    };
  }

  // Pause on error if configured
  if (stepConfig.pauseOnError) {
    return {
      handled: true,
      shouldPause: true,
      fallbackStrategy: 'manual_review',
    };
  }

  // Default handling based on error type
  if (classified.retryable && node.retryCount < node.maxRetries) {
    return {
      handled: true,
      fallbackStrategy: 'retry',
    };
  }

  // Critical errors should fail the journey
  if (classified.severity === 'critical') {
    return {
      handled: true,
      shouldFail: true,
      fallbackStrategy: 'fail',
    };
  }

  // Default: fail this step but continue journey
  return {
    handled: true,
    fallbackStrategy: 'skip',
  };
}

// =============================================================================
// ERROR LOGGING
// =============================================================================

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  timestamp: Date;
  code: JourneyErrorCode;
  severity: ErrorSeverity;
  message: string;
  context: Record<string, unknown>;
  stack?: string;
}

const errorLog: ErrorLogEntry[] = [];

/**
 * Log an error
 */
function logError(
  classified: ClassifiedError,
  context: Record<string, unknown>
): void {
  const entry: ErrorLogEntry = {
    timestamp: new Date(),
    code: classified.code,
    severity: classified.severity,
    message: classified.message,
    context: {
      ...context,
      ...classified.details,
    },
    stack: classified.original.stack,
  };

  errorLog.push(entry);

  // Console logging based on severity
  switch (classified.severity) {
    case 'critical':
      console.error('[CRITICAL]', entry);
      break;
    case 'high':
      console.error('[ERROR]', entry);
      break;
    case 'medium':
      console.warn('[WARN]', entry);
      break;
    case 'low':
      console.info('[INFO]', entry);
      break;
  }

  // Trim log if too large
  if (errorLog.length > 1000) {
    errorLog.splice(0, 100);
  }
}

/**
 * Get recent errors
 */
export function getRecentErrors(limit: number = 100): ErrorLogEntry[] {
  return errorLog.slice(-limit);
}

/**
 * Get errors for instance
 */
export function getErrorsForInstance(instanceId: string): ErrorLogEntry[] {
  return errorLog.filter((e) => e.context.instanceId === instanceId);
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

// =============================================================================
// ERROR RECOVERY
// =============================================================================

/**
 * Recovery options for an error
 */
export interface RecoveryOptions {
  retryDelay?: number;
  maxRetries?: number;
  fallbackValue?: unknown;
  skipStep?: boolean;
  pauseExecution?: boolean;
}

/**
 * Attempt to recover from an error
 */
export async function attemptRecovery(
  error: JourneyError,
  context: ExecutionContext,
  options: RecoveryOptions = {}
): Promise<boolean> {
  const classified = classifyError(error);

  // Non-retryable errors can't be recovered
  if (!classified.retryable) {
    return false;
  }

  // Check if we should skip
  if (options.skipStep) {
    return true; // Recovery successful via skip
  }

  // Check if we should pause
  if (options.pauseExecution) {
    context.status = 'paused';
    context.pauseReason = `Error recovery: ${error.message}`;
    return true;
  }

  // Can't recover without specific action
  return false;
}

// =============================================================================
// ERROR WRAPPERS
// =============================================================================

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: {
    errorCode?: JourneyErrorCode;
    retryable?: boolean;
    context?: Record<string, unknown>;
  } = {}
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof JourneyError) {
        throw error;
      }

      throw new JourneyError(
        options.errorCode ?? 'EXECUTION_FAILED',
        (error as Error).message,
        {
          originalError: (error as Error).name,
          ...options.context,
        },
        options.retryable ?? false
      );
    }
  }) as T;
}

/**
 * Create a timeout wrapper
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new JourneyError(
              'TIMEOUT',
              errorMessage ?? `Operation timed out after ${timeoutMs}ms`,
              { timeoutMs },
              true // Timeouts are typically retryable
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Create a retry wrapper
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: Error) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    backoffMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = (e) => classifyError(e).retryable,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        break;
      }

      const delay = backoffMs * Math.pow(backoffMultiplier, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new JourneyError(
    'RETRY_EXHAUSTED',
    `Operation failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
    { originalError: lastError?.name, attempts: maxRetries + 1 },
    false
  );
}

// =============================================================================
// ERROR AGGREGATION
// =============================================================================

/**
 * Aggregated error stats
 */
export interface ErrorStats {
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<ErrorSeverity, number>;
  byStep: Record<string, number>;
  retryableCount: number;
  lastHour: number;
}

/**
 * Get error statistics
 */
export function getErrorStats(): ErrorStats {
  const oneHourAgo = Date.now() - 3600000;

  const stats: ErrorStats = {
    total: errorLog.length,
    byCode: {},
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    byStep: {},
    retryableCount: 0,
    lastHour: 0,
  };

  for (const entry of errorLog) {
    // By code
    stats.byCode[entry.code] = (stats.byCode[entry.code] ?? 0) + 1;

    // By severity
    stats.bySeverity[entry.severity]++;

    // By step
    const stepId = entry.context.stepId as string | undefined;
    if (stepId) {
      stats.byStep[stepId] = (stats.byStep[stepId] ?? 0) + 1;
    }

    // Last hour
    if (entry.timestamp.getTime() > oneHourAgo) {
      stats.lastHour++;
    }
  }

  return stats;
}
