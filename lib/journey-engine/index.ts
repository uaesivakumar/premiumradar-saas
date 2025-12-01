/**
 * Journey Engine
 * Sprint S48: Complete Journey Engine Runtime
 *
 * Exports all journey engine components:
 * - State machine
 * - Persistence
 * - Transitions
 * - Preconditions
 * - Error handling
 * - Fallback logic
 */

// Types
export * from './types';

// State Machine
export {
  JourneyStateMachine,
  createJourneyEngine,
} from './state-machine';

// Persistence
export {
  InMemoryPersistenceAdapter,
  DatabasePersistenceAdapter,
  PersistenceManager,
  createInMemoryPersistence,
  createPrismaPersistence,
  createPrismaPersistenceAdapter,
} from './persistence';

// Transitions
export {
  evaluateCondition,
  selectTransitions,
  findPaths,
  isPathReachable,
  getReachableNodes,
  evaluateExpression,
  evaluateExpressions,
  type TransitionSelectionOptions,
  type JourneyPath,
} from './transitions';

// Preconditions
export {
  checkPreconditions,
  allPreconditionsPass,
  fieldCheck,
  stepCompleted,
  timeWindow,
  rateLimit,
  featureFlag,
  customPrecondition,
} from './preconditions';

// Error Handling
export {
  classifyError,
  handleStepError,
  getRecentErrors,
  getErrorsForInstance,
  clearErrorLog,
  attemptRecovery,
  withErrorHandling,
  withTimeout,
  withRetry,
  getErrorStats,
  type ClassifiedError,
  type ErrorSeverity,
  type ErrorLogEntry,
  type RecoveryOptions,
  type StepErrorResult,
  type ErrorStats,
} from './error-handling';

// Fallback
export {
  executeFallback,
  executeFallbackChain,
  getDefaultFallbackChain,
  skipFallback,
  retryFallback,
  fallbackStepConfig,
  manualReviewFallback,
  failFallback,
  rollbackFallback,
  type FallbackResult,
} from './fallback';
