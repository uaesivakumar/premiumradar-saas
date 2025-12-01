/**
 * Journey Engine Preconditions
 * Sprint S48: Transition Preconditions
 *
 * Guards and precondition checks:
 * - Field validation
 * - Step dependencies
 * - Time windows
 * - Rate limiting
 * - Feature flags
 */
import type { StepNode } from '../journey-builder/types';
import type {
  Precondition,
  PreconditionType,
  ExecutionContext,
  ExecutionData,
} from './types';

// =============================================================================
// PRECONDITION CHECKER
// =============================================================================

/**
 * Check all preconditions for a step
 */
export async function checkPreconditions(
  preconditions: Precondition[],
  step: StepNode,
  context: ExecutionContext,
  data: ExecutionData
): Promise<Precondition[]> {
  const results: Precondition[] = [];

  for (const precondition of preconditions) {
    const passed = await evaluatePrecondition(precondition, step, context, data);
    results.push({
      ...precondition,
      passed,
      evaluatedAt: new Date(),
    });
  }

  return results;
}

/**
 * Check if all preconditions pass
 */
export async function allPreconditionsPass(
  preconditions: Precondition[],
  step: StepNode,
  context: ExecutionContext,
  data: ExecutionData
): Promise<boolean> {
  const results = await checkPreconditions(preconditions, step, context, data);
  return results.every((r) => r.passed);
}

// =============================================================================
// PRECONDITION EVALUATION
// =============================================================================

/**
 * Evaluate a single precondition
 */
async function evaluatePrecondition(
  precondition: Precondition,
  step: StepNode,
  context: ExecutionContext,
  data: ExecutionData
): Promise<boolean> {
  const checker = preconditionCheckers[precondition.type];
  if (!checker) {
    console.warn(`Unknown precondition type: ${precondition.type}`);
    return true; // Unknown types pass by default
  }

  try {
    return await checker(precondition.config, step, context, data);
  } catch (error) {
    console.error(`Precondition check failed:`, error);
    return false;
  }
}

// =============================================================================
// PRECONDITION CHECKERS
// =============================================================================

type PreconditionChecker = (
  config: Record<string, unknown>,
  step: StepNode,
  context: ExecutionContext,
  data: ExecutionData
) => Promise<boolean>;

