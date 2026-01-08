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
  createContextCard,
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
import {
  useDiscoveryContextStore,
  buildSIVAContext,
  getLoaderText,
  WorkspaceContext,
} from './discovery-context';
import { useCardStore } from '@/lib/stores/card-store';

// =============================================================================
// TYPES
// =============================================================================

export type CommandIntent =
  | 'check_company'
  | 'find_leads'
  | 'recall'
  | 'preference'
  | 'nba_request'
  | 'system_status_query'  // S380: Meta questions about workspace state
  | 'clear_workspace'      // S381: Clear all cards
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
      /^search\s+(.+)/i,           // S381: "search X" without "for"
      /^discover\s+(.+)/i,
      /^show\s+me\s+(.+)/i,
      /^get\s+(.+)/i,
      /^(.+)\s+companies$/i,       // S381: "ADGM companies", "tech companies"
      /^(.+)\s+leads$/i,           // S381: "ADGM leads", "banking leads"
      /^list\s+(.+)/i,             // S381: "list companies in X"
    ],
    priority: 90,
  },
  {
    intent: 'recall',
    patterns: [
      /^remember\s+(.+)/i,
      /^what\s+did\s+(?:I|we)\s+decide\s+about\s+(.+)/i,
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
  // S380: System status query - HIGH PRIORITY, must bypass fallback
  {
    intent: 'system_status_query',
    patterns: [
      /^what('s|\s+is)\s+(happening|going\s+on)/i,
      /^what\s+happened/i,
      /^are\s+you\s+stuck/i,
      /^where\s+are\s+(my\s+)?results/i,
      /^why\s+(no|aren't\s+there\s+any)\s+results/i,
      /^why\s+no\s+results\s+yet/i,
      /^status/i,
      /^is\s+(it|discovery)\s+(working|running)/i,
      /^how\s+long\s+(will|has)\s+(this|it)/i,
      /^what('s|\s+is)\s+the\s+status/i,
      /^anything\s+(yet|new)/i,
    ],
    priority: 110, // Higher than all others to catch meta questions
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
  // S381: Clear workspace command
  {
    intent: 'clear_workspace',
    patterns: [
      /^clear$/i,
      /^clear\s+(all|screen|workspace|cards)/i,
      /^reset$/i,
      /^reset\s+(workspace|cards)/i,
      /^start\s+over$/i,
      /^new\s+session$/i,
    ],
    priority: 120, // Highest priority - always execute
  },
];

// =============================================================================
// S381: INTENT TO HUMAN-READABLE
// =============================================================================

/**
 * Convert intent enum to human-readable description
 */
function intentToHumanReadable(intent: CommandIntent, entityName?: string): string {
  const descriptions: Record<CommandIntent, string> = {
    check_company: entityName ? `Evaluating "${entityName}"` : 'Company evaluation',
    find_leads: entityName ? `Finding ${entityName}` : 'Discovering leads',
    recall: entityName ? `Recalling decisions about "${entityName}"` : 'Looking up history',
    preference: 'Setting preference',
    nba_request: 'Finding your next best action',
    system_status_query: 'Checking workspace status',
    clear_workspace: 'Clearing workspace',
    help: 'Showing help',
    unknown: 'Processing request',
  };

  return descriptions[intent] || 'Processing request';
}

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

      // S380: System status query - context-aware response
      case 'system_status_query':
        return handleSystemStatusQuery(resolution);

      case 'help':
        return handleHelp();

      // S381: Clear workspace command
      case 'clear_workspace':
        return handleClearWorkspace();

      default:
        // S380: Check context before showing "I didn't understand"
        return handleUnknownWithContext(resolution);
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
  const context = buildSIVAContext();

  // S381: Start discovery loader animation
  useDiscoveryContextStore.getState().startDiscovery({
    vertical: context.vertical,
    subVertical: context.subVertical,
    region: context.region,
  });

  // S381: Minimum loader display time (2 seconds) to ensure user sees progress
  const loaderStartTime = Date.now();
  const MIN_LOADER_TIME_MS = 2000;

  // S380: Call OS discovery API
  try {
    const response = await fetch('/api/os/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // S381: Required for session cookie
      body: JSON.stringify({
        tenant_id: 'workspace',
        vertical_id: context.vertical?.toLowerCase() || 'banking',
        sub_vertical_id: context.subVertical?.toLowerCase().replace(/\s+/g, '_') || 'employee_banking',
        region_code: context.region || 'UAE',
        query: query,
      }),
    });

    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data?.companies?.length) {
      // S381: Wait for minimum loader time before completing
      const elapsed = Date.now() - loaderStartTime;
      if (elapsed < MIN_LOADER_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADER_TIME_MS - elapsed));
      }
      // S381: Complete discovery (no results)
      useDiscoveryContextStore.getState().completeDiscovery();
      return {
        success: true,
        cards: [
          {
            type: 'system',
            priority: 500,
            title: 'No Matches Found',
            summary: `No companies found for "${query}". Try a different search term.`,
            expiresAt: getExpiryTime('system'),
            sourceType: 'system',
            actions: [
              { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
            ],
            tags: ['discovery', 'no-results'],
          },
        ],
      };
    }

    // Convert OS companies to signal cards
    const signalCards = result.data.companies.slice(0, 10).map((company: any, index: number) => ({
      type: 'signal' as const,
      priority: 800 - index * 20,
      title: company.name,
      summary: company.signals?.[0]?.title || 'Potential opportunity detected',
      expandedContent: {
        score: company.sivaScores?.overall || company.confidenceScore * 100,
        reasoning: company.sivaScores?.reasoning?.join(' ') || 'Signal detected via live discovery',
        tier: company.sivaScores?.tier || 'WARM',
        products: company.sivaScores?.recommendedProducts || [],
        location: company.location || company.city,
        industry: company.industry,
      },
      expiresAt: getExpiryTime('signal'),
      sourceType: 'signal' as const,
      entityId: company.id,
      entityName: company.name,
      entityType: 'company' as const,
      reasoning: company.sivaScores?.reasoning || ['Live discovery signal'],
      actions: [
        { id: 'evaluate', label: 'Evaluate', type: 'primary' as const, handler: 'signal.evaluate' },
        { id: 'save', label: 'Save', type: 'secondary' as const, handler: 'signal.save' },
        { id: 'dismiss', label: 'Skip', type: 'dismiss' as const, handler: 'signal.dismiss' },
      ],
      tags: ['signal', 'discovery', `tier-${company.sivaScores?.tier?.toLowerCase() || 'warm'}`],
    }));

    // S381: Wait for minimum loader time before completing
    const elapsed = Date.now() - loaderStartTime;
    if (elapsed < MIN_LOADER_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADER_TIME_MS - elapsed));
    }
    // S381: Complete discovery (success)
    useDiscoveryContextStore.getState().completeDiscovery();

    return {
      success: true,
      cards: signalCards,
    };
  } catch (error) {
    console.error('[CommandResolver] Discovery error:', error);
    // S381: Wait for minimum loader time before failing
    const elapsed = Date.now() - loaderStartTime;
    if (elapsed < MIN_LOADER_TIME_MS) {
      await new Promise(resolve => setTimeout(resolve, MIN_LOADER_TIME_MS - elapsed));
    }
    // S381: Fail discovery on error
    useDiscoveryContextStore.getState().failDiscovery(error instanceof Error ? error.message : 'Unknown error');
    return {
      success: true,
      cards: [
        {
          type: 'system',
          priority: 500,
          title: 'Discovery Failed',
          summary: 'Unable to search at this time. Please try again.',
          expiresAt: getExpiryTime('system'),
          sourceType: 'system',
          actions: [
            { id: 'retry', label: 'Try Again', type: 'primary', handler: 'system.retry' },
            { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
          ],
          tags: ['discovery', 'error'],
        },
      ],
    };
  }
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
  const context = buildSIVAContext();

  try {
    // Call NBA API endpoint
    const params = new URLSearchParams();
    if (context.subVertical) params.set('workspaceId', context.subVertical);
    params.set('activity', 'active');

    const response = await fetch(`/api/workspace/nba?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    const result = await response.json();

    if (!result.success || !result.data) {
      // No NBA available - show helpful message
      return {
        success: true,
        cards: [
          {
            type: 'system',
            priority: 100,
            title: 'No Actions Available',
            summary: result.meta?.selectionReason || 'No actionable leads at the moment. Try discovering new companies first.',
            expiresAt: getExpiryTime('system'),
            sourceType: 'system',
            actions: [
              { id: 'discover', label: 'Discover Leads', type: 'primary', handler: 'system.discover' },
              { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
            ],
            tags: ['nba-empty'],
          },
        ],
      };
    }

    // NBA found - card is automatically added by the adapter via addCard
    // Return empty cards array since NBA adapter handles it
    const nba = result.data;
    return {
      success: true,
      cards: [
        {
          type: 'nba',
          priority: 1000, // Highest priority
          title: nba.actionText,
          summary: nba.reason,
          expandedContent: {
            supportingInfo: nba.supportingInfo,
            urgency: nba.urgency,
            score: nba.score,
            companyName: nba.companyName,
            contactName: nba.contactName,
          },
          expiresAt: nba.expiresAt || getExpiryTime('nba'),
          sourceType: 'nba',
          sourceId: nba.id,
          entityId: nba.leadId,
          entityName: nba.companyName,
          entityType: 'company',
          actions: [
            { id: 'do-now', label: 'Do Now', type: 'primary', handler: 'nba.execute' },
            { id: 'defer', label: 'Defer', type: 'secondary', handler: 'nba.defer' },
          ],
          tags: [`nba-${nba.type?.toLowerCase().replace('_', '-') || 'action'}`, `urgency-${nba.urgency || 'medium'}`],
        },
      ],
    };
  } catch (error) {
    console.error('[CommandResolver] NBA request error:', error);
    return {
      success: true,
      cards: [
        {
          type: 'system',
          priority: 100,
          title: 'Unable to Find Actions',
          summary: 'Could not retrieve recommendations. Please try again.',
          expiresAt: getExpiryTime('system'),
          sourceType: 'system',
          actions: [
            { id: 'retry', label: 'Retry', type: 'primary', handler: 'system.retry' },
            { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
          ],
          tags: ['nba-error'],
        },
      ],
    };
  }
}

function handleHelp(): ResolveResult {
  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: 'How Can I Help?',
        summary: 'Try: "Check ABC Corp", "Find expanding companies", "clear" to reset, or "What should I do next?"',
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        reasoning: [
          'Check [company name] - Evaluate a specific company',
          'Find [criteria] - Discover leads matching your criteria',
          'What should I do next? - Get your next best action',
          'clear - Reset workspace and remove all cards',
        ],
        actions: [
          { id: 'dismiss', label: 'Got it', type: 'dismiss', handler: 'system.dismiss' },
        ],
      },
    ],
  };
}

// =============================================================================
// S381: CLEAR WORKSPACE HANDLER
// =============================================================================

/**
 * Clear all cards from workspace
 * Returns a confirmation card, actual clearing happens via special flag
 */
function handleClearWorkspace(): ResolveResult {
  // Clear the card store
  useCardStore.getState().clear();

  // Clear discovery context
  useDiscoveryContextStore.getState().reset();

  console.log('[CommandResolver] Workspace cleared');

  // Return a brief confirmation card
  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: 'Workspace Cleared',
        summary: 'All cards have been removed. Start fresh with a new search.',
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        actions: [
          { id: 'dismiss', label: 'Got it', type: 'dismiss', handler: 'system.dismiss' },
        ],
        tags: ['workspace-cleared'],
      },
    ],
  };
}

// =============================================================================
// S380: SYSTEM STATUS QUERY HANDLER
// =============================================================================

/**
 * Handle meta questions about workspace state
 * CRITICAL: Must respond with context, NEVER with "I didn't understand"
 */
function handleSystemStatusQuery(resolution: CommandResolution): ResolveResult {
  const context = buildSIVAContext();

  // Discovery is actively running
  if (context.activeDiscovery) {
    return createDiscoveryStatusCard(context);
  }

  // Discovery recently completed
  if (context.discoveryStatus === 'complete' && context.cardCount > 0) {
    return createCompletionStatusCard(context);
  }

  // Has cards but no active discovery
  if (context.cardCount > 0) {
    return createIdleWithCardsCard(context);
  }

  // No context - provide helpful guidance
  return createNoContextCard(context);
}

/**
 * Create card explaining active discovery status
 */
function createDiscoveryStatusCard(context: WorkspaceContext): ResolveResult {
  const loaderText = getLoaderText(context.progressPhase);

  const statusMessages: Record<string, string> = {
    starting: 'Discovery is starting up.',
    searching: `${loaderText}`,
    filtering: `${loaderText}`,
    scoring: 'Scoring leads for relevance.',
    shortlisting: 'Creating your shortlist.',
    complete: 'Discovery is complete.',
    error: 'Discovery encountered an issue.',
  };

  const summary = statusMessages[context.discoveryStatus] || 'Discovery is in progress.';

  const details = [
    context.elapsedTime ? `Elapsed: ${context.elapsedTime}` : null,
    `Region: ${context.region}`,
    context.expectedNext === 'signal_cards'
      ? 'Early signals usually appear within a few minutes.'
      : null,
  ].filter(Boolean).join(' • ');

  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 150, // Higher than default system cards
        title: 'Discovery in Progress',
        summary: `${summary} ${details}`,
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        reasoning: [
          `I'm scanning ${context.region} for ${context.subVertical} opportunities.`,
          'Deeper validation may take longer.',
          'Results will appear as signal cards.',
        ],
        actions: [
          { id: 'dismiss', label: 'Got it', type: 'dismiss', handler: 'system.dismiss' },
        ],
        tags: ['discovery-status', 'system-status'],
      },
    ],
  };
}

