/**
 * Signal Action Handlers - S390
 *
 * Handles user actions on signal/discovery cards:
 * - signal.enrich: Trigger enrichment engine (Apollo, SERP, LLM), mark as EVALUATING
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
    case 'signal.enrich':
      return handleEnrich(card, context);

    case 'signal.evaluate':
      // Legacy handler - redirect to enrich
      return handleEnrich(card, context);

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
 * Handle "Enrich" action
 *
 * ENRICHMENT PIPELINE:
 * 1. Set card to EVALUATING state (visible in sidebar)
 * 2. Trigger enrichment engine:
 *    - Apollo: Company data, contacts, hiring signals
 *    - SERP: Latest news, expansion signals
 *    - LLM: Extract structured data, score opportunity
 * 3. Update card with enriched data
 * 4. Navigate to enriched detail view
 *
 * INVARIANT: Card stays visible. Never hides on Enrich.
 */
async function handleEnrich(card: Card, _context: ActionContext): Promise<ActionResult> {
  const { useCardStore } = await import('@/lib/stores/card-store');
  const store = useCardStore.getState();
  const entityName = card.entityName || card.title;

  try {
    // 1. Set card to EVALUATING state immediately (visible in sidebar)
    store.setCardEvaluating(card.id);
    console.log('[SignalActions] Enrich started:', entityName, '→ EVALUATING');

    // 2. Record action to OS (sets lead_state=EVALUATING, novelty suppressed indefinitely)
    const noveltyResult = await recordNoveltyAction({
      entity_id: card.entityId,
      entity_name: entityName,
      action: 'evaluated',
    });

    if (!noveltyResult.success) {
      console.warn('[SignalActions] Failed to record enrich action:', noveltyResult.error);
    }

    // 3. Trigger enrichment engine (async - don't block UI)
    triggerEnrichment(card, _context).catch((error) => {
      console.error('[SignalActions] Background enrichment failed:', error);
    });

    return {
      success: true,
      message: `Enriching ${entityName}...`,
      nextAction: 'open_detail',
      data: {
        entityId: card.entityId,
        entityName: entityName,
        leadState: 'EVALUATING',
        enrichmentStatus: 'in_progress',
      },
    };
  } catch (error) {
    console.error('[SignalActions] Enrich error:', error);
    // Still set evaluating locally even if API fails
    store.setCardEvaluating(card.id);
    return {
      success: true,
      message: 'Enriching (offline)',
      nextAction: 'open_detail',
      data: {
        entityId: card.entityId,
        entityName: entityName,
        leadState: 'EVALUATING',
      },
    };
  }
}

/**
 * Background enrichment pipeline
 * Calls /api/enrichment/start to find individual leads
 */
async function triggerEnrichment(card: Card, context: ActionContext): Promise<void> {
  const entityName = card.entityName || card.title;

  console.log('[SignalActions] Starting enrichment pipeline for:', entityName);

  try {
    // Call enrichment start API
    const response = await fetch('/api/enrichment/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        entityId: card.entityId || card.id,
        entityName: entityName,
        subVertical: 'employee-banking', // TODO: Get from context
        region: 'UAE',
        maxContacts: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Enrichment API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Enrichment failed');
    }

    console.log('[SignalActions] Enrichment complete:', {
      entityName,
      sessionId: result.sessionId,
      contactsFound: result.metrics?.contactsFound,
      topContacts: result.contacts?.slice(0, 3).map((c: any) => c.fullName),
    });

    // Store enrichment result in card store for UI access
    const { useCardStore } = await import('@/lib/stores/card-store');
    const store = useCardStore.getState();

    // Update card with enrichment session ID
    // The UI can then fetch contacts via the session ID
    store.updateCard(card.id, {
      expandedContent: {
        enrichmentSessionId: result.sessionId,
        enrichmentStage: result.stage,
        contactsFound: result.metrics?.contactsFound || 0,
      },
    });

  } catch (error) {
    console.error('[SignalActions] Enrichment pipeline error:', error);
    // Don't throw - this runs in background
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
  'signal.enrich': handleEnrich,
  'signal.evaluate': handleEnrich, // Legacy alias
  'signal.save': handleSave,
  'signal.dismiss': handleDismiss,
};
