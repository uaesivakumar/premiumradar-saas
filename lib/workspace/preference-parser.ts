/**
 * Preference Parser - S376: Preferences (NL-Driven)
 *
 * Parses natural language preference statements into structured preferences.
 *
 * WORKSPACE UX (LOCKED):
 * - Preferences are NL-driven, not toggle-based
 * - Accept/reject flow with explicit feedback
 * - No Settings page (preferences live in workspace)
 *
 * Examples:
 * - "Send me a daily performance email" → email_daily: true
 * - "My sales cycle is 5th to 5th" → cycle_start: 5, cycle_end: 5
 * - "Avoid borderline leads" → min_confidence: 70
 */

// =============================================================================
// TYPES
// =============================================================================

export type PreferenceCategory =
  | 'reporting'      // Report frequency, cycle dates
  | 'notification'   // Email, push notifications
  | 'lead_filter'    // Lead scoring thresholds
  | 'timing'         // Working hours, timezone
  | 'display'        // UI preferences
  | 'unknown';

export interface ParsedPreference {
  category: PreferenceCategory;
  key: string;
  value: unknown;
  originalText: string;
  confidence: number;  // 0-100, how confident we are in the parse
}

export interface ParseResult {
  success: boolean;
  preference?: ParsedPreference;
  error?: string;
  suggestions?: string[];  // Alternative phrasings if parse failed
}

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

interface PreferencePattern {
  patterns: RegExp[];
  category: PreferenceCategory;
  key: string;
  extractor: (match: RegExpMatchArray, text: string) => unknown;
  confidence: number;
}

const PREFERENCE_PATTERNS: PreferencePattern[] = [
  // Reporting - Email frequency
  {
    patterns: [
      /\b(daily|weekly|monthly)\s+(email|report|summary)/i,
      /\bsend\s+(?:me\s+)?(?:a\s+)?(daily|weekly|monthly)\s+(email|report)/i,
      /\b(email|report)\s+(daily|weekly|monthly)/i,
    ],
    category: 'notification',
    key: 'email_frequency',
    extractor: (match) => {
      const freq = match[1]?.toLowerCase() || match[2]?.toLowerCase();
      return freq || 'daily';
    },
    confidence: 90,
  },

  // Reporting - Sales cycle
  {
    patterns: [
      /\bsales\s+cycle\s+(?:is\s+)?(\d+)(?:st|nd|rd|th)?\s+to\s+(\d+)(?:st|nd|rd|th)?/i,
      /\bcycle\s+(?:from\s+)?(\d+)(?:st|nd|rd|th)?\s+to\s+(\d+)(?:st|nd|rd|th)?/i,
      /\b(\d+)(?:st|nd|rd|th)?\s+to\s+(\d+)(?:st|nd|rd|th)?\s+(?:sales\s+)?cycle/i,
    ],
    category: 'reporting',
    key: 'sales_cycle',
    extractor: (match) => ({
      start: parseInt(match[1], 10),
      end: parseInt(match[2], 10),
    }),
    confidence: 95,
  },

  // Lead Filter - Confidence threshold
  {
    patterns: [
      /\bavoid\s+(?:borderline|low(?:\s+confidence)?)\s+leads/i,
      /\bonly\s+(?:high|strong)\s+confidence\s+leads/i,
      /\bminimum\s+(?:confidence|score)\s+(?:of\s+)?(\d+)/i,
      /\blead\s+confidence\s+(?:above|over|at\s+least)\s+(\d+)/i,
    ],
    category: 'lead_filter',
    key: 'min_confidence',
    extractor: (match, text) => {
      // If specific number provided, use it
      if (match[1]) return parseInt(match[1], 10);
      // "borderline" = 70%, "high" = 80%
      if (/borderline|low/i.test(text)) return 70;
      if (/high|strong/i.test(text)) return 80;
      return 60;
    },
    confidence: 85,
  },

  // Lead Filter - Region
  {
    patterns: [
      /\bonly\s+(?:show\s+)?leads?\s+(?:from|in)\s+(.+)/i,
      /\bfocus\s+on\s+(.+)\s+(?:region|market|territory)/i,
    ],
    category: 'lead_filter',
    key: 'region_filter',
    extractor: (match) => match[1]?.trim(),
    confidence: 75,
  },

  // Timing - Working hours
  {
    patterns: [
      /\bworking\s+hours?\s+(?:are\s+)?(\d{1,2})(?::?\d{2})?\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::?\d{2})?\s*(am|pm)?/i,
      /\bi\s+work\s+(?:from\s+)?(\d{1,2})(?::?\d{2})?\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::?\d{2})?\s*(am|pm)?/i,
    ],
    category: 'timing',
    key: 'working_hours',
    extractor: (match) => {
      let start = parseInt(match[1], 10);
      const startPeriod = match[2]?.toLowerCase();
      let end = parseInt(match[3], 10);
      const endPeriod = match[4]?.toLowerCase();

      // Convert to 24h based on AM/PM per-hour
      // If PM and hour < 12, add 12
      // If AM and hour == 12, set to 0
      if (startPeriod === 'pm' && start < 12) start += 12;
      if (startPeriod === 'am' && start === 12) start = 0;
      if (endPeriod === 'pm' && end < 12) end += 12;
      if (endPeriod === 'am' && end === 12) end = 0;

      return { start, end };
    },
    confidence: 80,
  },

  // Notification - Disable
  {
    patterns: [
      /\b(?:no|don'?t|stop)\s+(?:send(?:ing)?|email(?:s|ing)?)/i,
      /\bturno\s+off\s+(?:email|notification)s?/i,
      /\bdisable\s+(?:email|notification)s?/i,
    ],
    category: 'notification',
    key: 'email_enabled',
    extractor: () => false,
    confidence: 90,
  },

  // Notification - Enable
  {
    patterns: [
      /\benable\s+(?:email|notification)s?/i,
      /\bsend\s+me\s+(?:email|notification)s?/i,
      /\bturn\s+on\s+(?:email|notification)s?/i,
    ],
    category: 'notification',
    key: 'email_enabled',
    extractor: () => true,
    confidence: 90,
  },

  // Display - Theme
  {
    patterns: [
      /\b(dark|light)\s+(?:mode|theme)/i,
      /\buse\s+(dark|light)\s+(?:mode|theme)/i,
    ],
    category: 'display',
    key: 'theme',
    extractor: (match) => match[1].toLowerCase(),
    confidence: 95,
  },
];

