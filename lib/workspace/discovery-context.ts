/**
 * Discovery Context Store - S380: Workspace Discovery Experience
 *
 * Provides workspace context for SIVA awareness:
 * - Active discovery status
 * - Elapsed time tracking
 * - Expected next actions
 * - Vertical/region context
 *
 * WORKSPACE UX (LOCKED):
 * - Context is injected automatically, not user-triggered
 * - SIVA uses this to answer meta questions
 * - No "I didn't understand" when context exists
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type DiscoveryStatus =
  | 'idle'           // No active discovery
  | 'starting'       // Discovery just initiated
  | 'searching'      // Actively searching
  | 'filtering'      // Filtering results
  | 'scoring'        // Scoring leads
  | 'shortlisting'   // Creating shortlist
  | 'complete'       // Discovery finished
  | 'error';         // Discovery failed

export interface WorkspaceContext {
  // Discovery state
  activeDiscovery: boolean;
  discoveryStatus: DiscoveryStatus;
  discoveryStartedAt: Date | null;

  // Progress tracking
  elapsedTime: string;        // Human-readable: "2m 30s"
  expectedNext: string;       // What happens next
  progressPhase: number;      // 0-4 for loader animation

  // Workspace state
  cardsPresent: string[];     // ['signal', 'decision', etc.]
  cardCount: number;
  hasNBA: boolean;

  // User context
  vertical: string;
  subVertical: string;
  region: string;

  // S382: User query for inline display (like ChatGPT)
  lastQuery: string | null;

  // Job tracking (for long-running operations)
  jobId: string | null;
  jobStatus: 'pending' | 'running' | 'complete' | 'failed' | null;
}

// =============================================================================
// PROGRESSIVE LOADER STATES
// =============================================================================

export const DISCOVERY_LOADER_STATES = [
  { text: 'Scanning registries…', phase: 0 },
  { text: 'Filtering eligible employers…', phase: 1 },
  { text: 'Estimating opportunity fit…', phase: 2 },
  { text: 'Shortlisting high-fit companies…', phase: 3 },
  { text: 'Preparing recommendations…', phase: 4 },
];

// =============================================================================
// STORE
// =============================================================================

interface DiscoveryContextStore extends WorkspaceContext {
  // Actions
  startDiscovery: (params?: { vertical?: string; subVertical?: string; region?: string; query?: string }) => void;
  updateStatus: (status: DiscoveryStatus) => void;
  advancePhase: () => void;
  completeDiscovery: () => void;
  failDiscovery: (error?: string) => void;

  // Card tracking
  updateCardState: (cardTypes: string[], count: number, hasNBA: boolean) => void;

  // Context setters
  setUserContext: (vertical: string, subVertical: string, region: string) => void;
  setJobId: (jobId: string | null, status?: 'pending' | 'running' | 'complete' | 'failed') => void;
  setLastQuery: (query: string | null) => void;

  // Utilities
  getContext: () => WorkspaceContext;
  hasActiveContext: () => boolean;
  reset: () => void;
}

const initialState: WorkspaceContext = {
  activeDiscovery: false,
  discoveryStatus: 'idle',
  discoveryStartedAt: null,
  elapsedTime: '',
  expectedNext: '',
  progressPhase: 0,
  cardsPresent: [],
  cardCount: 0,
  hasNBA: false,
  vertical: 'Banking',
  subVertical: 'Employee Banking',
  region: 'All UAE',
  lastQuery: null,
  jobId: null,
  jobStatus: null,
};

export const useDiscoveryContextStore = create<DiscoveryContextStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      startDiscovery: (params) => {
        set({
          activeDiscovery: true,
          discoveryStatus: 'starting',
          discoveryStartedAt: new Date(),
          progressPhase: 0,
          expectedNext: 'signal_cards',
          ...(params?.vertical && { vertical: params.vertical }),
          ...(params?.subVertical && { subVertical: params.subVertical }),
          ...(params?.region && { region: params.region }),
          ...(params?.query && { lastQuery: params.query }),
        });

        console.log('[DiscoveryContext] Discovery started', params?.query ? `for: "${params.query}"` : '');
      },

      updateStatus: (status) => {
        const startedAt = get().discoveryStartedAt;
        const elapsed = startedAt
          ? formatElapsedTime(Date.now() - startedAt.getTime())
          : '';

        const expectedMap: Record<DiscoveryStatus, string> = {
          idle: '',
          starting: 'signal_cards',
          searching: 'signal_cards',
          filtering: 'signal_cards',
          scoring: 'ranked_cards',
          shortlisting: 'nba_card',
          complete: '',
          error: '',
        };

        set({
          discoveryStatus: status,
          elapsedTime: elapsed,
          expectedNext: expectedMap[status] || '',
        });

        console.log('[DiscoveryContext] Status:', status, 'Elapsed:', elapsed);
      },

      advancePhase: () => {
        const { progressPhase } = get();
        const nextPhase = (progressPhase + 1) % DISCOVERY_LOADER_STATES.length;

        const statusMap: DiscoveryStatus[] = [
          'searching',
          'filtering',
          'scoring',
          'shortlisting',
          'complete',
        ];

        set({
          progressPhase: nextPhase,
          discoveryStatus: statusMap[nextPhase] || 'searching',
        });
      },

      completeDiscovery: () => {
        const startedAt = get().discoveryStartedAt;
        const elapsed = startedAt
          ? formatElapsedTime(Date.now() - startedAt.getTime())
          : '';

        set({
          activeDiscovery: false,
          discoveryStatus: 'complete',
          elapsedTime: elapsed,
          expectedNext: '',
          progressPhase: 4,
        });

        console.log('[DiscoveryContext] Discovery complete. Total time:', elapsed);
      },

      failDiscovery: (error) => {
        set({
          activeDiscovery: false,
          discoveryStatus: 'error',
          expectedNext: '',
        });

        console.error('[DiscoveryContext] Discovery failed:', error);
      },

      updateCardState: (cardTypes, count, hasNBA) => {
        set({
          cardsPresent: cardTypes,
          cardCount: count,
          hasNBA,
        });
      },

      setUserContext: (vertical, subVertical, region) => {
        set({
          vertical,
          subVertical,
          region,
        });
      },

      setJobId: (jobId, status) => {
        set({
          jobId,
          jobStatus: status || (jobId ? 'pending' : null),
        });
      },

      setLastQuery: (query) => {
        set({ lastQuery: query });
      },

      getContext: () => {
        const state = get();
        return {
          activeDiscovery: state.activeDiscovery,
          discoveryStatus: state.discoveryStatus,
          discoveryStartedAt: state.discoveryStartedAt,
          elapsedTime: state.elapsedTime,
          expectedNext: state.expectedNext,
          progressPhase: state.progressPhase,
          cardsPresent: state.cardsPresent,
          cardCount: state.cardCount,
          hasNBA: state.hasNBA,
          vertical: state.vertical,
          subVertical: state.subVertical,
          region: state.region,
          lastQuery: state.lastQuery,
          jobId: state.jobId,
          jobStatus: state.jobStatus,
        };
      },

      hasActiveContext: () => {
        const state = get();
        return (
          state.activeDiscovery ||
          state.cardCount > 0 ||
          state.jobId !== null
        );
      },

      reset: () => {
        set(initialState);
      },
    }),
    { name: 'DiscoveryContextStore' }
  )
);

// =============================================================================
// UTILITIES
// =============================================================================

function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Get current loader text based on phase
 */
export function getLoaderText(phase: number): string {
  return DISCOVERY_LOADER_STATES[phase]?.text || DISCOVERY_LOADER_STATES[0].text;
}

/**
 * Build context object for SIVA injection
 */
export function buildSIVAContext(): WorkspaceContext {
  return useDiscoveryContextStore.getState().getContext();
}

// =============================================================================
// SELECTORS
// =============================================================================

export const selectIsDiscoveryActive = (state: DiscoveryContextStore) =>
  state.activeDiscovery;

export const selectDiscoveryStatus = (state: DiscoveryContextStore) =>
  state.discoveryStatus;

export const selectHasActiveContext = (state: DiscoveryContextStore) =>
  state.hasActiveContext();

export const selectLoaderText = (state: DiscoveryContextStore) =>
  getLoaderText(state.progressPhase);
