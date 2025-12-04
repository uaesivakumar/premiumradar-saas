/**
 * SIVA Store - Sprint S26 + Real Data Integration
 * Global state management for SIVA AI Surface
 *
 * REAL DATA MODE:
 * - Reads from SalesContextStore for vertical/subVertical/regions
 * - Calls enrichment API for real Apollo + SERP data
 * - Uses vertical config for signal types and scoring
 * - Implements drift guard to block off-context responses
 */

import { create } from 'zustand';
import { useSalesContextStore } from './sales-context-store';
import type { EnrichedEntity, EnrichmentSearchResult } from '@/lib/integrations/enrichment-engine';

// SIVA's operational states
export type SIVAState =
  | 'idle'           // Ready for input
  | 'listening'      // Processing input
  | 'thinking'       // Reasoning through task
  | 'generating'     // Creating output
  | 'complete';      // Task finished

// Agent types available
export type AgentType =
  | 'discovery'      // Find companies
  | 'ranking'        // Score & rank
  | 'outreach'       // Compose messages
  | 'enrichment'     // Deep data
  | 'demo';          // Demonstrations

// Output object types
export type OutputObjectType =
  | 'discovery'
  | 'scoring'
  | 'ranking'
  | 'outreach'
  | 'insight'
  | 'message';

// An output object rendered in the surface
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

// Partial output object (before ID/timestamp assigned)
export type PartialOutputObject = Omit<OutputObject, 'id' | 'timestamp'>;

// A message in the conversation
export interface SIVAMessage {
  id: string;
  role: 'user' | 'siva';
  content: string;
  timestamp: Date;
  agent?: AgentType;
  outputObjects?: PartialOutputObject[];
}

// Reasoning step for transparency
export interface ReasoningStep {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'complete';
  duration?: number;
}

interface SIVAStore {
  // State
  state: SIVAState;
  activeAgent: AgentType | null;
  messages: SIVAMessage[];
  outputObjects: OutputObject[];
  reasoningSteps: ReasoningStep[];
  inputValue: string;
  showReasoningOverlay: boolean;

  // Actions
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

  // Complex actions
  submitQuery: (query: string) => Promise<void>;
}

