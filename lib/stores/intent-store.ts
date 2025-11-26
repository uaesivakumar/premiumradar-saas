/**
 * Intent Store - S43
 *
 * Zustand store for intent classification state.
 * NEW STORE - does not modify existing siva-store.ts
 */

import { create } from 'zustand';
import type {
  IntentClassification,
  EntityExtractionResult,
  NormalizedQuery,
  ContextMemoryState,
} from '@/lib/intelligence/intent/types';
import {
  createContextMemory,
  addToContext,
  addResponseContext,
  resolveReferences,
  clearContext,
} from '@/lib/intelligence/intent/ContextMemory';
import { AgentType } from './siva-store';

// =============================================================================
// Store Types
// =============================================================================

interface IntentStoreState {
  // Current classification
  currentIntent: IntentClassification | null;
  currentEntities: EntityExtractionResult | null;
  currentNormalized: NormalizedQuery | null;

  // Context memory
  contextMemory: ContextMemoryState;

  // Processing state
  isClassifying: boolean;
  classificationError: string | null;

  // History
  classificationHistory: IntentClassification[];
}

interface IntentStoreActions {
  // Set current classification
  setCurrentIntent: (intent: IntentClassification) => void;
  setCurrentEntities: (entities: EntityExtractionResult) => void;
  setCurrentNormalized: (normalized: NormalizedQuery) => void;

  // Context memory
  addContextEntry: (
    query: string,
    intent: IntentClassification,
    entities: EntityExtractionResult
  ) => void;
  addContextResponse: (agents: AgentType[], outputTypes: string[], entities: string[]) => void;
  resolveQueryReferences: (query: string) => { resolvedQuery: string; hadResolutions: boolean };
  clearContextMemory: () => void;

  // Processing state
  setIsClassifying: (isClassifying: boolean) => void;
  setClassificationError: (error: string | null) => void;

  // Full classification flow
  processClassification: (
    intent: IntentClassification,
    entities: EntityExtractionResult,
    normalized: NormalizedQuery
  ) => void;

  // Reset
  reset: () => void;
}

type IntentStore = IntentStoreState & IntentStoreActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: IntentStoreState = {
  currentIntent: null,
  currentEntities: null,
  currentNormalized: null,
  contextMemory: createContextMemory(),
  isClassifying: false,
  classificationError: null,
  classificationHistory: [],
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useIntentStore = create<IntentStore>((set, get) => ({
  ...initialState,

  // ─────────────────────────────────────────────────────────────────────────────
  // Set Current Classification
  // ─────────────────────────────────────────────────────────────────────────────

  setCurrentIntent: (intent) => {
    set((state) => ({
      currentIntent: intent,
      classificationHistory: [...state.classificationHistory.slice(-19), intent],
    }));
  },

  setCurrentEntities: (entities) => {
    set({ currentEntities: entities });
  },

  setCurrentNormalized: (normalized) => {
    set({ currentNormalized: normalized });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Context Memory
  // ─────────────────────────────────────────────────────────────────────────────

  addContextEntry: (query, intent, entities) => {
    set((state) => ({
      contextMemory: addToContext(state.contextMemory, query, intent, entities),
    }));
  },

  addContextResponse: (agents, outputTypes, entities) => {
    set((state) => ({
      contextMemory: addResponseContext(state.contextMemory, {
        agents,
        outputTypes,
        entities,
      }),
    }));
  },

  resolveQueryReferences: (query) => {
    const { contextMemory } = get();
    const { resolvedQuery, resolutions } = resolveReferences(query, contextMemory);
    const hadResolutions =
      Object.keys(resolutions.pronouns).length > 0 ||
      Object.keys(resolutions.references).length > 0;
    return { resolvedQuery, hadResolutions };
  },

  clearContextMemory: () => {
    set({ contextMemory: clearContext() });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Processing State
  // ─────────────────────────────────────────────────────────────────────────────

  setIsClassifying: (isClassifying) => {
    set({ isClassifying });
  },

  setClassificationError: (error) => {
    set({ classificationError: error });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Full Classification Flow
  // ─────────────────────────────────────────────────────────────────────────────

  processClassification: (intent, entities, normalized) => {
    const { addContextEntry } = get();

    // Update current state
    set({
      currentIntent: intent,
      currentEntities: entities,
      currentNormalized: normalized,
      isClassifying: false,
      classificationError: null,
      classificationHistory: [...get().classificationHistory.slice(-19), intent],
    });

    // Add to context memory
    addContextEntry(normalized.original, intent, entities);
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────────────────

  reset: () => {
    set(initialState);
  },
}));

// =============================================================================
// Selectors
// =============================================================================

/**
 * Get the current intent type
 */
export const selectCurrentIntentType = (state: IntentStore) =>
  state.currentIntent?.primary.type ?? null;

/**
 * Get the current confidence score
 */
export const selectCurrentConfidence = (state: IntentStore) =>
  state.currentIntent?.primary.confidence ?? 0;

/**
 * Get the required agents for current intent
 */
export const selectRequiredAgents = (state: IntentStore) =>
  state.currentIntent?.primary.agents ?? [];

/**
 * Check if current intent is compound
 */
export const selectIsCompoundIntent = (state: IntentStore) =>
  state.currentIntent?.isCompound ?? false;

/**
 * Get recent companies from context
 */
export const selectRecentCompanies = (state: IntentStore) =>
  state.contextMemory.recentCompanies;

/**
 * Get recent sectors from context
 */
export const selectRecentSectors = (state: IntentStore) =>
  state.contextMemory.recentSectors;

/**
 * Get recent regions from context
 */
export const selectRecentRegions = (state: IntentStore) =>
  state.contextMemory.recentRegions;
