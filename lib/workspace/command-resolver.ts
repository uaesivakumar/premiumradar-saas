/**
 * Command Resolver - S373: Command Palette (Non-Chat)
 *
 * Resolves natural language input to cards, not chat messages.
 *
 * WORKSPACE UX (LOCKED):
 * - Input resolves to card(s)
 * - No chat bubbles
 * - No conversation history
 */

import {
  Card,
  createSignalCard,
  createDecisionCard,
  createSystemCard,
} from './card-state';
import { getExpiryTime } from './ttl-engine';
import { handleRecallQuery } from './recall-engine';
import { parsePreference, ParseResult } from './preference-parser';
import {
  validatePreference,
  createPreferenceAppliedCard,
  createPreferenceRejectedCard,
  createPreferenceParseFailedCard,
} from './preference-validator';
import { usePreferenceStore } from './preference-store';

// =============================================================================
// TYPES
// =============================================================================

export type CommandIntent =
  | 'check_company'
  | 'find_leads'
  | 'recall'
  | 'preference'
  | 'nba_request'
  | 'help'
  | 'unknown';

export interface CommandResolution {
  intent: CommandIntent;
  entityName?: string;
  entityId?: string;
  query: string;
  confidence: number;
}

export interface ResolveResult {
  success: boolean;
  cards: Omit<Card, 'id' | 'createdAt' | 'status'>[];
  error?: string;
}

// =============================================================================
// INTENT PATTERNS
// =============================================================================

const INTENT_PATTERNS: Array<{
  intent: CommandIntent;
  patterns: RegExp[];
  priority: number;
}> = [
  {
    intent: 'check_company',
    patterns: [
      /^check\s+(.+)/i,
      /^evaluate\s+(.+)/i,
      /^analyze\s+(.+)/i,
      /^what\s+about\s+(.+)/i,
      /^tell\s+me\s+about\s+(.+)/i,
      /^look\s+up\s+(.+)/i,
    ],
    priority: 100,
  },
  {
    intent: 'find_leads',
    patterns: [
      /^find\s+(.+)/i,
      /^search\s+for\s+(.+)/i,
      /^discover\s+(.+)/i,
      /^show\s+me\s+(.+)/i,
      /^get\s+(.+)/i,
    ],
    priority: 90,
  },
  {
    intent: 'recall',
    patterns: [
      /^remember\s+(.+)/i,
      /^what\s+did\s+(I|we)\s+decide\s+about\s+(.+)/i,
      /^history\s+(.+)/i,
      /^previous\s+(.+)/i,
    ],
    priority: 80,
  },
  {
    intent: 'preference',
    patterns: [
      /^(set|change|update)\s+(my\s+)?preference/i,
      /^I\s+(prefer|want|like)/i,
      /^don't\s+show\s+me/i,
      /^always\s+show\s+me/i,
      // S376: NL preference patterns
      /\b(daily|weekly|monthly)\s+(email|report|summary)/i,
      /\bsend\s+(?:me\s+)?(?:a\s+)?(daily|weekly|monthly)/i,
      /\bsales\s+cycle\s+(?:is\s+)?\d+/i,
      /\bavoid\s+(?:borderline|low)\s+leads/i,
      /\bonly\s+(?:high|strong)\s+confidence/i,
      /\bworking\s+hours?\s+(?:are\s+)?\d+/i,
      /\b(dark|light)\s+(?:mode|theme)/i,
      /\b(disable|enable|turn\s+off|turn\s+on)\s+(?:email|notification)/i,
    ],
    priority: 70,
  },
  {
    intent: 'nba_request',
    patterns: [
      /^what\s+should\s+I\s+do/i,
      /^what's\s+next/i,
      /^next\s+best\s+action/i,
      /^suggest\s+something/i,
    ],
    priority: 95,
  },
  {
    intent: 'help',
    patterns: [
      /^help/i,
      /^what\s+can\s+you\s+do/i,
      /^how\s+do\s+I/i,
      /^\?$/,
    ],
    priority: 50,
  },
];

// =============================================================================
// INTENT CLASSIFICATION
// =============================================================================

/**
 * Classify user input into an intent
 */
export function classifyIntent(input: string): CommandResolution {
  const trimmed = input.trim();

  for (const { intent, patterns, priority } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return {
          intent,
          entityName: match[1]?.trim() || match[2]?.trim(),
          query: trimmed,
          confidence: priority,
        };
      }
    }
  }

  // Unknown intent - treat as company check if it looks like a company name
  if (isLikelyCompanyName(trimmed)) {
    return {
      intent: 'check_company',
      entityName: trimmed,
      query: trimmed,
      confidence: 60,
    };
  }

  return {
    intent: 'unknown',
    query: trimmed,
    confidence: 0,
  };
}

/**
 * Check if input looks like a company name
 */
function isLikelyCompanyName(input: string): boolean {
  // Company name indicators
  const companyIndicators = [
    /\b(pvt|ltd|inc|corp|llc|limited|private|company|co)\b/i,
    /\b(technologies|solutions|services|consulting|group)\b/i,
    /\b(infra|industries|enterprises|systems)\b/i,
  ];

  return companyIndicators.some((pattern) => pattern.test(input));
}

// =============================================================================
// COMMAND RESOLUTION
// =============================================================================

/**
 * Resolve a command to cards
 *
 * TODO: S374+ will wire this to OS/SIVA APIs
 * For now, creates placeholder cards to demonstrate the flow
 */