export const useSIVAStore = create<SIVAStore>((set, get) => ({
  // Initial state
  state: 'idle',
  activeAgent: null,
  messages: [],
  outputObjects: [],
  reasoningSteps: [],
  inputValue: '',
  showReasoningOverlay: false,

  // Basic setters
  setState: (state) => set({ state }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  setInputValue: (value) => set({ inputValue: value }),
  toggleReasoningOverlay: () => set((s) => ({ showReasoningOverlay: !s.showReasoningOverlay })),

  // Message management
  addMessage: (message) => set((s) => ({
    messages: [...s.messages, {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    }],
  })),

  // Output object management
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

  // Reasoning steps
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

  // Main query submission
  submitQuery: async (query: string) => {
    const { addMessage, setState, setActiveAgent, addOutputObject, setReasoningSteps, updateReasoningStep } = get();

    // Add user message
    addMessage({ role: 'user', content: query });
    set({ inputValue: '' });

    // Start processing
    setState('listening');

    // Detect intent and route to agent
    const agent = detectAgent(query);
    setActiveAgent(agent);

    // Set up reasoning steps
    const steps = getReasoningSteps(agent);
    setReasoningSteps(steps);

    setState('thinking');

    // Simulate reasoning process
    for (let i = 0; i < steps.length; i++) {
      updateReasoningStep(steps[i].id, { status: 'active' });
      await sleep(800 + Math.random() * 400);
      updateReasoningStep(steps[i].id, { status: 'complete', duration: 800 });
    }

    setState('generating');

    // Generate output based on agent
    const output = await generateOutput(agent, query);

    // Add SIVA response
    addMessage({
      role: 'siva',
      content: output.message,
      agent,
      outputObjects: output.objects,
    });

    // Add output objects to surface
    output.objects.forEach((obj) => {
      addOutputObject(obj);
    });

    setState('complete');
    await sleep(500);
    setState('idle');
    setActiveAgent(null);
  },
}));

// Helper: Detect which agent to use
function detectAgent(query: string): AgentType {
  const q = query.toLowerCase();

  if (q.includes('find') || q.includes('discover') || q.includes('search') || q.includes('companies')) {
    return 'discovery';
  }
  if (q.includes('rank') || q.includes('score') || q.includes('prioritize') || q.includes('best')) {
    return 'ranking';
  }
  if (q.includes('outreach') || q.includes('email') || q.includes('message') || q.includes('write')) {
    return 'outreach';
  }
  if (q.includes('enrich') || q.includes('details') || q.includes('more about')) {
    return 'enrichment';
  }
  if (q.includes('demo') || q.includes('show me') || q.includes('example')) {
    return 'demo';
  }

  return 'discovery'; // Default
}

// =============================================================================
// CONTEXT-AWARE HELPERS
// =============================================================================

/**
 * Check if we're in Employee Banking mode
 */
function isEmployeeBankingMode(): boolean {
  const context = useSalesContextStore.getState().context;
  return context.vertical === 'banking' && context.subVertical === 'employee-banking';
}

/**
 * Get current sales context
 */
function getSalesContext() {
  return useSalesContextStore.getState().context;
}

/**
 * Format regions for display
 */
function formatRegions(regions: string[]): string {
  if (regions.length === 0) return 'UAE';
  if (regions.length === 4) return 'All UAE';
  return regions.map(r => r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ');
}

// Helper: Get reasoning steps for agent (CONTEXT-AWARE)
function getReasoningSteps(agent: AgentType): ReasoningStep[] {
  const isEB = isEmployeeBankingMode();

  // EB-specific reasoning steps
  if (isEB) {
    const ebSteps: Record<AgentType, string[]> = {
      discovery: ['Parsing query intent', 'Identifying hiring signals', 'Querying employer database', 'Filtering by headcount growth', 'Preparing employer cards'],
      ranking: ['Loading employer data', 'Calculating hiring velocity', 'Analyzing payroll potential', 'Scoring EB opportunity', 'Ranking by payroll conversion likelihood'],
      outreach: ['Analyzing target employer', 'Identifying HR decision maker', 'Detecting hiring signals', 'Personalizing payroll pitch', 'Optimizing for HR engagement'],
      enrichment: ['Gathering employer firmographics', 'Mapping HR/Finance contacts', 'Detecting hiring patterns', 'Analyzing payroll signals'],
      demo: ['Preparing EB demonstration', 'Loading employer data', 'Setting up journey visualization'],
    };
    return ebSteps[agent].map((title, i) => ({
      id: `step-${i}`,
      step: i + 1,
      title,
      description: title,
      status: 'pending' as const,
    }));
  }

  // Generic banking reasoning steps
  const baseSteps: Record<AgentType, string[]> = {
    discovery: ['Parsing query intent', 'Identifying search criteria', 'Querying company database', 'Filtering results', 'Preparing discovery cards'],
    ranking: ['Loading prospect data', 'Calculating Q scores', 'Calculating T scores', 'Calculating L scores', 'Calculating E scores', 'Ranking by composite'],
    outreach: ['Analyzing target company', 'Identifying key signals', 'Selecting message template', 'Personalizing content', 'Optimizing for engagement'],
    enrichment: ['Gathering firmographic data', 'Mapping decision makers', 'Detecting tech stack', 'Analyzing intent signals'],
    demo: ['Preparing demonstration', 'Loading sample data', 'Setting up visualization'],
  };

  return baseSteps[agent].map((title, i) => ({
    id: `step-${i}`,
    step: i + 1,
    title,
    description: title,
    status: 'pending' as const,
  }));
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Fetch enriched entities from the enrichment API
 */
async function fetchEnrichedEntities(
  vertical: string,
  subVertical: string,
  region: string,
  regions: string[],
  limit: number = 5
): Promise<EnrichedEntity[]> {
  try {
    const response = await fetch('/api/enrichment/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vertical,
        subVertical,
        region,
        regions: regions.length > 0 ? regions : undefined,
        limit,
      }),
    });

    const data = await response.json();

    if (data.success && data.data?.entities) {
      return data.data.entities;
    }

    console.warn('[SIVA] Enrichment API returned no entities:', data.error);
    return [];
  } catch (error) {
    console.error('[SIVA] Failed to fetch enriched entities:', error);
    return [];
  }
}

// =============================================================================
// CONTEXT-AWARE OUTPUT GENERATION
// =============================================================================

/**
 * Generate discovery output using REAL data from enrichment API
 */
