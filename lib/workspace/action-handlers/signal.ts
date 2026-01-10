/**
 * Signal Action Handlers - S390
 *
 * Handles user actions on signal/discovery cards:
 * - signal.evaluate: Open deep-dive, mark as evaluated
 * - signal.save: Save to pipeline, mark as saved
 * - signal.dismiss: Skip lead, mark as skipped
 *
 * All actions persist to OS NoveltyService to control resurface behavior.
 */

import { Card } from '../card-state';
import type { ActionContext, ActionResult } from './nba';

/**
 * Execute a signal action
 */
export async function executeSignalAction(
  handlerId: string,
  card: Card,
  context: ActionContext
): Promise<ActionResult> {
  console.log('[SignalActions] Executing:', handlerId, 'for card:', card.id);

  switch (handlerId) {
    case 'signal.evaluate':
      return handleEvaluate(card, context);

    case 'signal.save':
      return handleSave(card, context);

    case 'signal.dismiss':
      return handleDismiss(card, context);

    default:
      console.warn('[SignalActions] Unknown handler:', handlerId);
      return {
        success: false,
        error: `Unknown signal action: ${handlerId}`,
      };
  }
}

/**
 * Handle "Evaluate" action
 * - Records action to OS NoveltyService
 * - Opens company detail view (future)
 * - Entity will resurface in 1 day if new evidence appears
 */
async function handleEvaluate(card: Card, _context: ActionContext): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  try {
    // Record action to OS (sales_context will be resolved from workspace state if needed)
    const result = await recordNoveltyAction({
      entity_id: card.entityId,
      entity_name: card.entityName || card.title,
      action: 'evaluated',
    });

    if (!result.success) {
      console.warn('[SignalActions] Failed to record evaluate action:', result.error);
      // Continue anyway - don't block UI
    }

    // Update card status (mark as evaluated)
    store.actOnCard(card.id, 'evaluate');

    console.log('[SignalActions] Evaluate:', card.entityName || card.title);

    return {
      success: true,
      message: `Evaluating ${card.entityName || card.title}`,
      nextAction: 'open_detail', // Signal to UI to open detail view
      data: {
        entityId: card.entityId,
        entityName: card.entityName,
        resurfaceAfter: result.data?.resurface_after,
      },
    };
  } catch (error) {
    console.error('[SignalActions] Evaluate error:', error);
    return {
      success: false,
      error: 'Failed to evaluate lead',
    };
  }
}

/**
 * Handle "Save" action
 * - Records action to OS NoveltyService
 * - Adds to saved leads pipeline
 * - Entity won't reappear for 30 days
 */
async function handleSave(card: Card, _context: ActionContext): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  try {
    // Record action to OS (sales_context will be resolved from workspace state if needed)
    const result = await recordNoveltyAction({
      entity_id: card.entityId,
      entity_name: card.entityName || card.title,
      action: 'saved',
    });

    if (!result.success) {
      console.warn('[SignalActions] Failed to record save action:', result.error);
    }

    // Mark card as saved (stays visible but shows saved state)
    store.actOnCard(card.id, 'save');

    console.log('[SignalActions] Saved:', card.entityName || card.title);

    return {
      success: true,
      message: `Saved ${card.entityName || card.title} to your pipeline`,
      nextAction: 'show_toast',
      data: {
        entityId: card.entityId,
        entityName: card.entityName,
        resurfaceAfter: result.data?.resurface_after,
        toast: {
          type: 'success',
          message: `${card.entityName || card.title} saved to pipeline`,
        },
      },
    };
  } catch (error) {
    console.error('[SignalActions] Save error:', error);
    return {
      success: false,
      error: 'Failed to save lead',
    };
  }
}

/**
 * Handle "Skip/Dismiss" action
 * - Records action to OS NoveltyService
 * - Removes card from view
 * - Entity won't reappear for 7 days
 */
async function handleDismiss(card: Card, _context: ActionContext): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  try {
    // Record action to OS (sales_context will be resolved from workspace state if needed)
    const result = await recordNoveltyAction({
      entity_id: card.entityId,
      entity_name: card.entityName || card.title,
      action: 'skipped',
    });

    if (!result.success) {
      console.warn('[SignalActions] Failed to record skip action:', result.error);
    }

    // Dismiss the card from view
    store.dismissCard(card.id);

    console.log('[SignalActions] Skipped:', card.entityName || card.title);

    return {
      success: true,
      message: `Skipped ${card.entityName || card.title}`,
      nextAction: 'none',
      data: {
        entityId: card.entityId,
        resurfaceAfter: result.data?.resurface_after,
      },
    };
  } catch (error) {
    console.error('[SignalActions] Dismiss error:', error);
    // Still dismiss the card even if API fails
    store.dismissCard(card.id);
    return {
      success: true,
      message: 'Lead skipped',
      nextAction: 'none',
    };
  }
}

/**
 * Record action to OS NoveltyService
 */
async function recordNoveltyAction(params: {
  entity_id?: string;
  entity_name?: string;
  action: 'evaluated' | 'saved' | 'skipped' | 'ignored';
  sales_context?: {
    vertical?: string;
    sub_vertical?: string;
    region?: string;
  };
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/os/novelty/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[SignalActions] recordNoveltyAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Signal action handlers registry
 */
export const signalActionHandlers = {
  'signal.evaluate': handleEvaluate,
  'signal.save': handleSave,
  'signal.dismiss': handleDismiss,
};
