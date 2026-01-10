/**
 * Card State Types - S370: Card State Foundation
 *
 * WORKSPACE UX (LOCKED):
 * - Cards are the only visible artifacts
 * - Priority-ordered, not chronological
 * - Max 2 lines visible, expand on demand
 * - Only ONE NBA card at any time
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 * See docs/WORKSPACE_EXPERIENCE_FLOW.md (LOCKED)
 */

// =============================================================================
// CARD TYPES
// =============================================================================

/**
 * Card Types per WORKSPACE_EXPERIENCE_FLOW.md
 *
 * - nba: Next Best Action (max 1 at any time)
 * - decision: User decisions (persist for recall)
 * - signal: Discovery/signal cards (expire by TTL)
 * - report: Report cards (expire by TTL)
 * - recall: Recall cards (temporary)
 * - system: System messages (expire quickly)
 * - context: S381 Query context card (shows user's query)
 */
export type CardType =
  | 'nba'       // Next Best Action - max 1
  | 'decision'  // Decision card - persists for recall
  | 'signal'    // Signal/discovery card
  | 'report'    // Report card
  | 'recall'    // Recall card
  | 'system'    // System message
  | 'context';  // S381: Query context - shows user's query

/**
 * Card Status Lifecycle - S390 Lead State Model
 *
 * VISIBLE STATES (shown in UI):
 * - active: Unactioned → Visible in Inbox
 * - evaluating: User clicked Evaluate → Visible in Evaluating section
 * - saved: User clicked Save → Visible in Saved section
 *
 * HIDDEN STATES:
 * - acted: Generic action (deprecated, use evaluating/saved)
 * - dismissed: Skipped/rejected → Hidden
 * - expired: TTL reached → Hidden
 *
 * INVARIANT: A lead never disappears unless user explicitly SKIPS it.
 */
export type CardStatus = 'active' | 'evaluating' | 'saved' | 'acted' | 'dismissed' | 'expired';

/**
 * Source of the card
 */
export type CardSourceType = 'nba' | 'signal' | 'decision' | 'report' | 'system' | 'recall' | 'context';

/**
 * Entity type for card context
 */
export type CardEntityType = 'company' | 'contact' | 'lead';

// =============================================================================
// CARD ACTION
// =============================================================================

/**
 * Card Action - Button on a card
 *
 * Per WORKSPACE_EXPERIENCE_FLOW.md:
 * - [Do Now] [Defer] for NBA cards
 * - [Why?] [Override] for decision cards
 * - [Save] [Ignore] for signal cards
 */
export interface CardAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'dismiss';
  handler: string;  // Action handler ID for dispatch
  icon?: string;    // Lucide icon name
}

// =============================================================================
// CARD INTERFACE
// =============================================================================

/**
 * Card - The single unit of UI in the Workspace
 *
 * LOCKED RULES:
 * - Only ONE card with type='nba' can exist
 * - Cards are sorted by priority (higher = more important)
 * - Summary is max 2 lines
 * - Cards expire by TTL (except decisions)
 */
export interface Card {
  // Identity
  id: string;
  type: CardType;

  // Ordering
  priority: number;           // Higher = more important (0-1000)
  createdAt: Date;
  expiresAt: Date | null;     // null = never expires

  // Status
  status: CardStatus;

  // Content
  title: string;
  summary: string;            // Max 2 lines visible
  expandedContent?: unknown;  // Shown on expand
  confidence?: number;        // 0-100

  // Actions
  actions: CardAction[];

  // Source
  sourceType: CardSourceType;
  sourceId?: string;

  // Entity Context
  entityId?: string;
  entityType?: CardEntityType;
  entityName?: string;

  // Metadata
  reasoning?: string[];       // SIVA reasoning points
  tags?: string[];            // For filtering
}

// =============================================================================
// DEFAULT PRIORITIES
// =============================================================================

/**
 * Default priority values by card type
 * Higher = more important, appears first
 */
export const DEFAULT_PRIORITIES: Record<CardType, number> = {
  nba: 1000,      // NBA always on top
  context: 900,   // S381: Context card below NBA, above others
  decision: 800,  // Decisions are important
  signal: 600,    // Signals are actionable
  recall: 400,    // Recall is informational
  report: 300,    // Reports are lower priority
  system: 100,    // System messages are lowest
};

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a new card with defaults
 */
export function createCard(
  params: Omit<Card, 'id' | 'createdAt' | 'status'> & {
    id?: string;
    status?: CardStatus;
    createdAt?: Date;
  }
): Card {
  return {
    id: params.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: params.createdAt || new Date(),
    status: params.status || 'active',
    ...params,
  };
}