/**
 * Create card for completed discovery
 */
function createCompletionStatusCard(context: WorkspaceContext): ResolveResult {
  const hasNBAText = context.hasNBA
    ? 'I\'ve identified a top recommendation for you.'
    : '';

  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 120,
        title: 'Discovery Complete',
        summary: `Found ${context.cardCount} result${context.cardCount !== 1 ? 's' : ''}. ${hasNBAText}`,
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        reasoning: [
          `Discovery completed for ${context.subVertical} in ${context.region}.`,
          context.cardsPresent.includes('signal') ? 'Signal cards are ready for review.' : null,
          context.hasNBA ? 'Check the top card for your next best action.' : null,
        ].filter(Boolean) as string[],
        actions: [
          { id: 'dismiss', label: 'Got it', type: 'dismiss', handler: 'system.dismiss' },
        ],
        tags: ['discovery-complete', 'system-status'],
      },
    ],
  };
}

/**
 * Create card when cards exist but no active discovery
 */
function createIdleWithCardsCard(context: WorkspaceContext): ResolveResult {
  const cardTypes = context.cardsPresent.join(', ');

  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: 'Workspace Status',
        summary: `You have ${context.cardCount} active card${context.cardCount !== 1 ? 's' : ''} (${cardTypes}).`,
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        reasoning: [
          'No discovery is currently running.',
          context.hasNBA ? 'A recommended action is available.' : null,
          'Try "Find expanding companies" to start a new search.',
        ].filter(Boolean) as string[],
        actions: [
          { id: 'dismiss', label: 'Got it', type: 'dismiss', handler: 'system.dismiss' },
        ],
        tags: ['workspace-status', 'system-status'],
      },
    ],
  };
}