// =============================================================================
// PARSER
// =============================================================================

/**
 * Parse natural language preference text
 */
export function parsePreference(text: string): ParseResult {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return {
      success: false,
      error: 'Please enter a preference.',
    };
  }

  // Try each pattern
  for (const pattern of PREFERENCE_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = trimmedText.match(regex);
      if (match) {
        try {
          const value = pattern.extractor(match, trimmedText);
          return {
            success: true,
            preference: {
              category: pattern.category,
              key: pattern.key,
              value,
              originalText: trimmedText,
              confidence: pattern.confidence,
            },
          };
        } catch (error) {
          console.error('[PreferenceParser] Extraction error:', error);
          continue;
        }
      }
    }
  }

  // No pattern matched
  return {
    success: false,
    error: 'I couldn\'t understand that preference.',
    suggestions: [
      'Try: "Send me daily reports"',
      'Try: "My sales cycle is 1st to 1st"',
      'Try: "Avoid borderline leads"',
    ],
  };
}

/**
 * Get all supported preference categories
 */
export function getSupportedCategories(): PreferenceCategory[] {
  return ['reporting', 'notification', 'lead_filter', 'timing', 'display'];
}

/**
 * Get example phrases for each category
 */
export function getExamplePhrases(category?: PreferenceCategory): string[] {
  const examples: Record<PreferenceCategory, string[]> = {
    reporting: [
      'My sales cycle is 5th to 5th',
      'Send me monthly reports',
    ],
    notification: [
      'Send me daily emails',
      'Turn off notifications',
    ],
    lead_filter: [
      'Avoid borderline leads',
      'Only show high confidence leads',
      'Focus on Dubai region',
    ],
    timing: [
      'Working hours are 9am to 6pm',
    ],
    display: [
      'Use dark mode',
    ],
    unknown: [],
  };

  if (category) {
    return examples[category] || [];
  }

  // Return all examples
  return Object.values(examples).flat();
}

// =============================================================================
// EXPORTS
// =============================================================================

export const preferenceParser = {
  parse: parsePreference,
  getCategories: getSupportedCategories,
  getExamples: getExamplePhrases,
};

export default preferenceParser;
