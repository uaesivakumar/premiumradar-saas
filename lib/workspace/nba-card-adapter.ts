/**
 * NBA Card Adapter - S374: NBA → Card Wiring
 *
 * Converts NBA Engine results to workspace Card format.
 * Uses API endpoints for NBA operations (client-side safe).
 *
 * WORKSPACE UX (LOCKED):
 * - Only ONE NBA card at any time
 * - NBA always appears at top (priority 1000)
 * - Actions: "Do Now" (primary) and "Defer" (secondary)
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 */

import { Card, CardAction } from './card-state';
import { getExpiryTime } from './ttl-engine';
import { useCardStore } from '@/lib/stores/card-store';

// Import types only (no runtime import of server modules)
import type { NBA, NBAContext, NBARankingResult, NBAUrgency } from './nba-engine';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * NBA Card Priority - Always highest
 * LOCKED: NBA is always the most important card
 */
export const NBA_CARD_PRIORITY = 1000;

/**
 * NBA Card Actions - LOCKED per WORKSPACE_UX_DECISION.md
 */
export const NBA_ACTIONS: CardAction[] = [
  {
    id: 'do-now',
    label: 'Do Now',
    type: 'primary',
    handler: 'nba.execute',
  },
  {
    id: 'defer',
    label: 'Defer',
    type: 'secondary',
    handler: 'nba.defer',
  },
];

// =============================================================================
// NBA → CARD CONVERSION
// =============================================================================

/**
 * Convert NBA to Card format
 */
export function nbaToCard(nba: NBA): Omit<Card, 'id' | 'createdAt' | 'status'> {
  return {
    type: 'nba',
    priority: NBA_CARD_PRIORITY,
    title: nba.actionText,
    summary: nba.reason,
    expandedContent: {
      supportingInfo: nba.supportingInfo,
      urgency: nba.urgency,
      score: nba.score,
      companyName: nba.companyName,
      contactName: nba.contactName,
      alternatives: nba.alternatives,
      metadata: nba.metadata,
    },
    expiresAt: nba.expiresAt || getExpiryTime('nba'),
    sourceType: 'nba',
    sourceId: nba.id,
    entityId: nba.leadId,
    entityName: nba.companyName,
    entityType: 'company',
    actions: NBA_ACTIONS,
    tags: [
      `nba-${nba.type.toLowerCase().replace('_', '-')}`,
      `urgency-${nba.urgency}`,
    ],
  };
}

// =============================================================================
// NBA FETCHING
// =============================================================================

/**
 * Fetch and create NBA card for the current user context
 * Uses API endpoint instead of direct engine call (client-safe)
 *
 * @param context - NBA context (tenant, user, workspace)
 * @returns Created card ID or null if no NBA
 */
export async function fetchAndCreateNBACard(
  context: NBAContext
): Promise<string | null> {
  try {
    console.log('[NBACardAdapter] Fetching NBA for context:', {
      tenantId: context.tenantId,
      userId: context.userId,
    });

    // Call NBA API endpoint (GET with query params)
    const params = new URLSearchParams();
    if (context.workspaceId) params.set('workspaceId', context.workspaceId);
    if (context.userActivity) params.set('activity', context.userActivity);

    const response = await fetch(`/api/workspace/nba?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include session cookies
    });

    const result = await response.json();

    if (!result.success || !result.data) {
      console.log('[NBACardAdapter] No NBA found:', result.meta?.selectionReason || result.error);
      return null;
    }

    const nba: NBA = result.data;

    console.log('[NBACardAdapter] NBA found:', {
      type: nba.type,
      company: nba.companyName,
      score: nba.score,
    });

    // Convert to card and add to store
    const cardData = nbaToCard(nba);
    const cardId = useCardStore.getState().addCard(cardData);

    console.log('[NBACardAdapter] NBA card created:', cardId);
    return cardId;
  } catch (error) {
    console.error('[NBACardAdapter] Error fetching NBA:', error);
    return null;
  }
}

/**
 * Refresh NBA card - replaces existing NBA if different
 * Uses API endpoint instead of direct engine call (client-safe)
 *
 * @param context - NBA context
 * @returns New card ID or null
 */
export async function refreshNBACard(
  context: NBAContext
): Promise<string | null> {
  const store = useCardStore.getState();
  const currentNBA = store.getNBA();

  // Fetch new NBA via API (GET with query params)
  const params = new URLSearchParams();
  if (context.workspaceId) params.set('workspaceId', context.workspaceId);
  if (context.userActivity) params.set('activity', context.userActivity);

  const response = await fetch(`/api/workspace/nba?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include session cookies
  });

  const result = await response.json();

  if (!result.success || !result.data) {
    // No NBA available - clear any existing
    if (currentNBA) {
      store.clearNBA();
      console.log('[NBACardAdapter] NBA cleared (no new NBA available)');
    }
    return null;
  }

  const nba: NBA = result.data;

  // Check if it's the same NBA
  if (currentNBA && currentNBA.sourceId === nba.id) {
    console.log('[NBACardAdapter] Same NBA, no update needed');
    return currentNBA.id;
  }

  // Different NBA - add new (store handles singleton enforcement)
  const cardData = nbaToCard(nba);
  const cardId = store.addCard(cardData);

  console.log('[NBACardAdapter] NBA updated:', cardId);
  return cardId;
}