const preconditionCheckers: Record<PreconditionType, PreconditionChecker> = {
  /**
   * Check a field value
   */
  field_check: async (config, _step, _context, data) => {
    const { field, operator, value } = config as {
      field: string;
      operator: string;
      value: unknown;
    };

    const fieldValue = getFieldValue(field, data);
    return evaluateFieldCondition(fieldValue, operator, value);
  },

  /**
   * Check if a previous step is completed
   */
  step_completed: async (config, _step, context, _data) => {
    const { stepId, status = 'completed' } = config as {
      stepId: string;
      status?: string;
    };

    const node = context.graph.nodes.find((n) => n.stepId === stepId);
    if (!node) return false;

    return node.status === status;
  },

  /**
   * Check if current time is within a window
   */
  time_window: async (config) => {
    const {
      startHour,
      endHour,
      daysOfWeek,
      timezone = 'UTC',
    } = config as {
      startHour: number;
      endHour: number;
      daysOfWeek?: number[];
      timezone?: string;
    };

    const now = new Date();

    // Get current hour in timezone (simplified - in production use proper tz library)
    let hour = now.getUTCHours();
    if (timezone !== 'UTC') {
      // Simplified offset handling
      const offset = getTimezoneOffset(timezone);
      hour = (hour + offset + 24) % 24;
    }

    // Check hour window
    let hourInWindow: boolean;
    if (startHour <= endHour) {
      hourInWindow = hour >= startHour && hour < endHour;
    } else {
      // Window crosses midnight
      hourInWindow = hour >= startHour || hour < endHour;
    }

    if (!hourInWindow) return false;

    // Check day of week
    if (daysOfWeek && daysOfWeek.length > 0) {
      const day = now.getUTCDay();
      if (!daysOfWeek.includes(day)) return false;
    }

    return true;
  },

  /**
   * Check rate limit
   */
  rate_limit: async (config, step, context) => {
    const {
      maxExecutions,
      windowMs,
      scope = 'step',
    } = config as {
      maxExecutions: number;
      windowMs: number;
      scope?: 'step' | 'journey' | 'entity';
    };

    const now = Date.now();
    const windowStart = now - windowMs;

    // Count executions in window
    const history = context.metadata.executionHistory as Array<{
      stepId?: string;
      timestamp: number;
    }> | undefined;

    if (!history) return true;

    let count: number;
    if (scope === 'step') {
      count = history.filter(
        (h) => h.stepId === step.id && h.timestamp >= windowStart
      ).length;
    } else if (scope === 'journey') {
      count = history.filter((h) => h.timestamp >= windowStart).length;
    } else {
      // entity scope - would need entityId tracking
      count = history.filter((h) => h.timestamp >= windowStart).length;
    }

    return count < maxExecutions;
  },

  /**
   * Check feature flag
   */
  feature_flag: async (config, _step, context) => {
    const { flagName, expectedValue = true } = config as {
      flagName: string;
      expectedValue?: boolean;
    };

    // Feature flags would come from context metadata or external service
    const featureFlags = context.metadata.featureFlags as Record<string, boolean> | undefined;
    if (!featureFlags) return expectedValue === false; // No flags = all disabled

    const flagValue = featureFlags[flagName];
    return flagValue === expectedValue;
  },

  /**
   * Custom precondition (function reference)
   */
  custom: async (config, step, context, data) => {
    const { handlerName, params } = config as {
      handlerName: string;
      params?: Record<string, unknown>;
    };

    // Custom handlers would be registered externally
    const customHandlers = context.metadata.customPreconditionHandlers as
      | Record<string, PreconditionChecker>
      | undefined;

    if (!customHandlers || !customHandlers[handlerName]) {
      console.warn(`Custom precondition handler not found: ${handlerName}`);
      return true;
    }

    return customHandlers[handlerName](params ?? {}, step, context, data);
  },
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get field value from data
 */
function getFieldValue(field: string, data: ExecutionData): unknown {
  if (field.startsWith('input.')) {
    return getNestedValue(data.input, field.slice(6));
  }
  if (field.startsWith('output.')) {
    const parts = field.slice(7).split('.');
    const stepId = parts[0];
    const path = parts.slice(1).join('.');
    const stepOutput = data.stepOutputs[stepId];
    return path ? getNestedValue(stepOutput, path) : stepOutput;
  }
  if (field.startsWith('var.')) {
    return getNestedValue(data.variables, field.slice(4));
  }

  // Try variables first, then input
  let value = getNestedValue(data.variables, field);
  if (value !== undefined) return value;
  return getNestedValue(data.input, field);
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluate field condition
 */
function evaluateFieldCondition(
  fieldValue: unknown,
  operator: string,
  conditionValue: unknown
): boolean {
  switch (operator) {
    case 'equals':
    case '==':
    case '===':
      return fieldValue === conditionValue;

    case 'not_equals':
    case '!=':
    case '!==':
      return fieldValue !== conditionValue;

    case 'greater_than':
    case '>':
      return (fieldValue as number) > (conditionValue as number);

    case 'greater_than_or_equals':
    case '>=':
      return (fieldValue as number) >= (conditionValue as number);

    case 'less_than':
    case '<':
      return (fieldValue as number) < (conditionValue as number);

    case 'less_than_or_equals':
    case '<=':
      return (fieldValue as number) <= (conditionValue as number);

    case 'contains':
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(String(conditionValue));
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(conditionValue);
      }
      return false;

    case 'not_contains':
      if (typeof fieldValue === 'string') {
        return !fieldValue.includes(String(conditionValue));
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(conditionValue);
      }
      return true;

    case 'is_empty':
      if (fieldValue === null || fieldValue === undefined) return true;
      if (typeof fieldValue === 'string') return fieldValue.trim() === '';
      if (Array.isArray(fieldValue)) return fieldValue.length === 0;
      return false;

    case 'is_not_empty':
      if (fieldValue === null || fieldValue === undefined) return false;
      if (typeof fieldValue === 'string') return fieldValue.trim() !== '';
      if (Array.isArray(fieldValue)) return fieldValue.length > 0;
      return true;

    case 'in':
      if (Array.isArray(conditionValue)) {
        return conditionValue.includes(fieldValue);
      }
      return false;

    case 'not_in':
      if (Array.isArray(conditionValue)) {
        return !conditionValue.includes(fieldValue);
      }
      return true;

    case 'matches':
      if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
        try {
          return new RegExp(conditionValue).test(fieldValue);
        } catch {
          return false;
        }
      }
      return false;

    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Get timezone offset (simplified)
 */
function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    UTC: 0,
    EST: -5,
    EDT: -4,
    CST: -6,
    CDT: -5,
    MST: -7,
    MDT: -6,
    PST: -8,
    PDT: -7,
    // Add more as needed
  };
  return offsets[timezone] ?? 0;
}