/**
 * Create card when no context exists
 */
function createNoContextCard(context: WorkspaceContext): ResolveResult {
  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: 'Ready to Start',
        summary: `No active discovery. Try "Find companies hiring in ${context.region}" to begin.`,
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        reasoning: [
          `Workspace is set to ${context.subVertical} in ${context.region}.`,
          'Start a discovery to find leads.',
        ],
        actions: [
          { id: 'dismiss', label: 'Got it', type: 'dismiss', handler: 'system.dismiss' },
        ],
        tags: ['no-context', 'system-status'],
      },
    ],
  };
}

// =============================================================================
// S380: CONTEXT-AWARE UNKNOWN HANDLER
// =============================================================================

/**
 * Handle unknown intent WITH context awareness
 * RULE: If context exists, explain state - DON'T show "I didn't understand"
 */
function handleUnknownWithContext(resolution: CommandResolution): ResolveResult {
  const context = buildSIVAContext();

  // If ANY context exists, explain instead of showing error
  if (context.activeDiscovery || context.cardCount > 0 || context.jobId) {
    return handleSystemStatusQuery(resolution);
  }

  // No context - show gentle guidance (not error)
  return {
    success: true,
    cards: [
      {
        type: 'system',
        priority: 100,
        title: 'How Can I Help?',
        summary: `Try: "Check [company name]" or "Find leads in ${context.region}"`,
        expiresAt: getExpiryTime('system'),
        sourceType: 'system',
        reasoning: [
          'I can help you discover leads, check companies, or recall past decisions.',
          `Your workspace is set to ${context.subVertical} in ${context.region}.`,
        ],
        actions: [
          { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
        ],
        tags: ['guidance', 'no-match'],
      },
    ],
  };
}

// DEPRECATED: Use handleUnknownWithContext instead
function handleUnknown(resolution: CommandResolution): ResolveResult {
  return handleUnknownWithContext(resolution);
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
