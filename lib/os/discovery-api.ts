/**
 * OS Discovery API Client
 *
 * API hooks for connecting SaaS to OS discovery endpoints.
 * S218-S223: SIVA Intelligence Enhancement
 *
 * ARCHITECTURE COMPLIANCE (PRD v1.2):
 * - SaaS calls OS APIs, never makes decisions locally
 * - All state lives in OS, SaaS only renders responses
 * - Feedback events emitted to OS (Interaction Ledger), not stored locally
 * - OS MAY invoke permitted SIVA tools based on persona, phase, and policy gates
 *
 * Architecture: OS decides. SIVA reasons. SaaS renders.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type FeedbackAction = 'LIKE' | 'DISLIKE' | 'SAVE' | 'DISMISS' | 'SHOW_MORE' | 'FIND_SIMILAR';

export interface Lead {
  company_id: string;
  name: string;
  industry?: string;
  location?: string;
  size_bucket?: string;
  score: number;
  signals?: Array<{ type: string; description?: string }>;
  feedback?: FeedbackAction | null;
}

export interface BatchResponse {
  leads: Lead[];
  batchNumber: number;
  hasMore: boolean;
  remaining: number;
  requiresFeedback?: boolean;
  stats?: {
    shown: number;
    totalLeads: number;
    likeCount: number;
    dislikeCount: number;
    saveCount: number;
  };
}

export interface ConversationalPrompt {
  id: string;
  type: 'AFTER_BATCH' | 'AFTER_LIKE' | 'AFTER_DISLIKE' | 'LOW_MATCHES' | 'REFINEMENT';
  text: string;
  options?: Array<{
    label: string;
    value: string;
    action: string;
  }>;
  allowFreeform?: boolean;
  placeholder?: string;
}

export interface SavedLead {
  companyId: string;
  companyName: string;
  industry?: string;
  location?: string;
  savedAt: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface DiscoverySession {
  sessionId: string;
  currentBatch: BatchResponse | null;
  savedLeads: SavedLead[];
  currentPrompt: ConversationalPrompt | null;
  commentary: string | null;
  error: string | null;
  isLoading: boolean;
}

// =============================================================================
// DISCOVERY STORE
// =============================================================================

interface DiscoveryStore extends DiscoverySession {
  // Session Management
  startSession: (params: {
    vertical: string;
    sub_vertical: string;
    region: string;
    filters?: Record<string, unknown>;
  }) => Promise<void>;
  endSession: () => void;

  // Progressive Delivery - SAAS_EVENT_ONLY
  showMore: () => Promise<void>;

  // Feedback - SAAS_EVENT_ONLY
  submitFeedback: (
    companyId: string,
    action: FeedbackAction,
    metadata?: Record<string, unknown>
  ) => Promise<void>;

  // Saved Leads - SAAS_RENDER_ONLY
  fetchSavedLeads: () => Promise<void>;
  unsaveLead: (companyId: string) => Promise<void>;

  // Conversational - SAAS_EVENT_ONLY
  respondToPrompt: (promptId: string, response: { action: string; value?: string }) => Promise<void>;
  dismissPrompt: (promptId: string) => void;
  submitRefinement: (text: string) => Promise<void>;
}

// OS API base URL - uses intelligence router for S218-S223
const OS_BASE_URL = process.env.NEXT_PUBLIC_UPR_OS_URL || 'https://upr-os-service-191599223867.us-central1.run.app';
const OS_INTELLIGENCE_URL = `${OS_BASE_URL}/api/os/intelligence`;

export const useDiscoveryStore = create<DiscoveryStore>((set, get) => ({
  sessionId: '',
  currentBatch: null,
  savedLeads: [],
  currentPrompt: null,
  commentary: null,
  error: null,
  isLoading: false,

  startSession: async (params) => {
    set({ isLoading: true, error: null });

    try {
      // Call OS intelligence session endpoint - OS_AUTHORITY
      const response = await fetch(`${OS_INTELLIGENCE_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
        body: JSON.stringify({
          tenant_id: 'current', // From auth context
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start discovery session');
      }

      const data = await response.json();

      set({
        sessionId: data.session_id,
        currentBatch: {
          leads: data.leads || [],
          batchNumber: 1,
          hasMore: data.has_more || false,
          remaining: data.remaining || 0,
          stats: data.stats,
        },
        commentary: data.commentary || null,
        currentPrompt: data.prompt || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  endSession: () => {
    set({
      sessionId: '',
      currentBatch: null,
      currentPrompt: null,
      commentary: null,
      error: null,
    });
  },

  showMore: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true, error: null });

    try {
      // SAAS_EVENT_ONLY: Request next batch from OS intelligence router
      const response = await fetch(`${OS_INTELLIGENCE_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
        body: JSON.stringify({
          session_id: sessionId,
          action: 'SHOW_MORE',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === 'FEEDBACK_REQUIRED') {
          set({
            currentBatch: {
              ...get().currentBatch!,
              requiresFeedback: true,
            },
            isLoading: false,
          });
          return;
        }
        throw new Error(data.message || 'Failed to load more leads');
      }

      const data = await response.json();

      set((state) => ({
        currentBatch: {
          leads: [...(state.currentBatch?.leads || []), ...data.leads],
          batchNumber: data.batch_number,
          hasMore: data.has_more,
          remaining: data.remaining,
          requiresFeedback: false,
          stats: data.stats,
        },
        commentary: data.commentary || state.commentary,
        currentPrompt: data.prompt || null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  submitFeedback: async (companyId, action, metadata) => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      // SAAS_EVENT_ONLY: Emit feedback to OS (records to Interaction Ledger)
      const response = await fetch(`${OS_INTELLIGENCE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
        body: JSON.stringify({
          session_id: sessionId,
          company_id: companyId,
          action,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const data = await response.json();

      // SAAS_RENDER_ONLY: Update UI from OS response
      set((state) => ({
        currentBatch: state.currentBatch
          ? {
              ...state.currentBatch,
              leads: state.currentBatch.leads.map((lead) =>
                lead.company_id === companyId
                  ? { ...lead, feedback: action }
                  : lead
              ),
              requiresFeedback: false,
              stats: data.stats || state.currentBatch.stats,
            }
          : null,
        currentPrompt: data.prompt || null,
        savedLeads:
          action === 'SAVE'
            ? [
                ...state.savedLeads,
                {
                  companyId,
                  companyName: metadata?.company_name as string || companyId,
                  industry: metadata?.industry as string,
                  location: metadata?.location as string,
                  savedAt: new Date().toISOString(),
                },
              ]
            : action === 'DISMISS'
              ? state.savedLeads.filter((l) => l.companyId !== companyId)
              : state.savedLeads,
      }));
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  },

  fetchSavedLeads: async () => {
    try {
      // SAAS_RENDER_ONLY: Fetch saved leads from OS intelligence router
      const response = await fetch(`${OS_INTELLIGENCE_URL}/saved`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved leads');
      }

      const data = await response.json();

      set({ savedLeads: data.saved_leads || [] });
    } catch (error) {
      console.error('Failed to fetch saved leads:', error);
    }
  },

  unsaveLead: async (companyId) => {
    try {
      // SAAS_EVENT_ONLY: Emit unsave to OS intelligence router
      await fetch(`${OS_INTELLIGENCE_URL}/saved/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
      });

      // SAAS_RENDER_ONLY: Update from OS response
      set((state) => ({
        savedLeads: state.savedLeads.filter((l) => l.companyId !== companyId),
      }));
    } catch (error) {
      console.error('Failed to unsave lead:', error);
    }
  },

  respondToPrompt: async (promptId, response) => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      // SAAS_EVENT_ONLY: Send response to OS intelligence router
      const apiResponse = await fetch(`${OS_INTELLIGENCE_URL}/prompt/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
        body: JSON.stringify({
          session_id: sessionId,
          prompt_id: promptId,
          response,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to submit prompt response');
      }

      const data = await apiResponse.json();

      // SAAS_RENDER_ONLY: Update from OS response
      set({
        currentPrompt: data.next_prompt || null,
        commentary: data.commentary || null,
      });
    } catch (error) {
      console.error('Prompt response failed:', error);
    }
  },

  dismissPrompt: (promptId) => {
    set({ currentPrompt: null });
  },

  submitRefinement: async (text) => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ isLoading: true });

    try {
      // SAAS_EVENT_ONLY: Send raw text, OS orchestrates, SIVA parses
      const response = await fetch(`${OS_INTELLIGENCE_URL}/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
        body: JSON.stringify({
          session_id: sessionId,
          refinement_text: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply refinement');
      }

      const data = await response.json();

      // SAAS_RENDER_ONLY: Update batch from OS response
      set({
        currentBatch: {
          leads: data.leads || [],
          batchNumber: 1,
          hasMore: data.has_more || false,
          remaining: data.remaining || 0,
          stats: data.stats,
        },
        commentary: data.commentary || null,
        currentPrompt: data.prompt || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));

// =============================================================================
// PACK CONFIG API
// =============================================================================

export interface PackConfig {
  pack_id: string;
  name: string;
  version: string;
  vertical: string;
  sub_vertical: string;
  description: string;
  signal_types: Array<{
    slug: string;
    name: string;
    category: string;
    description: string;
    weight: number;
    priority: number;
  }>;
  edge_cases: Array<{
    type: string;
    condition: string;
    action: 'BLOCK' | 'SKIP' | 'WARN' | 'BOOST';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    multiplier: number;
    can_override: boolean;
  }>;
  scoring_weights: {
    quality: number;
    timing: number;
    likelihood: number;
    evidence: number;
  };
  qtle_config: Record<string, Record<string, unknown>>;
  progressive_delivery?: {
    enabled: boolean;
    initial_batch: number;
    subsequent_batch: number;
    require_feedback_before_next: boolean;
    max_leads_per_session: number;
  };
  preference_learning?: {
    enabled: boolean;
    signals_to_track: string[];
    learning_window_days: number;
    min_signals_for_learning: number;
  };
}

export async function fetchPackConfig(
  vertical: string,
  subVertical: string
): Promise<PackConfig | null> {
  try {
    const response = await fetch(
      `${OS_BASE_URL}/api/os/verticals/${vertical}/packs/${subVertical}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-pr-os-token': process.env.NEXT_PUBLIC_OS_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch pack config:', error);
    return null;
  }
}

export default useDiscoveryStore;
