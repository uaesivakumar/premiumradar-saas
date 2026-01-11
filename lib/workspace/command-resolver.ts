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
// S391: REASONING TEMPLATE HELPERS
// =============================================================================

/**
 * Convert signal tag to human-readable label
 * Template-based, deterministic, no AI
 */
const SIGNAL_LABELS: Record<string, string> = {
  'hiring-expansion': 'Hiring signal',
  'headcount-jump': 'Growth signal',
  'office-opening': 'New office signal',
  'market-entry': 'Market entry signal',
  'funding-round': 'Funding signal',
  'project-award': 'Project award signal',
  'subsidiary-creation': 'New entity signal',
};

function getSignalLabel(tags?: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  for (const tag of tags) {
    if (SIGNAL_LABELS[tag]) return SIGNAL_LABELS[tag];
  }
  return null;
}

/**
 * Convert timestamp to human-readable freshness
 * Template-based: "today", "1 day ago", "2 days ago", etc.
 */
function getFreshnessText(createdAt?: Date | string): string {
  if (!createdAt) return 'recently';

  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

/**
 * S392: Build alternatives array for competitive context
 * Shows other options (max 2) for situational awareness
 * Template-based action labels based on lead status
 */
function buildAlternatives(
  leads: Array<{ entityName?: string; title: string; status: string; tags?: string[] }>,
  excludeFirst: boolean = true
): Array<{ name: string; action: string }> {
  const candidates = excludeFirst ? leads.slice(1) : leads;
  return candidates.slice(0, 2).map(lead => {
    // Determine action based on status and signal type
    const name = lead.entityName || lead.title;
    let action = 'review';

    if (lead.status === 'saved') {
      action = 'contact later';
    } else if (lead.status === 'evaluating') {
      action = 'finish evaluation';
    } else if (lead.status === 'active') {
      // Check signal type for more specific action
      const hasHiringSignal = lead.tags?.some(t => t.includes('hiring') || t.includes('headcount'));
      const hasGrowthSignal = lead.tags?.some(t => t.includes('funding') || t.includes('expansion'));
      if (hasHiringSignal) action = 'research';
      else if (hasGrowthSignal) action = 'monitor';
      else action = 'review';
    }

    return { name, action };
  });
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
// S382: INTENT GATING - Location Constraint Extraction & Validation
// =============================================================================

/**
 * Known UAE locations for constraint matching
 * Used to extract explicit location requirements from queries
 */
const UAE_LOCATIONS: Record<string, string[]> = {
  // Cities
  'dubai': ['dubai'],
  'abu dhabi': ['abu dhabi', 'abudhabi', 'abu-dhabi'],
  'sharjah': ['sharjah'],
  'ajman': ['ajman'],
  'ras al khaimah': ['ras al khaimah', 'rak'],
  'fujairah': ['fujairah'],
  'umm al quwain': ['umm al quwain', 'uaq'],
  // Free zones / Special areas
  'masdar city': ['masdar city', 'masdar'],
  'difc': ['difc', 'dubai international financial centre'],
  'adgm': ['adgm', 'abu dhabi global market'],
  'jafza': ['jafza', 'jebel ali free zone'],
  'dafza': ['dafza', 'dubai airport free zone'],
  'dmcc': ['dmcc', 'dubai multi commodities centre'],
  'twofour54': ['twofour54'],
  'khalifa industrial zone': ['kizad', 'khalifa industrial zone'],
  'saadiyat': ['saadiyat', 'saadiyat island'],
  'yas island': ['yas island', 'yas'],
  'silicon oasis': ['dso', 'dubai silicon oasis', 'silicon oasis'],
};

/**
 * Location constraints extracted from a query
 */
interface LocationConstraints {
  hasLocationFilter: boolean;
  city?: string;           // e.g., "Abu Dhabi"
  specificArea?: string;   // e.g., "Masdar City"
  originalQuery: string;
}

/**
 * Parse location constraints from user query
 * Returns explicit location requirements that MUST be satisfied
 */
function parseLocationConstraints(query: string): LocationConstraints {
  const lowerQuery = query.toLowerCase();
  const constraints: LocationConstraints = {
    hasLocationFilter: false,
    originalQuery: query,
  };

  // Check for specific areas first (more specific = higher priority)
  for (const [canonical, variants] of Object.entries(UAE_LOCATIONS)) {
    for (const variant of variants) {
      if (lowerQuery.includes(variant)) {
        constraints.hasLocationFilter = true;
        // Determine if it's a city or specific area
        const cities = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain'];
        if (cities.includes(canonical)) {
          constraints.city = canonical;
        } else {
          constraints.specificArea = canonical;
          // Infer city from specific area
          if (['masdar city', 'adgm', 'saadiyat', 'yas island', 'khalifa industrial zone'].includes(canonical)) {
            constraints.city = 'abu dhabi';
          } else if (['difc', 'jafza', 'dafza', 'dmcc', 'silicon oasis', 'twofour54'].includes(canonical)) {
            constraints.city = 'dubai';
          }
        }
        break;
      }
    }
    if (constraints.hasLocationFilter) break;
  }

  // Also check for explicit location keywords
  const locationPatterns = [
    /\b(?:in|located in|based in|from|at)\s+([A-Za-z\s]+?)(?:\s*,|\s+(?:uae|emirates)|$)/i,
    /\b([A-Za-z\s]+?)\s+companies\b/i,
    /\bcompanies\s+(?:in|at|from)\s+([A-Za-z\s]+)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      const extractedLocation = match[1]?.toLowerCase().trim();
      // Validate against known locations
      for (const [canonical, variants] of Object.entries(UAE_LOCATIONS)) {
        if (variants.some(v => extractedLocation.includes(v) || v.includes(extractedLocation))) {
          constraints.hasLocationFilter = true;
          const cities = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain'];
          if (cities.includes(canonical)) {
            constraints.city = canonical;
          } else {
            constraints.specificArea = canonical;
          }
          break;
        }
      }
    }
    if (constraints.hasLocationFilter) break;
  }

  if (constraints.hasLocationFilter) {
    console.log('[IntentGating] Location constraints detected:', constraints);
  }

  return constraints;
}

/**
 * Validate a company result against location constraints
 * Returns true if company satisfies the constraint, false otherwise
 *
 * RULE: If location constraint exists, company MUST match. No exceptions.
 */
function validateResultAgainstLocation(
  company: { name: string; location?: string; city?: string; region?: string },
  constraints: LocationConstraints
): boolean {
  // No location filter = all companies pass
  if (!constraints.hasLocationFilter) {
    return true;
  }

  // Get company location info (normalize to lowercase)
  const companyLocation = (company.location || '').toLowerCase();
  const companyCity = (company.city || '').toLowerCase();
  const companyRegion = (company.region || '').toLowerCase();
  const allLocationText = `${companyLocation} ${companyCity} ${companyRegion}`.toLowerCase();

  // Check specific area constraint (strictest)
  if (constraints.specificArea) {
    const areaVariants = UAE_LOCATIONS[constraints.specificArea] || [constraints.specificArea];
    const matchesArea = areaVariants.some(variant =>
      allLocationText.includes(variant.toLowerCase())
    );
    if (!matchesArea) {
      console.log(`[IntentGating] REJECTED: ${company.name} - not in ${constraints.specificArea} (location: ${allLocationText || 'none'})`);
      return false;
    }
  }

  // Check city constraint
  if (constraints.city) {
    const cityVariants = UAE_LOCATIONS[constraints.city] || [constraints.city];
    const matchesCity = cityVariants.some(variant =>
      allLocationText.includes(variant.toLowerCase())
    );
    if (!matchesCity) {
      console.log(`[IntentGating] REJECTED: ${company.name} - not in ${constraints.city} (location: ${allLocationText || 'none'})`);
      return false;
    }
  }

  console.log(`[IntentGating] ACCEPTED: ${company.name} - matches location constraints`);
  return true;
}

/**
 * Get human-readable location constraint for user feedback
 */
function getLocationConstraintDisplay(constraints: LocationConstraints): string {
  if (constraints.specificArea && constraints.city) {
    return `${constraints.specificArea}, ${constraints.city}`.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  if (constraints.specificArea) {
    return constraints.specificArea.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  if (constraints.city) {
    return constraints.city.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return 'UAE';
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

  // S382: INTENT GATING - Parse location constraints from query
  const locationConstraints = parseLocationConstraints(query);

  // S381: Start discovery loader animation
  // S382: Pass query for inline display (like ChatGPT)
  useDiscoveryContextStore.getState().startDiscovery({
    vertical: context.vertical,
    subVertical: context.subVertical,
    region: context.region,
    query: query,
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
        // S382: Pass location constraints explicitly to OS
        location_filter: locationConstraints.hasLocationFilter ? {
          city: locationConstraints.city,
          area: locationConstraints.specificArea,
        } : undefined,
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

      // S382: Show location-specific empty state if constraint was set
      const locationDisplay = getLocationConstraintDisplay(locationConstraints);
      return {
        success: true,
        cards: [
          {
            type: 'system',
            priority: 500,
            title: 'No Matches Found',
            summary: locationConstraints.hasLocationFilter
              ? `No companies found in ${locationDisplay}. I'll notify you when new ones appear.`
              : `No companies found for "${query}". Try a different search term.`,
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

    // S382: INTENT GATING - Filter results against location constraints
    // RULE: If result violates intent, it MUST NOT render. No exceptions.
    const allCompanies = result.data.companies as any[];
    const validCompanies = allCompanies.filter(company =>
      validateResultAgainstLocation(company, locationConstraints)
    );

    // S382: Log gating statistics
    if (locationConstraints.hasLocationFilter) {
      const rejected = allCompanies.length - validCompanies.length;
      console.log(`[IntentGating] Location filter applied: ${validCompanies.length}/${allCompanies.length} passed (${rejected} rejected)`);
    }

    // S382: If ALL results were filtered out, show proper empty state
    if (validCompanies.length === 0) {
      const elapsed = Date.now() - loaderStartTime;
      if (elapsed < MIN_LOADER_TIME_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADER_TIME_MS - elapsed));
      }
      useDiscoveryContextStore.getState().completeDiscovery();

      const locationDisplay = getLocationConstraintDisplay(locationConstraints);
      return {
        success: true,
        cards: [
          {
            type: 'system',
            priority: 500,
            title: 'No Matches in Location',
            summary: `No companies found specifically in ${locationDisplay}. ` +
              `${allCompanies.length} companies were found elsewhere but filtered out to match your query.`,
            expiresAt: getExpiryTime('system'),
            sourceType: 'system',
            reasoning: [
              `Your query specified: "${locationDisplay}"`,
              `${allCompanies.length} companies found, but none matched the location constraint`,
              'Only exact location matches are shown to ensure relevance',
            ],
            actions: [
              { id: 'broaden', label: 'Search All UAE', type: 'primary', handler: 'system.broadenSearch' },
              { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
            ],
            tags: ['discovery', 'no-results', 'location-filtered'],
          },
        ],
      };
    }

    // Convert validated companies to signal cards
    const signalCards = validCompanies.slice(0, 10).map((company: any, index: number) => ({
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
        // S393: CTA labels encode intent + consequence
        { id: 'evaluate', label: 'Evaluate', type: 'primary' as const, handler: 'signal.evaluate' },
        { id: 'save', label: 'Keep for follow-up', type: 'secondary' as const, handler: 'signal.save' },
        { id: 'dismiss', label: 'Ignore for now', type: 'dismiss' as const, handler: 'signal.dismiss' },
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

  // S390: Get actual workspace state from CardStore for intelligent recommendations
  const cardStore = useCardStore.getState();
  const allCards = cardStore.cards.filter(c => c.type === 'signal');

  const savedLeads = allCards.filter(c => c.status === 'saved');
  const evaluatingLeads = allCards.filter(c => c.status === 'evaluating');
  const activeLeads = allCards.filter(c => c.status === 'active');

  console.log('[CommandResolver] NBA context:', {
    saved: savedLeads.length,
    evaluating: evaluatingLeads.length,
    active: activeLeads.length,
  });

  // INTELLIGENCE LOGIC: Prioritize based on actual workspace state

  // Priority 1: If there are evaluating leads, recommend completing evaluation
  if (evaluatingLeads.length > 0) {
    const topEvaluating = evaluatingLeads[0];
    // S391: Template-based reasoning with signal context
    const signalLabel = getSignalLabel(topEvaluating.tags);
    const freshnessText = getFreshnessText(topEvaluating.createdAt);
    // S392: Build alternatives for competitive context
    const alternatives = buildAlternatives(evaluatingLeads);

    return {
      success: true,
      cards: [
        {
          type: 'nba',
          priority: 1000,
          title: `Complete evaluation of ${topEvaluating.entityName || topEvaluating.title}`,
          summary: `You have ${evaluatingLeads.length} lead${evaluatingLeads.length > 1 ? 's' : ''} in evaluation. Complete your assessment to move forward.`,
          expiresAt: getExpiryTime('nba'),
          sourceType: 'nba',
          entityId: topEvaluating.entityId,
          entityName: topEvaluating.entityName,
          entityType: 'company',
          reasoning: [
            signalLabel ? `${signalLabel} detected (${freshnessText})` : `Lead identified (${freshnessText})`,
            `${evaluatingLeads.length} lead${evaluatingLeads.length > 1 ? 's' : ''} awaiting your decision`,
            'Complete evaluation to save or skip',
          ],
          actions: [
            // S393: CTA labels encode intent + consequence
            { id: 'view-lead', label: 'Complete evaluation now', type: 'primary', handler: 'nba.viewLead' },
            { id: 'dismiss', label: 'Review after 48h', type: 'dismiss', handler: 'system.dismiss' },
          ],
          tags: ['nba-evaluate', 'urgency-high'],
          // S392: Competitive context - other evaluating leads
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        },
      ],
    };
  }

  // Priority 2: If there are saved leads, recommend taking action on highest-priority
  if (savedLeads.length > 0) {
    const topSaved = savedLeads[0];
    // S391: Build template-based reasoning with ranking and signal context
    const signalLabel = getSignalLabel(topSaved.tags);
    const freshnessText = getFreshnessText(topSaved.createdAt);
    // S392: Build alternatives for competitive context
    const alternatives = buildAlternatives(savedLeads);

    return {
      success: true,
      cards: [
        {
          type: 'nba',
          priority: 1000,
          title: `Reach out to ${topSaved.entityName || topSaved.title}`,
          summary: `You have ${savedLeads.length} qualified lead${savedLeads.length > 1 ? 's' : ''} ready for outreach. Start with your highest-priority prospect.`,
          expiresAt: getExpiryTime('nba'),
          sourceType: 'nba',
          entityId: topSaved.entityId,
          entityName: topSaved.entityName,
          entityType: 'company',
          reasoning: [
            signalLabel ? `${signalLabel} detected (${freshnessText})` : `Strong opportunity identified (${freshnessText})`,
            `Ranked #1 of ${savedLeads.length} saved lead${savedLeads.length > 1 ? 's' : ''}`,
            'Fresh leads should be contacted within 48 hours',
          ],
          actions: [
            // S393: CTA labels encode intent + consequence
            { id: 'contact', label: 'Contact now (highest priority)', type: 'primary', handler: 'nba.contact' },
            { id: 'view-pipeline', label: `See all ${savedLeads.length} opportunities`, type: 'secondary', handler: 'nba.viewPipeline' },
            { id: 'dismiss', label: 'Review after 48h', type: 'dismiss', handler: 'system.dismiss' },
          ],
          tags: ['nba-outreach', 'urgency-high'],
          // S392: Competitive context - other saved leads
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        },
      ],
    };
  }

  // Priority 3: If there are active (unactioned) leads, recommend evaluation
  if (activeLeads.length > 0) {
    const topActive = activeLeads[0];
    // S391: Template-based reasoning with signal context
    const signalLabel = getSignalLabel(topActive.tags);
    const freshnessText = getFreshnessText(topActive.createdAt);
    // S392: Build alternatives for competitive context
    const alternatives = buildAlternatives(activeLeads);

    return {
      success: true,
      cards: [
        {
          type: 'nba',
          priority: 1000,
          title: `Review ${topActive.entityName || topActive.title}`,
          summary: `You have ${activeLeads.length} new lead${activeLeads.length > 1 ? 's' : ''} awaiting review. Evaluate them to build your pipeline.`,
          expiresAt: getExpiryTime('nba'),
          sourceType: 'nba',
          entityId: topActive.entityId,
          entityName: topActive.entityName,
          entityType: 'company',
          reasoning: [
            signalLabel ? `${signalLabel} detected (${freshnessText})` : `New lead identified (${freshnessText})`,
            `${activeLeads.length} lead${activeLeads.length > 1 ? 's' : ''} awaiting review`,
            'Evaluate to save or skip',
          ],
          actions: [
            // S393: CTA labels encode intent + consequence
            { id: 'evaluate', label: `Evaluate now (${activeLeads.length} new)`, type: 'primary', handler: 'nba.startEvaluating' },
            { id: 'dismiss', label: 'Review after 48h', type: 'dismiss', handler: 'system.dismiss' },
          ],
          tags: ['nba-review', 'urgency-medium'],
          // S392: Competitive context - other active leads
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        },
      ],
    };
  }

  // Priority 4: No leads at all - suggest discovery
  return {
    success: true,
    cards: [
      {
        type: 'nba',
        priority: 1000,
        title: 'Discover new opportunities',
        summary: `Your workspace is empty. Run a discovery to find companies matching your ${context.subVertical || 'sales'} criteria in ${context.region || 'your region'}.`,
        expiresAt: getExpiryTime('nba'),
        sourceType: 'nba',
        reasoning: [
          'No leads in your current workspace',
          `Discovery will find companies with signals matching ${context.subVertical || 'your vertical'}`,
          'Try: "Find companies in ADGM" or "Show me expanding companies"',
        ],
        actions: [
          // S393: CTA labels encode intent + consequence
          { id: 'discover', label: 'Find new leads now', type: 'primary', handler: 'system.discover' },
          { id: 'dismiss', label: 'Skip for now', type: 'dismiss', handler: 'system.dismiss' },
        ],
        tags: ['nba-discover', 'urgency-low'],
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
