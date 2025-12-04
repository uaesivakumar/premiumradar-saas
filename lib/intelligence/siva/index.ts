/**
 * SIVA Intelligence Layer - EB Journey Phase 6
 *
 * Provides context-aware intelligence for SIVA operations:
 * - SIVAContextLoader: Loads and combines SalesContext + VerticalConfig
 * - SIVAContextGuard: Enforces context boundaries (drift guard)
 * - SIVAPromptBuilder: Builds context-aware system prompts
 */

// Context Loader
export {
  useSIVAContextLoader,
  serializeSIVAContext,
  createQueryContext,
  type SIVAContext,
  type SIVAContextLoaderReturn,
} from './SIVAContextLoader';

// Context Guard
export {
  createContextGuard,
  validateSignalType,
  validateSignalTypes,
  validateRegion,
  validateTargetEntity,
  validateQuery,
  validateFullContext,
  filterResponse,
  type ValidationResult,
  type ContextViolation,
  type FilteredResponse,
} from './SIVAContextGuard';

// Prompt Builder
export {
  buildSIVAPrompt,
  buildQueryContextInjection,
  buildContextReminder,
  type OperationType,
  type PromptContext,
  type BuiltPrompt,
} from './SIVAPromptBuilder';