async function generateDiscoveryOutputReal(query: string, agent: AgentType): Promise<{
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
}> {
  const context = getSalesContext();
  const { vertical, subVertical, regions } = context;
  const regionDisplay = formatRegions(regions);

  // Fetch REAL data from enrichment API
  const entities = await fetchEnrichedEntities(
    vertical,
    subVertical,
    regions[0] || 'UAE',
    regions,
    5
  );

  if (entities.length === 0) {
    return {
      message: `No entities found matching your criteria. Please check that API integrations are configured in Super Admin → Integrations.`,
      objects: [],
    };
  }

  const topEntity = entities[0];

  return {
    message: `I found ${entities.length} entities in ${regionDisplay} with strong signals. ${topEntity?.name} leads with a score of ${topEntity?.score} based on real hiring and expansion data.`,
    objects: [
      {
        type: 'discovery',
        title: 'Discovery Results',
        data: {
          companies: entities.map(e => ({
            name: e.name,
            industry: e.industry || 'Unknown',
            score: e.score,
            signal: e.signals[0]?.title || 'Active Signal',
            headcount: e.headcount || 0,
            headcountGrowth: e.headcountGrowth || 0,
            city: e.city || 'UAE',
            dataSources: e.dataSources,
          })),
          query,
          totalResults: entities.length,
          context: subVertical,
          targetEntity: entities[0]?.type || 'company',
          dataQuality: {
            sources: entities[0]?.dataSources || [],
            signalCount: entities.reduce((sum, e) => sum + e.signals.length, 0),
          },
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

/**
 * Generate ranking output using REAL data
 */
async function generateRankingOutputReal(query: string, agent: AgentType): Promise<{
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
}> {
  const context = getSalesContext();
  const { vertical, subVertical, regions } = context;

  const entities = await fetchEnrichedEntities(
    vertical,
    subVertical,
    regions[0] || 'UAE',
    regions,
    5
  );

  if (entities.length === 0) {
    return {
      message: `No entities to rank. Please check API integrations.`,
      objects: [],
    };
  }

  return {
    message: `I've ranked entities by opportunity score. ${entities[0]?.name} leads with a score of ${entities[0]?.score} based on real signals.`,
    objects: [
      {
        type: 'ranking',
        title: 'Rankings by Opportunity Score',
        data: {
          rankings: entities.map((e, idx) => ({
            rank: idx + 1,
            name: e.name,
            industry: e.industry || 'Unknown',
            score: e.score,
            signalCount: e.signals.length,
            headcountGrowth: `${e.headcountGrowth || 0}%`,
            headcount: e.headcount || 0,
            topSignal: e.signals[0]?.title || 'Signal',
            scoreBreakdown: e.scoreBreakdown,
          })),
          context: subVertical,
          scoringMethod: 'Vertical Config Score',
          dataSources: entities[0]?.dataSources || [],
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

/**
 * Generate outreach output using REAL data
 */
async function generateOutreachOutputReal(query: string, agent: AgentType): Promise<{
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
}> {
  const context = getSalesContext();
  const { vertical, subVertical, regions } = context;

  const entities = await fetchEnrichedEntities(
    vertical,
    subVertical,
    regions[0] || 'UAE',
    regions,
    5
  );

  // Try to find entity mentioned in query
  const queryLower = query.toLowerCase();
  let targetEntity = entities.find(e =>
    queryLower.includes(e.name.toLowerCase())
  );

  // Fallback to top entity
  if (!targetEntity) {
    targetEntity = entities[0];
  }

  if (!targetEntity) {
    return {
      message: `No entities found for outreach. Please check API integrations.`,
      objects: [],
    };
  }

  const signals = targetEntity.signals || [];
  const topSignal = signals[0];
  const contact = targetEntity.decisionMaker;

  return {
    message: `I've drafted an outreach for ${targetEntity.name}'s ${contact?.title || 'Decision Maker'} highlighting their ${topSignal?.title || 'recent activity'}.`,
    objects: [
      {
        type: 'outreach',
        title: 'Outreach Draft',
        data: {
          company: targetEntity.name,
          contact: contact?.name || 'Decision Maker',
          contactTitle: contact?.title || 'Key Contact',
          channel: 'email',
          subject: `Partnership Opportunity for ${targetEntity.name}`,
          body: `Dear ${contact?.name || 'Team'},

I noticed ${targetEntity.name}'s impressive ${topSignal?.title?.toLowerCase() || 'growth'} - ${topSignal?.description || 'significant developments in your organization'}.

${targetEntity.headcount ? `Managing a workforce of ${targetEntity.headcount.toLocaleString()} employees` : 'Your organization'}${targetEntity.headcountGrowth ? ` (with ${targetEntity.headcountGrowth}% growth)` : ''} presents unique opportunities.

Would you be open to a brief conversation to explore how we might support your growth?

Best regards`,
          signals: signals.map(s => s.title),
          context: subVertical,
          dataSources: targetEntity.dataSources,
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

/**
 * Generate enrichment output using REAL data
 */
async function generateEnrichmentOutputReal(query: string, agent: AgentType): Promise<{
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
}> {
  const context = getSalesContext();
  const { vertical, subVertical, regions } = context;

  const entities = await fetchEnrichedEntities(
    vertical,
    subVertical,
    regions[0] || 'UAE',
    regions,
    5
  );

  // Try to find entity mentioned in query
  const queryLower = query.toLowerCase();
  let targetEntity = entities.find(e =>
    queryLower.includes(e.name.toLowerCase())
  );

  if (!targetEntity) {
    targetEntity = entities[0];
  }

  if (!targetEntity) {
    return {
      message: `No entity found for enrichment. Please check API integrations.`,
      objects: [],
    };
  }

  return {
    message: `I've enriched ${targetEntity.name}'s profile with contacts, signals, and opportunity intelligence.`,
    objects: [
      {
        type: 'insight',
        title: 'Entity Profile (Enriched)',
        data: {
          company: targetEntity.name,
          industry: targetEntity.industry || 'Unknown',
          location: `${targetEntity.city || 'UAE'}`,
          firmographic: {
            employees: targetEntity.headcount?.toLocaleString() || 'N/A',
            headcountGrowth: `${targetEntity.headcountGrowth || 0}%`,
            size: targetEntity.size,
          },
          contact: targetEntity.decisionMaker,
          signals: targetEntity.signals.map(s => ({
            type: s.type,
            title: s.title,
            confidence: `${Math.round((s.confidence || 0.8) * 100)}%`,
            source: s.source,
          })),
          scoreBreakdown: targetEntity.scoreBreakdown,
          dataSources: targetEntity.dataSources,
          freshness: targetEntity.freshness,
          context: subVertical,
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}


// =============================================================================
// DRIFT GUARD
// =============================================================================

/**
 * Check if query contains forbidden terms for EB mode
 * Returns true if query should be blocked/redirected
 */
function containsForbiddenTermsForEB(query: string): boolean {
  const forbiddenTerms = [
    'digital transformation',
    'cloud migration',
    'core banking',
    'tier 1 bank',
    'tier 2 bank',
    'fintech',
    'digital maturity',
    'technology adoption',
    'regulatory compliance',
    'open banking',
  ];

  const queryLower = query.toLowerCase();
  return forbiddenTerms.some(term => queryLower.includes(term));
}

/**
 * Apply drift guard - redirect non-EB queries to EB context
 */
function applyEBDriftGuard(query: string): string {
  // Redirect bank-focused queries to employer-focused
  let redirectedQuery = query
    .replace(/\bbank(s|ing)?\b/gi, 'employer')
    .replace(/\bdigital transformation\b/gi, 'hiring expansion')
    .replace(/\bQ\/T\/L\/E\b/gi, 'payroll opportunity')
    .replace(/\bcloud migration\b/gi, 'workforce growth')
    .replace(/\bcore banking\b/gi, 'payroll services');

  return redirectedQuery;
}

// Helper: Generate output based on agent using REAL DATA
async function generateOutput(agent: AgentType, query: string): Promise<{
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
}> {
  const context = getSalesContext();
  const hasVerticalConfig = context.vertical && context.subVertical;

  // If we have vertical config, use REAL data from enrichment API
  if (hasVerticalConfig) {
    // Apply drift guard if needed
    const processedQuery = containsForbiddenTermsForEB(query)
      ? applyEBDriftGuard(query)
      : query;

    switch (agent) {
      case 'discovery':
        return generateDiscoveryOutputReal(processedQuery, agent);
      case 'ranking':
        return generateRankingOutputReal(processedQuery, agent);
      case 'outreach':
        return generateOutreachOutputReal(processedQuery, agent);
      case 'enrichment':
        return generateEnrichmentOutputReal(processedQuery, agent);
      default:
        return generateDiscoveryOutputReal(processedQuery, agent);
    }
  }

  // Fallback for missing vertical config
  return {
    message: 'Please configure your vertical/sub-vertical context to access real data.',
    objects: [],
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