// =============================================================================
// PRECONDITION BUILDERS
// =============================================================================

/**
 * Create a field check precondition
 */
export function fieldCheck(
  field: string,
  operator: string,
  value: unknown,
  options?: { failureAction?: Precondition['failureAction']; failureMessage?: string }
): Precondition {
  return {
    id: `field-check-${Date.now()}`,
    type: 'field_check',
    name: `Check ${field}`,
    config: { field, operator, value },
    failureAction: options?.failureAction ?? 'fail',
    failureMessage: options?.failureMessage,
  };
}

/**
 * Create a step completed precondition
 */
export function stepCompleted(
  stepId: string,
  options?: {
    status?: string;
    failureAction?: Precondition['failureAction'];
    failureMessage?: string;
  }
): Precondition {
  return {
    id: `step-completed-${Date.now()}`,
    type: 'step_completed',
    name: `Require step ${stepId}`,
    config: { stepId, status: options?.status ?? 'completed' },
    failureAction: options?.failureAction ?? 'fail',
    failureMessage: options?.failureMessage ?? `Step ${stepId} must be completed first`,
  };
}

/**
 * Create a time window precondition
 */
export function timeWindow(
  startHour: number,
  endHour: number,
  options?: {
    daysOfWeek?: number[];
    timezone?: string;
    failureAction?: Precondition['failureAction'];
    failureMessage?: string;
  }
): Precondition {
  return {
    id: `time-window-${Date.now()}`,
    type: 'time_window',
    name: `Time window ${startHour}:00-${endHour}:00`,
    config: {
      startHour,
      endHour,
      daysOfWeek: options?.daysOfWeek,
      timezone: options?.timezone ?? 'UTC',
    },
    failureAction: options?.failureAction ?? 'wait',
    failureMessage: options?.failureMessage ?? 'Outside allowed time window',
  };
}

/**
 * Create a rate limit precondition
 */
export function rateLimit(
  maxExecutions: number,
  windowMs: number,
  options?: {
    scope?: 'step' | 'journey' | 'entity';
    failureAction?: Precondition['failureAction'];
    failureMessage?: string;
  }
): Precondition {
  return {
    id: `rate-limit-${Date.now()}`,
    type: 'rate_limit',
    name: `Rate limit ${maxExecutions}/${windowMs}ms`,
    config: {
      maxExecutions,
      windowMs,
      scope: options?.scope ?? 'step',
    },
    failureAction: options?.failureAction ?? 'wait',
    failureMessage:
      options?.failureMessage ?? `Rate limit exceeded: ${maxExecutions} per ${windowMs}ms`,
  };
}

/**
 * Create a feature flag precondition
 */
export function featureFlag(
  flagName: string,
  options?: {
    expectedValue?: boolean;
    failureAction?: Precondition['failureAction'];
    failureMessage?: string;
  }
): Precondition {
  return {
    id: `feature-flag-${Date.now()}`,
    type: 'feature_flag',
    name: `Feature flag ${flagName}`,
    config: {
      flagName,
      expectedValue: options?.expectedValue ?? true,
    },
    failureAction: options?.failureAction ?? 'skip',
    failureMessage: options?.failureMessage ?? `Feature flag ${flagName} is disabled`,
  };
}

/**
 * Create a custom precondition
 */
export function customPrecondition(
  handlerName: string,
  params?: Record<string, unknown>,
  options?: {
    name?: string;
    failureAction?: Precondition['failureAction'];
    failureMessage?: string;
  }
): Precondition {
  return {
    id: `custom-${Date.now()}`,
    type: 'custom',
    name: options?.name ?? `Custom: ${handlerName}`,
    config: { handlerName, params },
    failureAction: options?.failureAction ?? 'fail',
    failureMessage: options?.failureMessage,
  };
}