export async function resolveCommand(input: string): Promise<ResolveResult> {
  const resolution = classifyIntent(input);

  try {
    switch (resolution.intent) {
      case 'check_company':
        return await handleCheckCompany(resolution);

      case 'find_leads':
        return await handleFindLeads(resolution);

      case 'recall':
        return await handleRecall(resolution);

      case 'preference':
        return await handlePreference(resolution);

      case 'nba_request':
        return await handleNBARequest(resolution);

      case 'help':
        return handleHelp();

      default:
        return handleUnknown(resolution);
    }
  } catch (error) {
    console.error('[CommandResolver] Error:', error);
    return {
      success: false,
      cards: [],
      error: error instanceof Error ? error.message : 'Failed to process command',
    };
  }
}

// =============================================================================
// INTENT HANDLERS
// =============================================================================

async function handleCheckCompany(resolution: CommandResolution): Promise<ResolveResult> {
  const companyName = resolution.entityName || 'Unknown Company';

  // TODO: S374 - Call OS/SIVA for actual company evaluation
  // For now, create a placeholder decision card
  return {
    success: true,
    cards: [
      {
        type: 'decision',
        priority: 800,
        title: `Evaluating: ${companyName}`,
        summary: `Analysis in progress. Decision card will appear when complete.`,
        expiresAt: null, // Decisions never expire
        sourceType: 'decision',
        entityName: companyName,
        entityType: 'company',
        actions: [
          { id: 'view-reasoning', label: 'Why?', type: 'secondary', handler: 'decision.viewReasoning' },
        ],
        tags: ['pending-evaluation'],
      },
    ],
  };
}

async function handleFindLeads(resolution: CommandResolution): Promise<ResolveResult> {
  const query = resolution.entityName || resolution.query;

  // TODO: S374 - Call OS discovery API
  return {
    success: true,
    cards: [
      {
        type: 'signal',
        priority: 600,
        title: `Searching: ${query}`,
        summary: 'Discovery in progress. Results will appear as signal cards.',
        expiresAt: getExpiryTime('signal'),
        sourceType: 'signal',
        actions: [
          { id: 'cancel', label: 'Cancel', type: 'dismiss', handler: 'signal.cancel' },
        ],
        tags: ['discovery', 'pending'],
      },
    ],
  };
}

async function handleRecall(resolution: CommandResolution): Promise<ResolveResult> {
  const entityName = resolution.entityName;

  if (!entityName) {
    return {
      success: false,
      cards: [],
      error: 'Please specify what you want to recall. Example: "What did we decide about ABC Corp?"',
    };
  }

  // S375: Use recall engine to search past decisions
  try {
    const recallCards = await handleRecallQuery(entityName);
    return {
      success: true,
      cards: recallCards,
    };
  } catch (error) {
    console.error('[CommandResolver] Recall error:', error);
    return {
      success: false,
      cards: [],
      error: 'Failed to recall past decisions.',
    };
  }
}

async function handlePreference(resolution: CommandResolution): Promise<ResolveResult> {
  // S376: Parse natural language preference
  const parseResult = parsePreference(resolution.query);

  // Parse failed - return helpful card with suggestions
  if (!parseResult.success || !parseResult.preference) {
    return {
      success: true,
      cards: [createPreferenceParseFailedCard(resolution.query, parseResult.suggestions)],
    };
  }

  const preference = parseResult.preference;

  // Validate against policy
  const validation = validatePreference(preference);

  if (!validation.valid) {
    // Rejected by policy - return rejection card
    return {
      success: true,
      cards: [createPreferenceRejectedCard(preference, validation)],
    };
  }

  // Valid preference - persist to store and return success card
  // S377: Actually persist to user preferences store
  const { setPreference } = usePreferenceStore.getState();
  setPreference(
    preference.key,
    preference.value,
    preference.category,
    preference.originalText
  );

  console.log('[CommandResolver] Preference applied:', preference.key, '=', preference.value);

  return {
    success: true,
    cards: [createPreferenceAppliedCard(preference)],
  };
}

async function handleNBARequest(resolution: CommandResolution): Promise<ResolveResult> {
  // TODO: S374 - Call NBA engine
  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: 'Finding Next Best Action',
        summary: 'Analyzing your context to suggest the best next step...',
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        actions: [],
        tags: ['nba-request'],
      },
    ],
  };
}

function handleHelp(): ResolveResult {
  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: 'How Can I Help?',
        summary: 'Try: "Check ABC Corp", "Find expanding companies", or "What should I do next?"',
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        reasoning: [
          'Check [company name] - Evaluate a specific company',
          'Find [criteria] - Discover leads matching your criteria',
          'What should I do next? - Get your next best action',
        ],
        actions: [
          { id: 'dismiss', label: 'Got it', type: 'dismiss', handler: 'system.dismiss' },
        ],
      },
    ],
  };
}

function handleUnknown(resolution: CommandResolution): ResolveResult {
  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: "I didn't quite understand",
        summary: `Try: "Check [company name]" or "Find leads in [region]"`,
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        actions: [
          { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
        ],
      },
    ],
  };
}

// =============================================================================
// SMART HINTS
// =============================================================================

/**
 * Get context-aware hints for the command palette
 */
export function getSmartHints(context?: {
  hasCards: boolean;
  hasNBA: boolean;
  savedLeadsCount: number;
}): string[] {
  const hints: string[] = [];

  if (!context?.hasCards) {
    hints.push("Try: 'Find expanding companies in UAE'");
  }

  if (!context?.hasNBA) {
    hints.push("Ask: 'What should I do next?'");
  }

  if (context?.savedLeadsCount === 0) {
    hints.push("Tip: Save leads to build your pipeline");
  }

  // Default hints
  if (hints.length === 0) {
    hints.push("Ask about a company or type 'what should I do next?'");
  }

  return hints;
}
