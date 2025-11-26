/**
 * Intent Module - S43
 *
 * Intent classification, entity extraction, query normalization, and context memory.
 */

// Types
export * from './types';

// Intent Classification
export {
  INTENT_DEFINITIONS,
  classifyIntent,
  getIntentConfidence,
  isCompoundIntent,
  getRequiredAgents,
} from './IntentClassifier';

// Entity Extraction
export {
  extractEntities,
  getPrimaryCompany,
  getPrimarySector,
  getPrimaryRegion,
} from './EntityExtractor';

// Query Normalization
export {
  normalizeQuery,
  needsContextResolution,
  getPronounsToResolve,
} from './QueryNormalizer';

// Context Memory
export {
  createContextMemory,
  addToContext,
  addResponseContext,
  resolveReferences,
  getRecentContext,
  getLastQuery,
  getLastIntent,
  getLastEntities,
  hasRelevantContext,
  clearContext,
  getContextSummary,
} from './ContextMemory';
