/**
 * SIVAContextGuard - EB Journey Phase 6.2
 *
 * Enforces context boundaries for SIVA operations.
 * Prevents "context drift" where SIVA might respond about signals
 * or targets that don't match the user's vertical/sub-vertical/region.
 *
 * Validation includes:
 * - Signal type validation (only allowed signals)
 * - Region validation (only user's territories)
 * - Target validation (companies vs individuals)
 * - Response filtering (remove out-of-context suggestions)
 */

import type { SIVAContext } from './SIVAContextLoader';

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  violations: ContextViolation[];
  suggestions: string[];
}

export interface ContextViolation {
  type: 'signal' | 'region' | 'target' | 'vertical';
  message: string;
  offendingValue: string;
  suggestedFix?: string;
}

export interface FilteredResponse {
  original: string;
  filtered: string;
  removedElements: string[];
  hadViolations: boolean;
}

// =============================================================================
// SIGNAL VALIDATION
// =============================================================================

/**
 * Validate that a signal type is allowed for the current context
 */
export function validateSignalType(
  signalType: string,
  context: SIVAContext
): ValidationResult {
  const isValid = context.isSignalAllowed(signalType);

  if (isValid) {
    return { isValid: true, violations: [], suggestions: [] };
  }

  return {
    isValid: false,
    violations: [
      {
        type: 'signal',
        message: `Signal type "${signalType}" is not allowed for ${context.subVerticalName}`,
        offendingValue: signalType,
        suggestedFix: `Use one of: ${context.allowedSignalTypes.slice(0, 3).join(', ')}...`,
      },
    ],
    suggestions: [
      `Consider using ${context.allowedSignalTypes[0]} instead`,
    ],
  };
}

/**
 * Validate multiple signal types at once
 */
export function validateSignalTypes(
  signalTypes: string[],
  context: SIVAContext
): ValidationResult {
  const violations: ContextViolation[] = [];
  const suggestions: string[] = [];

  for (const signalType of signalTypes) {
    if (!context.isSignalAllowed(signalType)) {
      violations.push({
        type: 'signal',
        message: `Signal type "${signalType}" is not allowed for ${context.subVerticalName}`,
        offendingValue: signalType,
      });
    }
  }

  if (violations.length > 0) {
    suggestions.push(
      `Allowed signals for ${context.subVerticalName}: ${context.allowedSignalTypes.join(', ')}`
    );
  }

  return {
    isValid: violations.length === 0,
    violations,
    suggestions,
  };
}

// =============================================================================
// REGION VALIDATION
// =============================================================================

/**
 * Validate that a region is within user's territory
 */
export function validateRegion(
  region: string,
  context: SIVAContext
): ValidationResult {
  const normalizedRegion = region.toLowerCase().replace(/\s+/g, '-');
  const isValid = context.regions.some(
    (r) => r.toLowerCase() === normalizedRegion || normalizedRegion.includes(r.toLowerCase())
  );

  if (isValid) {
    return { isValid: true, violations: [], suggestions: [] };
  }

  return {
    isValid: false,
    violations: [
      {
        type: 'region',
        message: `Region "${region}" is outside your territory`,
        offendingValue: region,
        suggestedFix: `Your territories: ${context.regionsDisplay}`,
      },
    ],
    suggestions: [
      `Focus on your assigned territories: ${context.regionsDisplay}`,
    ],
  };
}

// =============================================================================
// TARGET VALIDATION
// =============================================================================

/**
 * Validate that the target entity type matches vertical
 */
export function validateTargetEntity(
  targetType: 'company' | 'individual' | 'family' | 'candidate',
  context: SIVAContext
): ValidationResult {
  const targetMap: Record<string, string[]> = {
    companies: ['company'],
    individuals: ['individual'],
    families: ['family', 'individual'],
    candidates: ['candidate', 'individual'],
  };

  const allowedTargets = targetMap[context.radarTarget] || ['company'];
  const isValid = allowedTargets.includes(targetType);

  if (isValid) {
    return { isValid: true, violations: [], suggestions: [] };
  }

  return {
    isValid: false,
    violations: [
      {
        type: 'target',
        message: `${context.subVerticalName} targets ${context.radarTarget}, not ${targetType}s`,
        offendingValue: targetType,
        suggestedFix: `Search for ${context.radarTarget} instead`,
      },
    ],
    suggestions: [
      `${context.subVerticalName} is focused on ${context.radarTarget}. Adjust your query.`,
    ],
  };
}

// =============================================================================
// QUERY VALIDATION
// =============================================================================

/**
 * Patterns that indicate out-of-context queries
 */
