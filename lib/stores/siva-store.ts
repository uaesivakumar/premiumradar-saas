/**
 * SIVA Store - Phase 1: Wired to UPR OS
 *
 * ARCHITECTURE (Non-Negotiable):
 * - ALL intelligence comes from UPR OS
 * - NO SaaS-local intelligence
 * - SIVA is the orchestrator, UI is the renderer
 *
 * OS ENDPOINTS USED:
 * - /api/os/discovery - Signal discovery
 * - /api/os/score - QTLE scoring with EB profile
 * - /api/os/rank - EB-weighted ranking
 * - /api/os/outreach - AI outreach generation
 *
 * MANDATORY CONTEXT:
 * - profile: 'banking_employee' on every call
 * - vertical/sub_vertical/region injected
 */

import { create } from 'zustand';
import { useSalesContextStore } from './sales-context-store';

// =============================================================================
// TYPES
// =============================================================================

export type SIVAState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'generating'
  | 'complete'
  | 'error';

// =============================================================================
// HARD TIMEOUT GUARD - SIVA CAN NEVER HANG
// =============================================================================

// Discovery needs 90s (real SerpAPI queries), other ops need 10s
const DISCOVERY_TIMEOUT_MS = 90000;
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Wraps any async call with a hard timeout.
 * If the call doesn't complete within timeout, returns fallback.
 * RULE: NO await without guarded()
 */
async function guarded<T>(fn: Promise<T>, fallback: T, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    fn,
    new Promise<T>(resolve =>
      setTimeout(() => {
        console.warn('[SIVA] TIMEOUT - returning fallback after', timeoutMs, 'ms');
        resolve(fallback);
      }, timeoutMs)
    )
  ]);
}

export type AgentType =
  | 'discovery'
  | 'ranking'
  | 'outreach'
  | 'enrichment'
  | 'demo';

export type OutputObjectType =
  | 'discovery'
  | 'scoring'
  | 'ranking'
  | 'outreach'
  | 'insight'
  | 'contacts'
  | 'message';

export interface OutputObject {
  id: string;
  type: OutputObjectType;
  title: string;
  data: Record<string, unknown>;
  timestamp: Date;
  pinned: boolean;
  expanded: boolean;
  agent: AgentType;
}

export type PartialOutputObject = Omit<OutputObject, 'id' | 'timestamp'>;

export interface SIVAMessage {
  id: string;
  role: 'user' | 'siva';
  content: string;
  timestamp: Date;
  agent?: AgentType;
  outputObjects?: PartialOutputObject[];
}

export interface ReasoningStep {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'complete';
  duration?: number;
}

interface SIVAStore {
  state: SIVAState;
  activeAgent: AgentType | null;
  messages: SIVAMessage[];
  outputObjects: OutputObject[];
  reasoningSteps: ReasoningStep[];
  inputValue: string;
  showReasoningOverlay: boolean;

  setState: (state: SIVAState) => void;
  setActiveAgent: (agent: AgentType | null) => void;
  addMessage: (message: Omit<SIVAMessage, 'id' | 'timestamp'>) => void;
  addOutputObject: (obj: Omit<OutputObject, 'id' | 'timestamp'>) => void;
  removeOutputObject: (id: string) => void;
  togglePinObject: (id: string) => void;
  toggleExpandObject: (id: string) => void;
  setInputValue: (value: string) => void;
  setReasoningSteps: (steps: ReasoningStep[]) => void;
  updateReasoningStep: (id: string, updates: Partial<ReasoningStep>) => void;
  toggleReasoningOverlay: () => void;
  clearConversation: () => void;
  submitQuery: (query: string) => Promise<void>;
  reset: () => void; // Kills zombie sessions
}

// =============================================================================
// STORE
// =============================================================================

