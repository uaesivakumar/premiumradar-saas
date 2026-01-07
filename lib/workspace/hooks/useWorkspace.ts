/**
 * Workspace Hook - S378: Demo Hardening
 *
 * Master hook that integrates all workspace functionality.
 * Use this as the single entry point for workspace state.
 *
 * WORKSPACE UX (LOCKED):
 * - Single source of truth for workspace state
 * - Integrates cards, preferences, silence, lifecycle
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useCardStore, CardFilter } from '@/lib/stores/card-store';
import { usePreferenceStore, useLeadFilterPreferences } from '../preference-store';
import { useSilenceStore } from '../silence-store';
import { useWorkspaceLifecycle, useVisibilityTTLCheck } from './useWorkspaceLifecycle';
import { useWorkspaceNBA } from './useWorkspaceNBA';
import { dispatchAction, ActionContext } from '../action-handlers';
import { resolveCommand } from '../command-resolver';
import { Card } from '../card-state';

// =============================================================================
// TYPES
// =============================================================================

export interface WorkspaceState {
  // Cards
  cards: Card[];
  nba: Card | null;
  filter: CardFilter;

  // Counts
  totalCards: number;
  savedLeadsCount: number;
  followUpsCount: number;

  // Preferences
  minConfidence: number;
  regionFilter: string | null;

  // Status
  isInitialized: boolean;
  hasCards: boolean;
  hasNBA: boolean;
  isSilent: boolean;
}

export interface WorkspaceActions {
  // Card actions
  setFilter: (filter: CardFilter) => void;
  handleCardAction: (cardId: string, actionId: string) => Promise<void>;
  dismissCard: (cardId: string) => void;

  // Command actions
  submitCommand: (input: string) => Promise<void>;

  // Silence actions
  silenceEntity: (entityId: string, reason: string) => void;
  unsilenceEntity: (patternId: string) => void;

  // Lifecycle
  refresh: () => void;
}

export type UseWorkspaceResult = WorkspaceState & WorkspaceActions;

// =============================================================================
// HOOK
// =============================================================================

export function useWorkspace(): UseWorkspaceResult {
  // Initialize lifecycle (TTL, rehydration, silence cleanup)
  const { isInitialized, forceTTLCheck } = useWorkspaceLifecycle();
  useVisibilityTTLCheck();

  // NBA hook
  const { nba, getContext: getNBAContext } = useWorkspaceNBA({
    autoFetch: false, // Don't auto-fetch - let command palette trigger
    autoRefresh: true,
  });

  // Card store
  const cards = useCardStore((state) => state.getActiveCards());
  const filter = useCardStore((state) => state.activeFilter);
  const setFilter = useCardStore((state) => state.setFilter);
  const dismissCard = useCardStore((state) => state.dismissCard);
  const addCard = useCardStore((state) => state.addCard);

  // Preference store
  const { minConfidence, regionFilter } = useLeadFilterPreferences();

  // Silence store
  const silenceEntity = useSilenceStore((state) => state.silence);
  const unsilenceEntity = useSilenceStore((state) => state.unsilence);

  // =============================================================================
  // COMPUTED STATE
  // =============================================================================

  const state = useMemo<WorkspaceState>(() => {
    const savedLeads = cards.filter(
      (c) => c.tags?.includes('saved') || c.tags?.includes('saved-lead')
    );
    const followUps = cards.filter(
      (c) => c.tags?.includes('follow-up') || c.type === 'recall'
    );

    return {
      cards,
      nba,
      filter,
      totalCards: cards.length,
      savedLeadsCount: savedLeads.length,
      followUpsCount: followUps.length,
      minConfidence,
      regionFilter,
      isInitialized,
      hasCards: cards.length > 0,
      hasNBA: nba !== null,
      isSilent: cards.length === 0 && nba === null,
    };
  }, [cards, nba, filter, minConfidence, regionFilter, isInitialized]);

  // =============================================================================
  // ACTIONS
  // =============================================================================

  const handleCardAction = useCallback(
    async (cardId: string, actionId: string) => {
      const card = cards.find((c) => c.id === cardId) || nba;
      if (!card) {
        console.error('[useWorkspace] Card not found:', cardId);
        return;
      }

      const action = card.actions?.find((a) => a.id === actionId);
      if (!action) {
        console.error('[useWorkspace] Action not found:', actionId);
        return;
      }

      // Build context for action handler
      const context: ActionContext = {
        ...getNBAContext(),
      };

      console.log('[useWorkspace] Dispatching action:', action.handler);
      const result = await dispatchAction(action.handler, card, context);

      if (!result.success) {
        console.error('[useWorkspace] Action failed:', result.error);
      }
    },
    [cards, nba, getNBAContext]
  );

  const submitCommand = useCallback(
    async (input: string) => {
      console.log('[useWorkspace] Submitting command:', input);

      const result = await resolveCommand(input);

      if (!result.success) {
        console.error('[useWorkspace] Command failed:', result.error);
        return;
      }

      // Add generated cards to store
      for (const cardData of result.cards) {
        addCard(cardData);
      }
    },
    [addCard]
  );

  const silenceEntityWithReason = useCallback(
    (entityId: string, reason: string) => {
      silenceEntity('entity', entityId, reason as never);
    },
    [silenceEntity]
  );

  const refresh = useCallback(() => {
    forceTTLCheck();
  }, [forceTTLCheck]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // State
    ...state,

    // Actions
    setFilter,
    handleCardAction,
    dismissCard,
    submitCommand,
    silenceEntity: silenceEntityWithReason,
    unsilenceEntity,
    refresh,
  };
}

// =============================================================================
// CONVENIENCE SELECTORS
// =============================================================================

/**
 * Get just card state (lighter weight hook)
 */
export function useWorkspaceCards() {
  const cards = useCardStore((state) => state.getActiveCards());
  const nba = useCardStore((state) => state.getNBA());
  const filter = useCardStore((state) => state.activeFilter);
  const setFilter = useCardStore((state) => state.setFilter);

  return { cards, nba, filter, setFilter };
}

/**
 * Get system state for display
 */
export function useWorkspaceSystemState() {
  const cards = useCardStore((state) => state.getActiveCards());
  const nba = useCardStore((state) => state.getNBA());

  const hasCards = cards.length > 0;
  const hasNBA = nba !== null;
  const isSilent = !hasCards && !hasNBA;

  return {
    hasCards,
    hasNBA,
    isSilent,
    state: isSilent ? 'silent' : hasNBA ? 'active' : 'signals-only',
  };
}
