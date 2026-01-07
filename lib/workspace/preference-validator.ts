/**
 * Preference Validator - S376: Preferences (NL-Driven)
 *
 * Validates parsed preferences against policy constraints.
 *
 * WORKSPACE UX (LOCKED):
 * - Invalid preferences are rejected with clear reasons
 * - Policy conflicts are explained
 * - No silent failures
 */

import { ParsedPreference, PreferenceCategory } from './preference-parser';
import { Card, CardAction } from './card-state';
import { getExpiryTime } from './ttl-engine';

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  conflictsWith?: string;  // What policy/rule conflicts
}

export interface PolicyRule {
  key: string;
  check: (value: unknown) => boolean;
  message: string;
}

export interface PersonaPolicy {
  rules: PolicyRule[];
  disallowedCategories?: PreferenceCategory[];
}

// =============================================================================
// DEFAULT POLICY
// =============================================================================

/**
 * Default workspace policy rules
 */
export const DEFAULT_POLICY: PersonaPolicy = {
  rules: [
    // Can't disable all leads
    {
      key: 'min_confidence',
      check: (value) => {
        if (typeof value !== 'number') return true;
        return value < 100; // Can't set to 100 (would filter all leads)
      },
      message: 'Cannot set confidence threshold to 100% (would filter all leads)',
    },
    // Working hours must be reasonable
    {
      key: 'working_hours',
      check: (value) => {
        if (!value || typeof value !== 'object') return true;
        const { start, end } = value as { start: number; end: number };
        return start < end && start >= 0 && end <= 24;
      },
      message: 'Working hours must be valid (start < end, 0-24)',
    },
    // Email frequency must be valid
    {
      key: 'email_frequency',
      check: (value) => {
        if (typeof value !== 'string') return true;
        return ['daily', 'weekly', 'monthly'].includes(value.toLowerCase());
      },
      message: 'Email frequency must be daily, weekly, or monthly',
    },
    // Sales cycle dates must be valid
    {
      key: 'sales_cycle',
      check: (value) => {
        if (!value || typeof value !== 'object') return true;
        const { start, end } = value as { start: number; end: number };
        return start >= 1 && start <= 31 && end >= 1 && end <= 31;
      },
      message: 'Sales cycle dates must be between 1 and 31',
    },
  ],
  disallowedCategories: [],
};

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validate a parsed preference against policy
 */
export function validatePreference(
  preference: ParsedPreference,
  policy: PersonaPolicy = DEFAULT_POLICY
): ValidationResult {
  // Check if category is disallowed
  if (policy.disallowedCategories?.includes(preference.category)) {
    return {
      valid: false,
      reason: `${preference.category} preferences are not allowed in this workspace`,
      conflictsWith: 'workspace policy',
    };
  }

  // Check against policy rules
  for (const rule of policy.rules) {
    if (rule.key === preference.key) {
      const passes = rule.check(preference.value);
      if (!passes) {
        return {
          valid: false,
          reason: rule.message,
          conflictsWith: 'policy rule',
        };
      }
    }
  }

  // Confidence check
  if (preference.confidence < 50) {
    return {
      valid: false,
      reason: 'Could not confidently understand this preference. Please try rephrasing.',
    };
  }

  // All checks passed
  return { valid: true };
}

// =============================================================================
// PREFERENCE CARD GENERATION
// =============================================================================

/**
 * Generate card for successful preference update
 */
export function createPreferenceAppliedCard(
  preference: ParsedPreference
): Omit<Card, 'id' | 'createdAt' | 'status'> {
  const valueDisplay = formatPreferenceValue(preference.key, preference.value);

  return {
    type: 'system',
    priority: 100,
    title: 'Preference Applied',
    summary: `${formatPreferenceKey(preference.key)}: ${valueDisplay}`,
    expiresAt: getExpiryTime('system'),
    sourceType: 'system',
    actions: [
      {
        id: 'dismiss',
        label: 'OK',
        type: 'dismiss',
        handler: 'system.dismiss',
      },
      {
        id: 'undo',
        label: 'Undo',
        type: 'secondary',
        handler: 'preference.undo',
      },
    ],
    tags: ['preference', 'applied', preference.category],
  };
}

/**
 * Generate card for rejected preference
 */
export function createPreferenceRejectedCard(
  preference: ParsedPreference,
  validation: ValidationResult
): Omit<Card, 'id' | 'createdAt' | 'status'> {
  return {
    type: 'system',
    priority: 100,
    title: 'Preference Not Applied',
    summary: validation.reason || 'This preference could not be applied.',
    expandedContent: {
      originalText: preference.originalText,
      conflictsWith: validation.conflictsWith,
    },
    expiresAt: getExpiryTime('system'),
    sourceType: 'system',
    actions: [
      {
        id: 'dismiss',
        label: 'OK',
        type: 'dismiss',
        handler: 'system.dismiss',
      },
    ],
    tags: ['preference', 'rejected', preference.category],
  };
}

/**
 * Generate card for parse failure
 */
export function createPreferenceParseFailedCard(
  originalText: string,
  suggestions?: string[]
): Omit<Card, 'id' | 'createdAt' | 'status'> {
  return {
    type: 'system',
    priority: 100,
    title: 'Preference Not Understood',
    summary: suggestions?.[0] || 'Please try rephrasing your preference.',
    expandedContent: {
      originalText,
      suggestions,
    },
    expiresAt: getExpiryTime('system'),
    sourceType: 'system',
    actions: [
      {
        id: 'dismiss',
        label: 'OK',
        type: 'dismiss',
        handler: 'system.dismiss',
      },
    ],
    tags: ['preference', 'parse-failed'],
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format preference key for display
 */
function formatPreferenceKey(key: string): string {
  const labels: Record<string, string> = {
    email_frequency: 'Email frequency',
    email_enabled: 'Email notifications',
    sales_cycle: 'Sales cycle',
    min_confidence: 'Minimum lead confidence',
    region_filter: 'Region filter',
    working_hours: 'Working hours',
    theme: 'Theme',
  };
  return labels[key] || key.replace(/_/g, ' ');
}

/**
 * Format preference value for display
 */
function formatPreferenceValue(key: string, value: unknown): string {
  if (value === true) return 'Enabled';
  if (value === false) return 'Disabled';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();

  if (key === 'sales_cycle' && typeof value === 'object' && value) {
    const { start, end } = value as { start: number; end: number };
    return `${formatOrdinal(start)} to ${formatOrdinal(end)}`;
  }

  if (key === 'working_hours' && typeof value === 'object' && value) {
    const { start, end } = value as { start: number; end: number };
    return `${formatHour(start)} to ${formatHour(end)}`;
  }

  return JSON.stringify(value);
}

function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatHour(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const preferenceValidator = {
  validate: validatePreference,
  createAppliedCard: createPreferenceAppliedCard,
  createRejectedCard: createPreferenceRejectedCard,
  createParseFailedCard: createPreferenceParseFailedCard,
  DEFAULT_POLICY,
};

export default preferenceValidator;
