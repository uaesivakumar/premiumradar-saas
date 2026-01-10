/**
 * Signal Action Handlers - S390
 *
 * Handles user actions on signal/discovery cards:
 * - signal.evaluate: Mark as EVALUATING (stays visible), suppress re-discovery
 * - signal.save: Mark as SAVED (stays visible), suppress re-discovery
 * - signal.dismiss: Mark as SKIPPED (hidden), suppress for 7 days
 *
 * S390 INVARIANT: A lead NEVER disappears unless user explicitly SKIPS it.
 *
 * Lead State (UI Visibility) vs Novelty (Discovery Re-introduction):
 * - EVALUATING/SAVED: Visible in sidebar, never re-discovered
 * - SKIPPED: Hidden from sidebar, re-discovered after 7 days if new evidence
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
 *
 * S390 BEHAVIOR:
 * - Sets lead state to EVALUATING (card stays visible in sidebar)
 * - Suppresses re-discovery indefinitely (never show as "new" again)
 * - Opens company detail view (future)
 *
 * INVARIANT: Card stays visible. Never hides on Evaluate.
 */
async function handleEvaluate(card: Card, _context: ActionContext): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  try {
    // Record action to OS (sets lead_state=EVALUATING, novelty suppressed indefinitely)
    const result = await recordNoveltyAction({
      entity_id: card.entityId,
      entity_name: card.entityName || card.title,
      action: 'evaluated',
    });

    if (!result.success) {
      console.warn('[SignalActions] Failed to record evaluate action:', result.error);
      // Continue anyway - don't block UI
    }

    // S390: Set card to EVALUATING state (stays visible in sidebar)
    store.setCardEvaluating(card.id);

    console.log('[SignalActions] Evaluate:', card.entityName || card.title, '→ EVALUATING (visible)');

    return {
      success: true,
      message: `Evaluating ${card.entityName || card.title}`,
      nextAction: 'open_detail', // Signal to UI to open detail view
      data: {
        entityId: card.entityId,
        entityName: card.entityName,
        leadState: result.data?.lead_state || 'EVALUATING',
      },
    };
  } catch (error) {
    console.error('[SignalActions] Evaluate error:', error);
    // S390: Still set evaluating locally even if API fails (same pattern as dismiss)
    store.setCardEvaluating(card.id);
    return {
      success: true,
      message: 'Evaluating (offline)',
      nextAction: 'open_detail',
      data: {
        entityId: card.entityId,
        entityName: card.entityName,
        leadState: 'EVALUATING',
      },
    };
  }
}

/**
 * Handle "Save" action
 *
 * S390 BEHAVIOR:
 * - Sets lead state to SAVED (card stays visible in Saved section)
 * - Suppresses re-discovery indefinitely (never show as "new" again)
 * - Adds to saved leads pipeline
 *
 * INVARIANT: Card stays visible. Never hides on Save.
 */
async function handleSave(card: Card, _context: ActionContext): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  try {
    // Record action to OS (sets lead_state=SAVED, novelty suppressed indefinitely)
    const result = await recordNoveltyAction({
      entity_id: card.entityId,
      entity_name: card.entityName || card.title,
      action: 'saved',
    });

    if (!result.success) {
      console.warn('[SignalActions] Failed to record save action:', result.error);
    }

    // S390: Set card to SAVED state (stays visible in Saved section)
    store.setCardSaved(card.id);

    console.log('[SignalActions] Saved:', card.entityName || card.title, '→ SAVED (visible)');

    return {
      success: true,
      message: `Saved ${card.entityName || card.title} to your pipeline`,
      nextAction: 'show_toast',
      data: {
        entityId: card.entityId,
        entityName: card.entityName,
        leadState: result.data?.lead_state || 'SAVED',
        toast: {
          type: 'success',
          message: `${card.entityName || card.title} saved to pipeline`,
        },
      },
    };
  } catch (error) {
    console.error('[SignalActions] Save error:', error);
    // S390: Still save the card locally even if API fails (same pattern as dismiss)
    store.setCardSaved(card.id);
    return {
      success: true,
      message: 'Lead saved (offline)',
      nextAction: 'none',
    };
  }
}

/**
 * Handle "Skip/Dismiss" action
 *
 * S390 BEHAVIOR:
 * - Sets lead state to SKIPPED (card is hidden from sidebar)
 * - Suppresses re-discovery for 7 days (re-discover if new evidence)
 *
 * THIS IS THE ONLY ACTION THAT HIDES A CARD.
 */
async function handleDismiss(card: Card, _context: ActionContext): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();

  try {
    // Record action to OS (sets lead_state=SKIPPED, novelty suppressed for 7 days)
    const result = await recordNoveltyAction({
      entity_id: card.entityId,
      entity_name: card.entityName || card.title,
      action: 'skipped',
    });

    if (!result.success) {
      console.warn('[SignalActions] Failed to record skip action:', result.error);
    }

    // S390: Dismiss the card - THIS IS THE ONLY ACTION THAT HIDES
    store.dismissCard(card.id);

    console.log('[SignalActions] Skipped:', card.entityName || card.title, '→ HIDDEN');

    return {
      success: true,
      message: `Skipped ${card.entityName || card.title}`,
      nextAction: 'none',
      data: {
        entityId: card.entityId,
        leadState: 'SKIPPED',
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
