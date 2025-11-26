/**
 * Evidence Store - S44
 *
 * Zustand store for evidence collection and reasoning state.
 * DOES NOT modify siva-store.ts - standalone store.
 */

import { create } from 'zustand';
import type {
  EvidenceCollection,
  ReasoningChain,
  QTLEJustification,
  RankingEvidencePack,
  OutreachEvidencePack,
  DiscoveryEvidencePack,
} from '@/lib/intelligence/evidence/types';
import {
  collectEvidence,
  buildReasoningChain,
  generateQTLEJustification,
} from '@/lib/intelligence/evidence';

// =============================================================================
// Store Types
// =============================================================================

interface EvidenceStore {
  // Current state
  currentEvidence: EvidenceCollection | null;
  currentReasoning: ReasoningChain | null;
  currentJustification: QTLEJustification | null;

  // Evidence packs (keyed by company/entity)
  rankingPacks: Map<string, RankingEvidencePack>;
  outreachPacks: Map<string, OutreachEvidencePack>;
  discoveryPacks: Map<string, DiscoveryEvidencePack>;

  // Processing state
  isCollecting: boolean;
  isReasoning: boolean;
  error: string | null;

  // Cache
  evidenceCache: Map<string, EvidenceCollection>;

  // Actions
  collectForTarget: (
    target: string,
    targetType?: 'company' | 'sector' | 'region',
    signals?: string[]
  ) => Promise<EvidenceCollection>;

  buildReasoning: (
    collection: EvidenceCollection,
    focus?: string
  ) => ReasoningChain;

  generateJustification: (
    company: string,
    existingScores?: { Q?: number; T?: number; L?: number; E?: number }
  ) => QTLEJustification | null;

  // Pack management
  storeRankingPack: (pack: RankingEvidencePack) => void;
  storeOutreachPack: (pack: OutreachEvidencePack) => void;
  storeDiscoveryPack: (pack: DiscoveryEvidencePack) => void;

  getRankingPack: (company: string) => RankingEvidencePack | undefined;
  getOutreachPack: (company: string) => OutreachEvidencePack | undefined;
  getDiscoveryPack: (query: string) => DiscoveryEvidencePack | undefined;

  // Cache management
  getCachedEvidence: (target: string) => EvidenceCollection | undefined;
  clearCache: () => void;

  // Reset
  reset: () => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useEvidenceStore = create<EvidenceStore>((set, get) => ({
  // Initial state
  currentEvidence: null,
  currentReasoning: null,
  currentJustification: null,
  rankingPacks: new Map(),
  outreachPacks: new Map(),
  discoveryPacks: new Map(),
  isCollecting: false,
  isReasoning: false,
  error: null,
  evidenceCache: new Map(),

  // Collect evidence for a target
  collectForTarget: async (target, targetType = 'company', signals = []) => {
    // Check cache first
    const cacheKey = `${target}-${targetType}-${signals.sort().join(',')}`;
    const cached = get().evidenceCache.get(cacheKey);
    if (cached) {
      set({ currentEvidence: cached });
      return cached;
    }

    set({ isCollecting: true, error: null });

    try {
      // Collect evidence (synchronous in current implementation)
      const collection = collectEvidence(target, targetType, signals);

      // Cache the result
      const cache = new Map(get().evidenceCache);
      cache.set(cacheKey, collection);

      set({
        currentEvidence: collection,
        evidenceCache: cache,
        isCollecting: false,
      });

      return collection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Evidence collection failed';
      set({ error: errorMessage, isCollecting: false });
      throw err;
    }
  },

  // Build reasoning chain from evidence
  buildReasoning: (collection, focus) => {
    set({ isReasoning: true, error: null });

    try {
      const reasoning = buildReasoningChain(collection, { focus });

      set({
        currentReasoning: reasoning,
        isReasoning: false,
      });

      return reasoning;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Reasoning chain failed';
      set({ error: errorMessage, isReasoning: false });
      throw err;
    }
  },

  // Generate Q/T/L/E justification
  generateJustification: (company, existingScores) => {
    const { currentEvidence } = get();

    if (!currentEvidence) {
      set({ error: 'No evidence collected. Call collectForTarget first.' });
      return null;
    }

    try {
      const justification = generateQTLEJustification(
        company,
        currentEvidence,
        existingScores
      );

      set({ currentJustification: justification });

      return justification;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Justification generation failed';
      set({ error: errorMessage });
      return null;
    }
  },

  // Store ranking pack
  storeRankingPack: (pack) => {
    const packs = new Map(get().rankingPacks);
    packs.set(pack.company, pack);
    set({ rankingPacks: packs });
  },

  // Store outreach pack
  storeOutreachPack: (pack) => {
    const packs = new Map(get().outreachPacks);
    packs.set(pack.company, pack);
    set({ outreachPacks: packs });
  },

  // Store discovery pack
  storeDiscoveryPack: (pack) => {
    const packs = new Map(get().discoveryPacks);
    packs.set(pack.query, pack);
    set({ discoveryPacks: packs });
  },

  // Get ranking pack
  getRankingPack: (company) => {
    return get().rankingPacks.get(company);
  },

  // Get outreach pack
  getOutreachPack: (company) => {
    return get().outreachPacks.get(company);
  },

  // Get discovery pack
  getDiscoveryPack: (query) => {
    return get().discoveryPacks.get(query);
  },

  // Get cached evidence
  getCachedEvidence: (target) => {
    // Find any cache entry that starts with target
    for (const [key, value] of get().evidenceCache) {
      if (key.startsWith(target)) {
        return value;
      }
    }
    return undefined;
  },

  // Clear cache
  clearCache: () => {
    set({ evidenceCache: new Map() });
  },

  // Reset store
  reset: () => {
    set({
      currentEvidence: null,
      currentReasoning: null,
      currentJustification: null,
      rankingPacks: new Map(),
      outreachPacks: new Map(),
      discoveryPacks: new Map(),
      isCollecting: false,
      isReasoning: false,
      error: null,
      evidenceCache: new Map(),
    });
  },
}));

// =============================================================================
// Selectors (for performance optimization)
// =============================================================================

/**
 * Select current evidence summary
 */
export const selectEvidenceSummary = (state: EvidenceStore) => {
  const { currentEvidence } = state;
  if (!currentEvidence) return null;

  return {
    target: currentEvidence.target,
    count: currentEvidence.totalCount,
    confidence: currentEvidence.averageConfidence,
    sources: currentEvidence.sources,
  };
};

/**
 * Select reasoning progress
 */
export const selectReasoningProgress = (state: EvidenceStore) => {
  const { currentReasoning, isReasoning } = state;

  if (!currentReasoning) {
    return { isReasoning, progress: 0, currentStage: null };
  }

  const completedSteps = currentReasoning.steps.filter(
    s => s.status === 'complete'
  ).length;

  return {
    isReasoning,
    progress: completedSteps / 5, // 5 stages total
    currentStage: currentReasoning.steps.find(s => s.status === 'running')?.stage || null,
  };
};

/**
 * Select justification for display
 */
export const selectJustificationDisplay = (state: EvidenceStore) => {
  const { currentJustification } = state;
  if (!currentJustification) return null;

  return {
    company: currentJustification.company,
    overall: currentJustification.overall.score,
    Q: currentJustification.Q.score,
    T: currentJustification.T.score,
    L: currentJustification.L.score,
    E: currentJustification.E.score,
    summary: currentJustification.summary,
  };
};