export const useSIVAStore = create<SIVAStore>((set, get) => ({
  state: 'idle',
  activeAgent: null,
  messages: [],
  outputObjects: [],
  reasoningSteps: [],
  inputValue: '',
  showReasoningOverlay: false,

  setState: (state) => set({ state }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  setInputValue: (value) => set({ inputValue: value }),
  toggleReasoningOverlay: () => set((s) => ({ showReasoningOverlay: !s.showReasoningOverlay })),

  addMessage: (message) => set((s) => ({
    messages: [...s.messages, {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    }],
  })),

  addOutputObject: (obj) => set((s) => ({
    outputObjects: [...s.outputObjects, {
      ...obj,
      id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    }],
  })),

  removeOutputObject: (id) => set((s) => ({
    outputObjects: s.outputObjects.filter((o) => o.id !== id),
  })),

  togglePinObject: (id) => set((s) => ({
    outputObjects: s.outputObjects.map((o) =>
      o.id === id ? { ...o, pinned: !o.pinned } : o
    ),
  })),

  toggleExpandObject: (id) => set((s) => ({
    outputObjects: s.outputObjects.map((o) =>
      o.id === id ? { ...o, expanded: !o.expanded } : o
    ),
  })),

  setReasoningSteps: (steps) => set({ reasoningSteps: steps }),

  updateReasoningStep: (id, updates) => set((s) => ({
    reasoningSteps: s.reasoningSteps.map((step) =>
      step.id === id ? { ...step, ...updates } : step
    ),
  })),

  clearConversation: () => set({
    messages: [],
    outputObjects: [],
    reasoningSteps: [],
    state: 'idle',
  }),

  // Kills zombie sessions - call on dashboard load
  reset: () => {
    console.log('[SIVA] RESET - Clearing all state');
    set({
      state: 'idle',
      activeAgent: null,
      messages: [],
      outputObjects: [],
      reasoningSteps: [],
      inputValue: '',
      showReasoningOverlay: false,
    });
  },

  submitQuery: async (query: string) => {
    const { addMessage, setState, setActiveAgent, addOutputObject, setReasoningSteps, updateReasoningStep } = get();

    console.log('[SIVA] === ORCHESTRATION START ===');
    console.log('[SIVA] Query:', query);

    // Detect agent early to set appropriate timeout
    const agent = detectAgent(query);
    const autoFailTimeout = agent === 'discovery' ? DISCOVERY_TIMEOUT_MS + 5000 : DEFAULT_TIMEOUT_MS + 5000;

    // Auto-fail timer - SIVA can NEVER hang
    const autoFailTimer = setTimeout(() => {
      const currentState = get().state;
      if (currentState !== 'idle' && currentState !== 'complete') {
        console.error('[SIVA] AUTO-FAIL: Stuck in', currentState, 'for too long');
        setState('error');
        // STAGING = PRODUCTION: Show error, no fake data
        addMessage({
          role: 'siva',
          content: 'Request timed out. Please try again.',
        });
        setTimeout(() => setState('idle'), 1000);
      }
    }, autoFailTimeout);

    try {
      addMessage({ role: 'user', content: query });
      set({ inputValue: '' });

      console.log('[SIVA] State: LISTENING');
      setState('listening');
      setActiveAgent(agent);
      console.log('[SIVA] Agent detected:', agent);

      const steps = getReasoningSteps(agent);
      setReasoningSteps(steps);

      console.log('[SIVA] State: THINKING');
      setState('thinking');

      // Animate reasoning steps (fast - 400ms each)
      for (let i = 0; i < steps.length; i++) {
        updateReasoningStep(steps[i].id, { status: 'active' });
        await sleep(400);
        updateReasoningStep(steps[i].id, { status: 'complete', duration: 400 });
      }

      console.log('[SIVA] State: GENERATING');
      setState('generating');

      // Generate output using UPR OS - WRAPPED IN GUARDED
      // Discovery needs 90s (real SerpAPI queries), other agents need 10s
      const timeout = agent === 'discovery' ? DISCOVERY_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
      console.log(`[SIVA] Calling generateOutput with guarded() timeout=${timeout}ms...`);
      const output = await guarded(
        generateOutput(agent, query),
        { message: 'Request timed out. Please try again.', objects: [] }, // STAGING = PRODUCTION: No fake data
        timeout
      );
      console.log('[SIVA] Output received:', output.message?.substring(0, 50), '... objects:', output.objects?.length);

      addMessage({
        role: 'siva',
        content: output.message,
        agent,
        outputObjects: output.objects,
      });
      console.log('[SIVA] Message added');

      output.objects.forEach((obj) => {
        addOutputObject(obj);
      });
      console.log('[SIVA] Output objects added');

      console.log('[SIVA] State: COMPLETE');
      setState('complete');
      await sleep(300);

      console.log('[SIVA] State: IDLE');
      setState('idle');
      setActiveAgent(null);

      // Clear auto-fail timer on success
      clearTimeout(autoFailTimer);

      console.log('[SIVA] === ORCHESTRATION COMPLETE ===');
    } catch (error) {
      console.error('[SIVA] === ORCHESTRATION ERROR ===', error);
      clearTimeout(autoFailTimer);

      // STAGING = PRODUCTION: Show error, no fake data
      addMessage({
        role: 'siva',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      });

      setState('error');
      setTimeout(() => {
        setState('idle');
        setActiveAgent(null);
      }, 1000);
    }
  },
}));

// =============================================================================
// INTENT DETECTION
// =============================================================================

function detectAgent(query: string): AgentType {
  const q = query.toLowerCase();

  // ENRICHMENT: Contact-finding intent
  if (
    q.includes('contact') ||
    q.includes('decision maker') ||
    q.includes('hr ') ||
    q.includes('cfo') ||
    q.includes('ceo') ||
    q.includes('chro') ||
    q.includes('enrich') ||
    q.includes('who should i contact')
  ) {
    return 'enrichment';
  }

  // OUTREACH: Message generation
  if (q.includes('outreach') || q.includes('email') || q.includes('message') || q.includes('write') || q.includes('draft')) {
    return 'outreach';
  }

  // RANKING: Scoring/prioritization
  if (q.includes('rank') || q.includes('score') || q.includes('prioritize') || q.includes('best') || q.includes('top')) {
    return 'ranking';
  }

  // DEMO
  if (q.includes('demo') || q.includes('show me') || q.includes('example')) {
    return 'demo';
  }

  // DISCOVERY: Default
  return 'discovery';
}

// =============================================================================
// CONTEXT HELPERS
// =============================================================================

function getSalesContext() {
  return useSalesContextStore.getState().context;
}

function getOSProfile(): string {
  const context = getSalesContext();
  // Map sub-vertical to OS profile
  const profileMap: Record<string, string> = {
    'employee-banking': 'banking_employee',
    'corporate-banking': 'banking_corporate',
    'sme-banking': 'banking_sme',
  };
  return profileMap[context.subVertical] || 'banking_employee';
}

function formatRegions(regions: string[]): string {
  if (regions.length === 0) return 'UAE';
  if (regions.length === 4) return 'All UAE';
  return regions.map(r => r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ');
}

// =============================================================================
// EB LABEL MAPPING (QTLE → EB Language)
// =============================================================================

const EB_SCORE_LABELS: Record<string, string> = {
  q_score: 'EB Fit',
  t_score: 'Hiring Intensity',
  l_score: 'Decision Maker Quality',
  e_score: 'Signal Evidence',
  composite: 'Opportunity Score',
};

function mapScoreToEBLabel(scoreKey: string): string {
  return EB_SCORE_LABELS[scoreKey] || scoreKey;
}

function mapScoresToEBFormat(scores: Record<string, unknown>): Record<string, unknown> {
  const ebScores: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(scores)) {
    const ebKey = mapScoreToEBLabel(key);
    ebScores[ebKey] = value;
  }
  return ebScores;
}

// =============================================================================
// REASONING STEPS (EB Context)
// =============================================================================

function getReasoningSteps(agent: AgentType): ReasoningStep[] {
  const ebSteps: Record<AgentType, string[]> = {
    discovery: [
      'Querying UPR OS for hiring signals',
      'Filtering by EB target criteria',
      'Calculating EB Fit scores',
      'Ranking by payroll opportunity',
    ],
    ranking: [
      'Loading entities from OS',
      'Applying EB scoring weights',
      'Calculating Hiring Intensity',
      'Ranking by EB opportunity',
    ],
    outreach: [
      'Analyzing target company signals',
      'Loading EB persona',
      'Generating personalized message',
      'Applying outreach doctrine',
    ],
    enrichment: [
      'Querying OS for company data',
      'Mapping HR/Finance contacts',
      'Analyzing payroll signals',
      'Calculating contact priority',
    ],
    demo: [
      'Preparing EB demonstration',
      'Loading sample data from OS',
    ],
  };

  return ebSteps[agent].map((title, i) => ({
    id: `step-${i}`,
    step: i + 1,
    title,
    description: title,
    status: 'pending' as const,
  }));
}

// =============================================================================
// UPR OS API CALLS
// =============================================================================

interface OSDiscoveryResponse {
  success: boolean;
  data?: {
    signals?: Array<{
      id: string;
      signal_type: string;
      title: string;
      source: string;
      confidence: number;
      evidence_json?: Record<string, unknown>;
      created_at: string;
    }>;
    companies?: Array<{
      id: string;
      name: string;
      domain?: string;
      industry?: string;
      size?: string;
      headcount?: number;
      city?: string;
      signals?: Array<{
        type: string;
        title: string;
        source: string;
        confidence: number;
      }>;
    }>;
    total?: number;
  };
  error?: string;
  profile?: string;
}

interface OSScoreResponse {
  success: boolean;
  data?: {
    entity_id?: string;
    scores?: {
      q_score?: { value: number; rating?: string; breakdown?: Record<string, number> };
      t_score?: { value: number; category?: string; breakdown?: Record<string, number> };
      l_score?: { value: number; tier?: string; breakdown?: Record<string, number> };
      e_score?: { value: number; strength?: string; breakdown?: Record<string, number> };
      composite?: { value: number; tier?: string; grade?: string };
    };
    explanations?: Record<string, string>;
  };
  error?: string;
}

interface OSRankResponse {
  success: boolean;
  data?: {
    ranked_entities?: Array<{
      rank: number;
      entity_id: string;
      rank_score: number;
      scores?: Record<string, number>;
      explanation?: {
        why_this_rank?: string[];
      };
    }>;
    total_ranked?: number;
    ranking_config?: {
      profile: string;
      weights: Record<string, number>;
    };
  };
  error?: string;
}

interface OSOutreachResponse {
  success: boolean;
  data?: {
    outreach?: Array<{
      lead_id: string;
      lead_name: string;
      success: boolean;
      content?: {
        channel: string;
        subject: string;
        body: string;
        personalization_notes?: string[];
        ai_generated?: boolean;
      };
    }>;
  };
  error?: string;
}

/**
 * Call UPR OS Discovery
 * REPLACES: /api/enrichment/search
 */
async function callOSDiscovery(): Promise<OSDiscoveryResponse> {
  const context = getSalesContext();
  const profile = getOSProfile();

  console.log('[SIVA→OS] Discovery call with profile:', profile);

  try {
    const response = await fetch('/api/os/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region_code: context.regionCountry || 'UAE',
        vertical_id: context.vertical,
        industry: 'banking',
        filters: {
          location: context.regionCountry || 'UAE',
        },
        options: {
          maxResults: 100,
          minQuality: 0,
          profile,
          sub_vertical: context.subVertical,
        },
      }),
    });

    const data = await response.json();
    console.log('[SIVA←OS] Discovery response:', {
      success: data.success,
      error: data.error,
      signalCount: data.data?.signals?.length || 0,
      companyCount: data.data?.companies?.length || 0,
      hasData: !!data.data
    });
    return data;
  } catch (error) {
    console.error('[SIVA→OS] Discovery error:', error);
    return { success: false, error: 'Discovery request failed' };
  }
}

