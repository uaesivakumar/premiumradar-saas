/**
 * Action Handlers - S374: NBA → Card Wiring
 * S375: Decision Persistence & Recall
 *
 * Central registry for all card action handlers.
 * Each card type has its own action handlers.
 */

import { Card } from '../card-state';
import { nbaActionHandlers, executeNBAAction, ActionContext, ActionResult } from './nba';
import { recallActionHandlers, executeRecallAction } from './recall';

// Re-export types
export type { ActionContext, ActionResult } from './nba';

// =============================================================================
// ACTION DISPATCHER
// =============================================================================

/**
 * Dispatch an action to the appropriate handler
 *
 * @param handlerId - The action handler ID (e.g., 'nba.execute', 'signal.dismiss')
 * @param card - The card the action is being performed on
 * @param context - The action context (tenant, user, etc.)
 * @returns Action result
 */
export async function dispatchAction(
  handlerId: string,
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  // Parse handler namespace
  const [namespace] = handlerId.split('.');

  console.log('[ActionDispatcher] Dispatching action:', handlerId, 'for card:', card.id);

  switch (namespace) {
    case 'nba':
      return executeNBAAction(handlerId, card, context);

    case 'signal':
      // TODO: S376+ - Signal action handlers
      return handleGenericAction(handlerId, card, context);

    case 'decision':
      // TODO: S376+ - Decision action handlers
      return handleGenericAction(handlerId, card, context);

    case 'recall':
      // S375: Recall action handlers
      return executeRecallAction(handlerId, card, context);

    case 'system':
      return handleSystemAction(handlerId, card, context);

    default:
      console.warn('[ActionDispatcher] Unknown namespace:', namespace);
      return {
        success: false,
        error: `Unknown action namespace: ${namespace}`,
      };
  }
}

/**
 * Handle generic card actions (dismiss, etc.)
 */
async function handleGenericAction(
  handlerId: string,
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  if (handlerId.endsWith('.dismiss')) {
    store.dismissCard(card.id);
    return { success: true, nextAction: 'none' };
  }

  if (handlerId.endsWith('.cancel')) {
    store.dismissCard(card.id);
    return { success: true, nextAction: 'none' };
  }

  // Default: just log
  console.log('[ActionDispatcher] Unhandled generic action:', handlerId);
  return {
    success: true,
    message: 'Action noted (handler not yet implemented)',
    nextAction: 'none',
  };
}

/**
 * Handle system card actions
 */
async function handleSystemAction(
  handlerId: string,
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  if (handlerId === 'system.dismiss') {
    store.dismissCard(card.id);
    return { success: true, nextAction: 'none' };
  }

  return {
    success: true,
    nextAction: 'none',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { nbaActionHandlers, executeNBAAction };
export { recallActionHandlers, executeRecallAction };