/**
 * Create an NBA card
 */
export function createNBACard(params: {
  title: string;
  summary: string;
  entityId?: string;
  entityName?: string;
  reasoning?: string[];
  expiresAt?: Date | null;
}): Card {
  return createCard({
    type: 'nba',
    priority: DEFAULT_PRIORITIES.nba,
    title: params.title,
    summary: params.summary,
    entityId: params.entityId,
    entityName: params.entityName,
    reasoning: params.reasoning,
    expiresAt: params.expiresAt ?? null,
    sourceType: 'nba',
    actions: [
      { id: 'do-now', label: 'Do Now', type: 'primary', handler: 'nba.doNow' },
      { id: 'defer', label: 'Defer', type: 'secondary', handler: 'nba.defer' },
    ],
  });
}

/**
 * Create a Decision card (for recall)
 */
export function createDecisionCard(params: {
  title: string;
  summary: string;
  decision: 'pursue' | 'reject' | 'hold';
  entityId: string;
  entityName: string;
  reasoning?: string[];
  confidence?: number;
}): Card {
  return createCard({
    type: 'decision',
    priority: DEFAULT_PRIORITIES.decision,
    title: params.title,
    summary: params.summary,
    entityId: params.entityId,
    entityName: params.entityName,
    entityType: 'company',
    reasoning: params.reasoning,
    confidence: params.confidence,
    expiresAt: null, // Decisions never expire
    sourceType: 'decision',
    expandedContent: { decision: params.decision },
    actions: [
      { id: 'view-reasoning', label: 'Why?', type: 'secondary', handler: 'decision.viewReasoning' },
      { id: 'override', label: 'Override', type: 'secondary', handler: 'decision.override' },
    ],
  });
}

/**
 * Create a Signal card (from discovery)
 */
export function createSignalCard(params: {
  title: string;
  summary: string;
  entityId?: string;
  entityName?: string;
  signalType?: string;
  expiresAt?: Date | null;
}): Card {
  return createCard({
    type: 'signal',
    priority: DEFAULT_PRIORITIES.signal,
    title: params.title,
    summary: params.summary,
    entityId: params.entityId,
    entityName: params.entityName,
    entityType: 'company',
    expiresAt: params.expiresAt ?? null,
    sourceType: 'signal',
    tags: params.signalType ? [params.signalType] : undefined,
    actions: [
      { id: 'save', label: 'Save', type: 'primary', handler: 'signal.save' },
      { id: 'enrich', label: 'Enrich', type: 'secondary', handler: 'signal.enrich' },
      { id: 'ignore', label: 'Ignore', type: 'dismiss', handler: 'signal.ignore' },
    ],
  });
}

/**
 * Create a System card (temporary message)
 */
export function createSystemCard(params: {
  title: string;
  summary: string;
  expiresAt?: Date | null;
}): Card {
  return createCard({
    type: 'system',
    priority: DEFAULT_PRIORITIES.system,
    title: params.title,
    summary: params.summary,
    expiresAt: params.expiresAt ?? null,
    sourceType: 'system',
    actions: [
      { id: 'dismiss', label: 'Dismiss', type: 'dismiss', handler: 'system.dismiss' },
    ],
  });
}

/**
 * S381: Create a Context card (shows user's query)
 *
 * Context cards:
 * - Show what the user typed
 * - Display the interpreted intent
 * - Show the scope (region, vertical)
 * - Auto-expire after 10 minutes
 * - Only ONE context card at a time (dismiss previous)
 */
export function createContextCard(params: {
  query: string;
  intent: string;
  interpretedAs: string;
  scope: {
    vertical: string;
    subVertical: string;
    region: string;
  };
  expiresAt?: Date | null;
}): Card {
  return createCard({
    type: 'context',
    priority: DEFAULT_PRIORITIES.context,
    title: 'Your Query',
    summary: `"${params.query}"`,
    expandedContent: {
      intent: params.intent,
      interpretedAs: params.interpretedAs,
      scope: params.scope,
    },
    expiresAt: params.expiresAt ?? null,
    sourceType: 'context',
    reasoning: [
      `Interpreted as: ${params.interpretedAs}`,
      `Scope: ${params.scope.subVertical} in ${params.scope.region}`,
    ],
    actions: [
      { id: 'clear', label: 'Clear', type: 'dismiss', handler: 'context.clear' },
    ],
    tags: ['query-context', params.intent],
  });
}