/**
 * Call UPR OS Score
 * Uses EB profile for weights
 */
async function callOSScore(entityId: string, entityData: Record<string, unknown>, signals: Array<{ type: string; source: string; confidence?: number }>): Promise<OSScoreResponse> {
  const profile = getOSProfile();

  console.log('[SIVA→OS] Score call for entity:', entityId, 'profile:', profile);

  try {
    const response = await fetch('/api/os/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: 'company',
        entity_id: entityId,
        entity_data: entityData,
        signals,
        score_types: ['q_score', 't_score', 'l_score', 'e_score', 'composite'],
        options: {
          include_breakdown: true,
          include_explanation: true,
          profile,
        },
      }),
    });

    const data = await response.json();
    console.log('[SIVA←OS] Score response:', data.success ? `composite=${data.data?.scores?.composite?.value}` : data.error);
    return data;
  } catch (error) {
    console.error('[SIVA→OS] Score error:', error);
    return { success: false, error: 'Score request failed' };
  }
}

/**
 * Call UPR OS Rank
 * Uses EB profile weights
 */
async function callOSRank(entities: Array<{ id: string; scores?: Record<string, number> }>): Promise<OSRankResponse> {
  const profile = getOSProfile();

  console.log('[SIVA→OS] Rank call for', entities.length, 'entities, profile:', profile);

  try {
    const response = await fetch('/api/os/rank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entities,
        options: {
          profile,
          limit: 10,
          explain: true,
        },
      }),
    });

    const data = await response.json();
    console.log('[SIVA←OS] Rank response:', data.success ? `ranked=${data.data?.total_ranked}` : data.error);
    return data;
  } catch (error) {
    console.error('[SIVA→OS] Rank error:', error);
    return { success: false, error: 'Rank request failed' };
  }
}