// =============================================================================
// NBA LIFECYCLE
// =============================================================================

/**
 * Mark NBA as completed via API
 * Uses the existing POST /api/workspace/nba endpoint
 */
async function markNBAComplete(
  context: Pick<NBAContext, 'tenantId' | 'userId'>,
  nbaId: string,
  outcome: 'completed' | 'deferred' | 'dismissed'
): Promise<void> {
  try {
    // Map our outcome to the API's action format
    const actionMap: Record<string, string> = {
      completed: 'complete',
      deferred: 'defer',
      dismissed: 'dismiss',
    };

    await fetch('/api/workspace/nba', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({
        nbaId,
        action: actionMap[outcome],
      }),
    });
  } catch (error) {
    console.error('[NBACardAdapter] Error marking NBA complete:', error);
  }
}

/**
 * Handle NBA completion
 * Called when user clicks "Do Now"
 */
export async function completeNBA(
  context: Pick<NBAContext, 'tenantId' | 'userId'>,
  nbaId: string
): Promise<void> {
  const store = useCardStore.getState();
  const nbaCard = store.getNBA();

  if (!nbaCard || nbaCard.sourceId !== nbaId) {
    console.warn('[NBACardAdapter] NBA not found for completion:', nbaId);
    return;
  }

  // Mark card as acted
  store.actOnCard(nbaCard.id, 'do-now');

  // Mark in NBA engine via API
  await markNBAComplete(context, nbaId, 'completed');

  console.log('[NBACardAdapter] NBA completed:', nbaId);
}

/**
 * Handle NBA deferral
 * Called when user clicks "Defer"
 */
export async function deferNBA(
  context: Pick<NBAContext, 'tenantId' | 'userId'>,
  nbaId: string
): Promise<void> {
  const store = useCardStore.getState();
  const nbaCard = store.getNBA();

  if (!nbaCard || nbaCard.sourceId !== nbaId) {
    console.warn('[NBACardAdapter] NBA not found for deferral:', nbaId);
    return;
  }

  // Dismiss the card
  store.dismissCard(nbaCard.id);

  // Mark in NBA engine via API
  await markNBAComplete(context, nbaId, 'deferred');

  console.log('[NBACardAdapter] NBA deferred:', nbaId);
}

/**
 * Handle NBA dismissal
 * Called when user explicitly dismisses without action
 */
export async function dismissNBA(
  context: Pick<NBAContext, 'tenantId' | 'userId'>,
  nbaId: string
): Promise<void> {
  const store = useCardStore.getState();
  const nbaCard = store.getNBA();

  if (!nbaCard || nbaCard.sourceId !== nbaId) {
    console.warn('[NBACardAdapter] NBA not found for dismissal:', nbaId);
    return;
  }

  // Dismiss the card
  store.dismissCard(nbaCard.id);

  // Mark in NBA engine via API
  await markNBAComplete(context, nbaId, 'dismissed');

  console.log('[NBACardAdapter] NBA dismissed:', nbaId);
}

// =============================================================================
// EXPORTS
// =============================================================================

export const nbaCardAdapter = {
  nbaToCard,
  fetchAndCreateNBACard,
  refreshNBACard,
  completeNBA,
  deferNBA,
  dismissNBA,
  NBA_CARD_PRIORITY,
  NBA_ACTIONS,
};

export default nbaCardAdapter;
