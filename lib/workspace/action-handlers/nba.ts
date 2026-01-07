/**
 * NBA Action Handlers - S374: NBA → Card Wiring
 *
 * Handles actions on NBA cards.
 *
 * WORKSPACE UX (LOCKED):
 * - "Do Now" → Execute action, mark complete, remove card
 * - "Defer" → Reschedule action, remove card
 * - Card removal is immediate (no animation)
 */

import { nbaCardAdapter } from '../nba-card-adapter';
import { useCardStore } from '@/lib/stores/card-store';
import { Card } from '../card-state';

// =============================================================================
// TYPES
// =============================================================================

export interface ActionContext {
  tenantId: string;
  userId: string;
  workspaceId?: string;
}

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  nextAction?: 'refresh' | 'navigate' | 'none';
  navigateTo?: string;
}

// =============================================================================
// NBA ACTION HANDLERS
// =============================================================================

/**
 * Handle "Do Now" action on NBA card
 *
 * Flow:
 * 1. Mark card as acted
 * 2. Mark NBA as completed in engine
 * 3. (Optional) Navigate to action destination
 */
export async function handleNBAExecute(
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  try {
    if (!card.sourceId) {
      return {
        success: false,
        error: 'NBA card missing sourceId',
      };
    }

    console.log('[NBAHandler] Executing NBA:', card.sourceId);

    // Complete the NBA
    await nbaCardAdapter.completeNBA(context, card.sourceId);

    // Determine next action based on NBA type
    const expandedContent = card.expandedContent as Record<string, unknown> | undefined;
    const nbaType = expandedContent?.nbaType as string | undefined;

    // Some actions may need navigation
    if (nbaType === 'SEND_EMAIL' || nbaType === 'SEND_LINKEDIN') {
      return {
        success: true,
        message: 'Opening outreach...',
        nextAction: 'navigate',
        navigateTo: `/workspace/outreach/${card.entityId}`,
      };
    }

    if (nbaType === 'RESEARCH_COMPANY' || nbaType === 'REVIEW_PROFILE') {
      return {
        success: true,
        message: 'Opening company profile...',
        nextAction: 'navigate',
        navigateTo: `/workspace/company/${card.entityId}`,
      };
    }

    return {
      success: true,
      message: 'Action completed',
      nextAction: 'refresh',
    };
  } catch (error) {
    console.error('[NBAHandler] Execute error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute NBA',
    };
  }
}

/**
 * Handle "Defer" action on NBA card
 *
 * Flow:
 * 1. Dismiss the card
 * 2. Mark NBA as deferred in engine
 * 3. Engine will reschedule for later
 */
export async function handleNBADefer(
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  try {
    if (!card.sourceId) {
      return {
        success: false,
        error: 'NBA card missing sourceId',
      };
    }

    console.log('[NBAHandler] Deferring NBA:', card.sourceId);

    // Defer the NBA
    await nbaCardAdapter.deferNBA(context, card.sourceId);

    return {
      success: true,
      message: 'Deferred until later',
      nextAction: 'none',
    };
  } catch (error) {
    console.error('[NBAHandler] Defer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to defer NBA',
    };
  }
}

/**
 * Handle dismiss action on NBA card
 * (When user dismisses without explicit action)
 */
export async function handleNBADismiss(
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  try {
    if (!card.sourceId) {
      return {
        success: false,
        error: 'NBA card missing sourceId',
      };
    }

    console.log('[NBAHandler] Dismissing NBA:', card.sourceId);

    // Dismiss the NBA
    await nbaCardAdapter.dismissNBA(context, card.sourceId);

    return {
      success: true,
      message: 'Dismissed',
      nextAction: 'none',
    };
  } catch (error) {
    console.error('[NBAHandler] Dismiss error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss NBA',
    };
  }
}

// =============================================================================
// ACTION HANDLER REGISTRY
// =============================================================================

/**
 * NBA action handler registry
 * Maps handler IDs to handler functions
 */
export const nbaActionHandlers = {
  'nba.execute': handleNBAExecute,
  'nba.defer': handleNBADefer,
  'nba.dismiss': handleNBADismiss,
};

export type NBAActionHandler = keyof typeof nbaActionHandlers;

/**
 * Execute an NBA action by handler ID
 */
export async function executeNBAAction(
  handlerId: string,
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  const handler = nbaActionHandlers[handlerId as NBAActionHandler];

  if (!handler) {
    console.error('[NBAHandler] Unknown action handler:', handlerId);
    return {
      success: false,
      error: `Unknown action handler: ${handlerId}`,
    };
  }

  return handler(card, context);
}

export default nbaActionHandlers;