const OUT_OF_CONTEXT_PATTERNS: Record<string, { pattern: RegExp; vertical: string }[]> = {
  banking: [
    { pattern: /life\s*event/i, vertical: 'insurance' },
    { pattern: /marriage|wedding|newborn|baby/i, vertical: 'insurance' },
    { pattern: /rental\s*expir/i, vertical: 'real-estate' },
    { pattern: /relocation\s*package/i, vertical: 'real-estate' },
    { pattern: /job\s*seeker|candidate/i, vertical: 'recruitment' },
  ],
  insurance: [
    { pattern: /hiring|expansion|office\s*opening/i, vertical: 'banking' },
    { pattern: /payroll|salary\s*account/i, vertical: 'banking' },
  ],
  'real-estate': [
    { pattern: /payroll|corporate\s*account/i, vertical: 'banking' },
    { pattern: /life\s*insurance|group\s*benefits/i, vertical: 'insurance' },
  ],
};

/**
 * Validate that a query is within context
 */
export function validateQuery(
  query: string,
  context: SIVAContext
): ValidationResult {
  const violations: ContextViolation[] = [];
  const suggestions: string[] = [];

  // Check for out-of-context patterns
  const patternsToCheck = OUT_OF_CONTEXT_PATTERNS[context.vertical] || [];

  for (const { pattern, vertical } of patternsToCheck) {
    if (pattern.test(query)) {
      violations.push({
        type: 'vertical',
        message: `Query appears to be about ${vertical}, but your context is ${context.subVerticalName}`,
        offendingValue: query.match(pattern)?.[0] || query,
        suggestedFix: `Adjust query for ${context.subVerticalName} context`,
      });
    }
  }

  if (violations.length > 0) {
    suggestions.push(
      `Your role is ${context.subVerticalName} in ${context.regionsDisplay}. ` +
        `Focus on ${context.radarTarget} with signals like: ${context.allowedSignalTypes.slice(0, 3).join(', ')}`
    );
  }

  return {
    isValid: violations.length === 0,
    violations,
    suggestions,
  };
}

// =============================================================================
// RESPONSE FILTERING
// =============================================================================

/**
 * Filter SIVA response to remove out-of-context suggestions
 */
export function filterResponse(
  response: string,
  context: SIVAContext
): FilteredResponse {
  const removedElements: string[] = [];
  let filtered = response;

  // Check for out-of-context patterns and add warnings
  const patternsToCheck = OUT_OF_CONTEXT_PATTERNS[context.vertical] || [];

  for (const { pattern, vertical } of patternsToCheck) {
    const match = filtered.match(pattern);
    if (match) {
      removedElements.push(`${vertical} signal: ${match[0]}`);
      // Don't remove, but mark for review
    }
  }

  return {
    original: response,
    filtered,
    removedElements,
    hadViolations: removedElements.length > 0,
  };
}

// =============================================================================
// COMPREHENSIVE VALIDATION
// =============================================================================

/**
 * Perform full context validation
 */
export function validateFullContext(
  input: {
    query?: string;
    signalTypes?: string[];
    regions?: string[];
    targetType?: 'company' | 'individual' | 'family' | 'candidate';
  },
  context: SIVAContext
): ValidationResult {
  const allViolations: ContextViolation[] = [];
  const allSuggestions: string[] = [];

  // Validate query
  if (input.query) {
    const queryResult = validateQuery(input.query, context);
    allViolations.push(...queryResult.violations);
    allSuggestions.push(...queryResult.suggestions);
  }

  // Validate signals
  if (input.signalTypes && input.signalTypes.length > 0) {
    const signalResult = validateSignalTypes(input.signalTypes, context);
    allViolations.push(...signalResult.violations);
    allSuggestions.push(...signalResult.suggestions);
  }

  // Validate regions
  if (input.regions) {
    for (const region of input.regions) {
      const regionResult = validateRegion(region, context);
      allViolations.push(...regionResult.violations);
      allSuggestions.push(...regionResult.suggestions);
    }
  }

  // Validate target
  if (input.targetType) {
    const targetResult = validateTargetEntity(input.targetType, context);
    allViolations.push(...targetResult.violations);
    allSuggestions.push(...targetResult.suggestions);
  }

  return {
    isValid: allViolations.length === 0,
    violations: allViolations,
    suggestions: [...new Set(allSuggestions)], // Deduplicate
  };
}

// =============================================================================
// GUARD HOOK
// =============================================================================

/**
 * Create a guard function that validates against context
 */
export function createContextGuard(context: SIVAContext) {
  return {
    validateSignal: (signalType: string) => validateSignalType(signalType, context),
    validateSignals: (signalTypes: string[]) => validateSignalTypes(signalTypes, context),
    validateRegion: (region: string) => validateRegion(region, context),
    validateTarget: (target: 'company' | 'individual' | 'family' | 'candidate') =>
      validateTargetEntity(target, context),
    validateQuery: (query: string) => validateQuery(query, context),
    validateFull: (input: Parameters<typeof validateFullContext>[0]) =>
      validateFullContext(input, context),
    filterResponse: (response: string) => filterResponse(response, context),
  };
}

export default createContextGuard;