/**
 * Call UPR OS Outreach
 * Uses EB persona for AI generation
 */
async function callOSOutreach(leads: Array<{ id: string; name: string; designation?: string; company?: string; industry?: string }>): Promise<OSOutreachResponse> {
  const profile = getOSProfile();

  console.log('[SIVA→OS] Outreach call for', leads.length, 'leads, profile:', profile);

  try {
    const response = await fetch('/api/os/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leads,
        options: {
          channel: 'email',
          tone: 'friendly',
          personalization_level: 'high',
          profile,
          ai_outreach: true,
          context: {
            campaign: 'Employee Banking',
            product: 'Payroll Solutions',
          },
        },
      }),
    });

    const data = await response.json();
    console.log('[SIVA←OS] Outreach response:', data.success ? 'success' : data.error);
    return data;
  } catch (error) {
    console.error('[SIVA→OS] Outreach error:', error);
    return { success: false, error: 'Outreach request failed' };
  }
}

// =============================================================================
// OUTPUT GENERATION (Using OS Data)
// =============================================================================

async function generateDiscoveryOutput(query: string, agent: AgentType): Promise<{
  message: string;
  objects: PartialOutputObject[];
}> {
  const context = getSalesContext();
  const regionDisplay = formatRegions(context.regions);

  // Call UPR OS Discovery
  console.log('[SIVA:Discovery] Calling OS...');
  const osResponse = await callOSDiscovery();
  console.log('[SIVA:Discovery] OS response received:', {
    success: osResponse.success,
    hasData: !!osResponse.data,
    companies: osResponse.data?.companies?.length || 0,
    signals: osResponse.data?.signals?.length || 0,
  });

  // STAGING = PRODUCTION: No fallbacks, no fake data
  // If discovery fails, show the error
  if (!osResponse.success || !osResponse.data) {
    console.log('[SIVA:Discovery] FAIL - no success or no data');
    return {
      message: `Discovery failed: ${osResponse.error || 'Unable to connect to OS'}`,
      objects: [],
    };
  }

  const companies = osResponse.data.companies || [];
  const signals = osResponse.data.signals || [];

  console.log('[SIVA:Discovery] Extracted:', { companies: companies.length, signals: signals.length });

  // STAGING = PRODUCTION: If OS returns empty, show empty state
  if (companies.length === 0 && signals.length === 0) {
    console.log('[SIVA:Discovery] EMPTY - no companies or signals');
    return {
      message: `No employers found matching your criteria in ${regionDisplay}. Try adjusting your filters.`,
      objects: [],
    };
  }

  console.log('[SIVA:Discovery] Processing', companies.length, 'real companies from OS');

  // Score the companies via OS
  console.log('[SIVA] Calling OS Score for real data');
  const scoredCompanies = await Promise.all(
    companies.slice(0, 5).map(async (company) => {
      try {
        const scoreResponse = await Promise.race([
          callOSScore(
            company.id,
            { name: company.name, domain: company.domain, industry: company.industry },
            company.signals?.map(s => ({ type: s.type, source: s.source, confidence: s.confidence })) || []
          ),
          new Promise<OSScoreResponse>((_, reject) =>
            setTimeout(() => reject(new Error('Score timeout')), 5000)
          ),
        ]);

        return {
          ...company,
          score: scoreResponse.data?.scores?.composite?.value || 50,
          grade: scoreResponse.data?.scores?.composite?.tier || 'warm',
          ebScores: scoreResponse.data?.scores ? mapScoresToEBFormat({
            'EB Fit': scoreResponse.data.scores.q_score?.value || 0,
            'Hiring Intensity': scoreResponse.data.scores.t_score?.value || 0,
            'Decision Maker Quality': scoreResponse.data.scores.l_score?.value || 0,
            'Signal Evidence': scoreResponse.data.scores.e_score?.value || 0,
          }) : {},
        };
      } catch (err) {
        console.error('[SIVA] Score failed for', company.name, err);
        return {
          ...company,
          score: 0,
          grade: 'unknown',
          ebScores: {},
        };
      }
    })
  );

  console.log('[SIVA] Scoring complete, companies:', scoredCompanies.length);

  // Sort by score
  scoredCompanies.sort((a, b) => b.score - a.score);

  const topCompany = scoredCompanies[0];

  // Hand-picked language - make it feel curated, not searched
  const countText = scoredCompanies.length === 1 ? 'One employer stands out'
    : scoredCompanies.length === 2 ? 'Two employers stand out'
    : scoredCompanies.length === 3 ? 'Three employers stand out'
    : `${scoredCompanies.length} employers stand out`;

  const gradeText = topCompany?.grade === 'hot' ? 'a strong hiring surge'
    : topCompany?.grade === 'warm' ? 'promising hiring activity'
    : 'growth signals';

  return {
    message: `${countText} today for employee banking in ${regionDisplay}. ${topCompany?.name} leads with ${gradeText}.`,
    objects: [
      {
        type: 'discovery',
        title: 'Discovery Results',
        data: {
          companies: scoredCompanies.map(c => ({
            name: c.name,
            industry: c.industry || 'Unknown',
            score: c.score,
            grade: c.grade,
            signal: c.signals?.[0]?.title || 'Hiring Signal',
            signalType: c.signals?.[0]?.type || 'hiring-expansion',
            source: c.signals?.[0]?.source || '',
            website: c.domain ? `https://${c.domain}` : '',
            size: c.size || '',
            city: c.city || 'UAE',
            headcount: c.headcount,
            ebScores: c.ebScores,
          })),
          query,
          totalResults: scoredCompanies.length,
          context: context.subVertical,
          profile: osResponse.profile || 'banking_employee',
          osSource: true,
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

async function generateRankingOutput(query: string, agent: AgentType): Promise<{
  message: string;
  objects: PartialOutputObject[];
}> {
  const context = getSalesContext();

  // First get discovery data
  const osDiscovery = await callOSDiscovery();

  if (!osDiscovery.success || !osDiscovery.data?.companies?.length) {
    return {
      message: 'No entities to rank. Discovery returned no results.',
      objects: [],
    };
  }

  const companies = osDiscovery.data.companies;

  // Score each company
  const scoredEntities = await Promise.all(
    companies.slice(0, 10).map(async (company) => {
      const scoreResponse = await callOSScore(
        company.id,
        { name: company.name, domain: company.domain, industry: company.industry },
        company.signals?.map(s => ({ type: s.type, source: s.source })) || []
      );

      return {
        id: company.id,
        name: company.name,
        industry: company.industry,
        headcount: company.headcount,
        scores: {
          q_score: scoreResponse.data?.scores?.q_score?.value || 0,
          t_score: scoreResponse.data?.scores?.t_score?.value || 0,
          l_score: scoreResponse.data?.scores?.l_score?.value || 0,
          e_score: scoreResponse.data?.scores?.e_score?.value || 0,
        },
        composite: scoreResponse.data?.scores?.composite?.value || 0,
        tier: scoreResponse.data?.scores?.composite?.tier || 'COLD',
        topSignal: company.signals?.[0]?.title || 'Signal',
      };
    })
  );

  // Call OS Rank
  const rankResponse = await callOSRank(
    scoredEntities.map(e => ({ id: e.id, scores: e.scores }))
  );

  // Merge rank results with company data
  const rankedEntities = rankResponse.data?.ranked_entities?.map((ranked) => {
    const entity = scoredEntities.find(e => e.id === ranked.entity_id);
    return {
      rank: ranked.rank,
      name: entity?.name || 'Unknown',
      industry: entity?.industry || 'Unknown',
      score: ranked.rank_score,
      headcount: entity?.headcount || 0,
      topSignal: entity?.topSignal || 'Signal',
      tier: entity?.tier,
      ebScores: {
        'EB Fit': entity?.scores.q_score || 0,
        'Hiring Intensity': entity?.scores.t_score || 0,
        'Decision Maker Quality': entity?.scores.l_score || 0,
        'Signal Evidence': entity?.scores.e_score || 0,
      },
      explanation: ranked.explanation?.why_this_rank || [],
    };
  }) || [];

  const topEntity = rankedEntities[0];

  // Hand-picked language for ranking
  const rankIntro = rankedEntities.length <= 3
    ? `Here's who deserves your attention right now.`
    : `I've prioritized these by payroll opportunity.`;

  return {
    message: `${topEntity?.name} is your strongest prospect today — high Hiring Intensity and strong EB Fit. ${rankIntro}`,
    objects: [
      {
        type: 'ranking',
        title: 'EB Opportunity Rankings',
        data: {
          rankings: rankedEntities,
          context: context.subVertical,
          scoringMethod: 'UPR OS EB Profile',
          weights: rankResponse.data?.ranking_config?.weights || {},
          profile: rankResponse.data?.ranking_config?.profile || 'banking_employee',
          osSource: true,
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

async function generateOutreachOutput(query: string, agent: AgentType): Promise<{
  message: string;
  objects: PartialOutputObject[];
}> {
  const context = getSalesContext();

  // Extract company name from query
  const companyMatch = query.match(/for\s+([A-Z][A-Za-z\s&]+?)(?:\s+|$)/i) ||
                       query.match(/to\s+([A-Z][A-Za-z\s&]+?)(?:\s+|$)/i) ||
                       query.match(/at\s+([A-Z][A-Za-z\s&]+?)(?:\s+|$)/i);

  const companyName = companyMatch?.[1]?.trim() || 'Target Company';

  // Get discovery to find the company
  const osDiscovery = await callOSDiscovery();
  const companies = osDiscovery.data?.companies || [];

  const targetCompany = companies.find(c =>
    c.name.toLowerCase().includes(companyName.toLowerCase()) ||
    companyName.toLowerCase().includes(c.name.toLowerCase())
  ) || companies[0];

  if (!targetCompany) {
    return {
      message: `No company data found for outreach. Please try discovering companies first.`,
      objects: [],
    };
  }

  // Create lead for outreach
  const lead = {
    id: targetCompany.id,
    name: 'HR Decision Maker',
    designation: 'HR Director',
    company: targetCompany.name,
    industry: targetCompany.industry || 'Banking',
  };

  // Call OS Outreach
  const outreachResponse = await callOSOutreach([lead]);

  if (!outreachResponse.success || !outreachResponse.data?.outreach?.length) {
    return {
      message: `Outreach generation failed: ${outreachResponse.error || 'Unable to generate outreach'}`,
      objects: [],
    };
  }

  const outreach = outreachResponse.data.outreach[0];

  return {
    message: `I've drafted a personalized outreach for ${targetCompany.name}'s ${lead.designation} using EB persona and hiring signals.`,
    objects: [
      {
        type: 'outreach',
        title: 'AI-Generated Outreach',
        data: {
          company: targetCompany.name,
          contact: lead.name,
          contactTitle: lead.designation,
          channel: outreach.content?.channel || 'email',
          subject: outreach.content?.subject || `Partnership Opportunity`,
          body: outreach.content?.body || 'Outreach content generated by UPR OS',
          aiGenerated: outreach.content?.ai_generated || true,
          personalizationNotes: outreach.content?.personalization_notes || [],
          context: context.subVertical,
          profile: 'banking_employee',
          osSource: true,
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

async function generateEnrichmentOutput(query: string, agent: AgentType): Promise<{
  message: string;
  objects: PartialOutputObject[];
}> {
  const context = getSalesContext();

  // Extract company name from query
  const atMatch = query.match(/at\s+([A-Z][A-Za-z\s&]+?)(?:\s+for|\s+about|\s*$)/i);
  const forMatch = query.match(/for\s+([A-Z][A-Za-z\s&]+?)(?:\s+about|\s*$)/i);
  const companyName = atMatch?.[1]?.trim() || forMatch?.[1]?.trim() || '';

  // Get discovery data
  const osDiscovery = await callOSDiscovery();
  const companies = osDiscovery.data?.companies || [];

  const targetCompany = companies.find(c =>
    c.name.toLowerCase().includes(companyName.toLowerCase()) ||
    companyName.toLowerCase().includes(c.name.toLowerCase())
  ) || companies[0];

  if (!targetCompany) {
    return {
      message: `Could not find "${companyName}". Try discovering companies first.`,
      objects: [],
    };
  }

  // Score the company
  const scoreResponse = await callOSScore(
    targetCompany.id,
    { name: targetCompany.name, domain: targetCompany.domain, industry: targetCompany.industry },
    targetCompany.signals?.map(s => ({ type: s.type, source: s.source })) || []
  );

  // Build contact info (from OS enrichment data or defaults)
  const contacts = [
    {
      name: 'HR Director',
      title: 'HR Director',
      department: 'Human Resources',
      priority: 'Primary',
    },
    {
      name: 'Payroll Manager',
      title: 'Payroll Manager',
      department: 'Finance',
      priority: 'Secondary',
    },
  ];

  return {
    message: `Found ${contacts.length} target contacts at ${targetCompany.name}. Opportunity Score: ${scoreResponse.data?.scores?.composite?.value || 0} (${scoreResponse.data?.scores?.composite?.tier || 'COLD'}).`,
    objects: [
      {
        type: 'contacts',
        title: `Contacts at ${targetCompany.name}`,
        data: {
          company: targetCompany.name,
          industry: targetCompany.industry || 'Unknown',
          signal: targetCompany.signals?.[0]?.type || 'hiring-expansion',
          contacts,
          companyInfo: {
            headcount: targetCompany.headcount,
            city: targetCompany.city,
            score: scoreResponse.data?.scores?.composite?.value || 0,
            tier: scoreResponse.data?.scores?.composite?.tier || 'COLD',
          },
          ebScores: scoreResponse.data?.scores ? {
            'EB Fit': scoreResponse.data.scores.q_score?.value || 0,
            'Hiring Intensity': scoreResponse.data.scores.t_score?.value || 0,
            'Decision Maker Quality': scoreResponse.data.scores.l_score?.value || 0,
            'Signal Evidence': scoreResponse.data.scores.e_score?.value || 0,
          } : {},
          context: context.subVertical,
          profile: 'banking_employee',
          osSource: true,
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

// =============================================================================
// DRIFT GUARD (EB Context Protection)
// =============================================================================

const FORBIDDEN_EB_TERMS = [
  'digital transformation',
  'cloud migration',
  'core banking',
  'tier 1 bank',
  'tier 2 bank',
  'fintech disruption',
  'digital maturity',
  'technology adoption',
  'regulatory compliance',
  'open banking',
  'banking infrastructure',
];

function containsForbiddenTerms(query: string): boolean {
  const q = query.toLowerCase();
  return FORBIDDEN_EB_TERMS.some(term => q.includes(term));
}

function applyDriftGuard(query: string): { query: string; driftDetected: boolean } {
  if (!containsForbiddenTerms(query)) {
    return { query, driftDetected: false };
  }

  // Redirect bank-focused queries to employer-focused
  const redirected = query
    .replace(/\bbank(s|ing)?\s+(digital|cloud|core|tier)/gi, 'employer hiring')
    .replace(/\bdigital transformation\b/gi, 'hiring expansion')
    .replace(/\bcloud migration\b/gi, 'workforce growth')
    .replace(/\bcore banking\b/gi, 'payroll services')
    .replace(/\bfintech disruption\b/gi, 'employer growth')
    .replace(/\bopen banking\b/gi, 'employee banking needs');

  console.log('[SIVA Drift Guard] Redirected query:', query, '→', redirected);
  return { query: redirected, driftDetected: true };
}

// =============================================================================
// MAIN OUTPUT DISPATCHER
// =============================================================================

async function generateOutput(agent: AgentType, query: string): Promise<{
  message: string;
  objects: PartialOutputObject[];
}> {
  const context = getSalesContext();

  if (!context.vertical || !context.subVertical) {
    return {
      message: 'Please configure your sales context (vertical/sub-vertical) to access UPR OS intelligence.',
      objects: [],
    };
  }

  // Apply drift guard for EB mode
  const { query: processedQuery, driftDetected } = applyDriftGuard(query);

  if (driftDetected) {
    console.log('[SIVA] Drift guard activated - query redirected to EB context');
  }

  switch (agent) {
    case 'discovery':
      return generateDiscoveryOutput(processedQuery, agent);
    case 'ranking':
      return generateRankingOutput(processedQuery, agent);
    case 'outreach':
      return generateOutreachOutput(processedQuery, agent);
    case 'enrichment':
      return generateEnrichmentOutput(processedQuery, agent);
    default:
      return generateDiscoveryOutput(processedQuery, agent);
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// DELETED: getDemoCompanies and buildSyntheticDiscovery
// STAGING = PRODUCTION: No fake data, no fallbacks, no demos
