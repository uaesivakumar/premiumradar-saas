/**
 * Recall Action Handlers - S375: Decision Persistence & Recall
 *
 * Handles actions on recall cards.
 *
 * WORKSPACE UX (LOCKED):
 * - "Re-evaluate" → Create new decision flow
 * - "View Reasoning" → Expand card to show reasoning
 */

import { Card } from '../card-state';
import { ActionContext, ActionResult } from './nba';
import { useCardStore } from '@/lib/stores/card-store';

// =============================================================================
// RECALL ACTION HANDLERS
// =============================================================================

/**
 * Handle "Re-evaluate" action on recall card
 *
 * Flow:
 * 1. Dismiss recall card
 * 2. Create new evaluation request for the entity
 * 3. This will trigger a new decision card
 */
export async function handleRecallReEvaluate(
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  try {
    const entityName = card.entityName;
    const entityId = card.entityId;

    if (!entityName) {
      return {
        success: false,
        error: 'Recall card missing entityName',
      };
    }

    console.log('[RecallHandler] Re-evaluating:', entityName);

    // Dismiss the recall card
    const store = useCardStore.getState();
    store.dismissCard(card.id);

    // TODO: S376+ - Trigger actual evaluation flow
    // For now, just signal that we want to navigate
    return {
      success: true,
      message: `Re-evaluating ${entityName}...`,
      nextAction: 'navigate',
      navigateTo: entityId ? `/workspace/evaluate/${entityId}` : undefined,
    };
  } catch (error) {
    console.error('[RecallHandler] Re-evaluate error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to re-evaluate',
    };
  }
}

/**
 * Handle "View Reasoning" action on recall card
 *
 * Flow:
 * 1. Expand the card to show full reasoning
 */
export async function handleRecallViewReasoning(
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  try {
    console.log('[RecallHandler] Viewing reasoning for:', card.entityName);

    // The card's expandedContent already contains the reasoning
    // Just return success - UI will handle expansion
    return {
      success: true,
      message: 'Showing reasoning...',
      nextAction: 'none',
    };
  } catch (error) {
    console.error('[RecallHandler] View reasoning error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to view reasoning',
    };
  }
}

/**
 * Handle "Evaluate Now" action on "not found" card
 *
 * Flow:
 * 1. Dismiss the system card
 * 2. Trigger evaluation for a new entity
 */
export async function handleRecallEvaluateNew(
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  try {
    // Extract entity name from card title ("No history for 'ABC Corp'")
    const titleMatch = card.title?.match(/No history for "(.+)"/);
    const entityName = titleMatch?.[1];

    console.log('[RecallHandler] Evaluating new entity:', entityName);

    // Dismiss the card
    const store = useCardStore.getState();
    store.dismissCard(card.id);

    // TODO: S376+ - Trigger company lookup/evaluation
    return {
      success: true,
      message: entityName ? `Looking up ${entityName}...` : 'Starting evaluation...',
      nextAction: 'none',
    };
  } catch (error) {
    console.error('[RecallHandler] Evaluate new error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start evaluation',
    };
  }
}

// =============================================================================
// ACTION HANDLER REGISTRY
// =============================================================================

/**
 * Recall action handler registry
 */
export const recallActionHandlers = {
  'recall.reEvaluate': handleRecallReEvaluate,
  'recall.viewReasoning': handleRecallViewReasoning,
  'recall.evaluateNew': handleRecallEvaluateNew,
};

export type RecallActionHandler = keyof typeof recallActionHandlers;

/**
 * Execute a recall action by handler ID
 */
export async function executeRecallAction(
  handlerId: string,
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  const handler = recallActionHandlers[handlerId as RecallActionHandler];

  if (!handler) {
    console.error('[RecallHandler] Unknown action handler:', handlerId);
    return {
      success: false,
      error: `Unknown action handler: ${handlerId}`,
    };
  }

  return handler(card, context);
}

export default recallActionHandlers;
