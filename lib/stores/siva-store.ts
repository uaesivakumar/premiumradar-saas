/**
 * SIVA Store - Sprint S26 + EB Journey Fix
 * Global state management for SIVA AI Surface
 *
 * NOW CONTEXT-AWARE:
 * - Reads from SalesContextStore for vertical/subVertical/regions
 * - Uses EB employer data when in Employee Banking mode
 * - Implements drift guard to block non-EB responses
 */

import { create } from 'zustand';
import { useSalesContextStore } from './sales-context-store';
import { generateEBEmployers, scoreEBEmployer, EB_SIGNAL_TYPES } from '@/lib/discovery/eb-employers';
import type { EBCompanyData } from '@/components/discovery/EBDiscoveryCard';

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
// EMPLOYEE BANKING OUTPUT GENERATION
// =============================================================================

/**
 * Generate EB-specific output for discovery
 */
function generateEBDiscoveryOutput(query: string, agent: AgentType): {
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
} {
  const context = getSalesContext();
  const regions = context.regions;
  const regionDisplay = formatRegions(regions);

  // Get EB employers from the data layer
  const employers = generateEBEmployers(regions)
    .map(emp => ({ ...emp, score: scoreEBEmployer(emp) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const topEmployer = employers[0];

  return {
    message: `I found ${employers.length} employers in ${regionDisplay} with strong hiring signals for payroll acquisition. ${topEmployer?.name} leads with ${topEmployer?.headcountGrowth}% headcount growth.`,
    objects: [
      {
        type: 'discovery',
        title: 'Employer Discovery Results',
        data: {
          companies: employers.map(emp => ({
            name: emp.name,
            industry: emp.industry,
            score: emp.score,
            signal: emp.signals[0]?.title || 'Hiring Expansion',
            headcount: emp.headcount,
            headcountGrowth: emp.headcountGrowth,
            city: emp.city,
          })),
          query,
          totalResults: employers.length,
          context: 'employee-banking',
          targetEntity: 'employers',
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

/**
 * Generate EB-specific output for ranking
 */
function generateEBRankingOutput(query: string, agent: AgentType): {
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
} {
  const context = getSalesContext();
  const employers = generateEBEmployers(context.regions)
    .map(emp => ({ ...emp, score: scoreEBEmployer(emp) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    message: `I've ranked employers by payroll acquisition potential. ${employers[0]?.name} leads with a score of ${employers[0]?.score} based on hiring velocity and payroll opportunity signals.`,
    objects: [
      {
        type: 'ranking',
        title: 'Employer Rankings (Payroll Potential)',
        data: {
          rankings: employers.map((emp, idx) => ({
            rank: idx + 1,
            name: emp.name,
            industry: emp.industry,
            score: emp.score,
            hiringSignals: emp.signals.length,
            headcountGrowth: `${emp.headcountGrowth}%`,
            headcount: emp.headcount,
            topSignal: emp.signals[0]?.title || 'Hiring',
          })),
          context: 'employee-banking',
          scoringMethod: 'EB Payroll Opportunity Score',
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

/**
 * Generate EB-specific output for outreach
 */
function generateEBOutreachOutput(query: string, agent: AgentType): {
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
} {
  const context = getSalesContext();
  const employers = generateEBEmployers(context.regions)
    .sort((a, b) => b.score - a.score);

  // Try to find employer mentioned in query
  const queryLower = query.toLowerCase();
  let targetEmployer = employers.find(emp =>
    queryLower.includes(emp.name.toLowerCase())
  );

  // Fallback to top employer
  if (!targetEmployer) {
    targetEmployer = employers[0];
  }

  const signals = targetEmployer?.signals || [];
  const topSignal = signals[0];
  const hrContact = targetEmployer?.decisionMaker;

  return {
    message: `I've drafted a payroll-focused outreach for ${targetEmployer?.name}'s ${hrContact?.title || 'HR Director'} highlighting their ${topSignal?.title || 'hiring expansion'}.`,
    objects: [
      {
        type: 'outreach',
        title: 'Payroll Outreach Draft',
        data: {
          company: targetEmployer?.name,
          contact: hrContact?.name || 'HR Director',
          contactTitle: hrContact?.title || 'Head of HR',
          channel: 'email',
          subject: `Payroll Solutions for ${targetEmployer?.name}'s Growing Workforce`,
          body: `Dear ${hrContact?.name || 'HR Team'},

I noticed ${targetEmployer?.name}'s impressive ${topSignal?.title?.toLowerCase() || 'growth'} - ${topSignal?.description || 'expanding your workforce significantly'}.

Managing payroll for ${targetEmployer?.headcount?.toLocaleString() || 'thousands of'} employees (with ${targetEmployer?.headcountGrowth}% growth) requires a banking partner who understands scale.

Our Employee Banking solutions include:
• Seamless payroll processing for large workforces
• Employee salary accounts with premium benefits
• Dedicated relationship management for HR teams
• Digital onboarding for new hires

Would you be open to a brief call to discuss how we're helping similar ${targetEmployer?.industry || 'companies'} in the UAE streamline their employee banking?

Best regards`,
          signals: signals.map(s => s.title),
          context: 'employee-banking',
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

/**
 * Generate EB-specific output for enrichment
 */
function generateEBEnrichmentOutput(query: string, agent: AgentType): {
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
} {
  const context = getSalesContext();
  const employers = generateEBEmployers(context.regions);

  // Try to find employer mentioned in query
  const queryLower = query.toLowerCase();
  let targetEmployer = employers.find(emp =>
    queryLower.includes(emp.name.toLowerCase())
  );

  if (!targetEmployer) {
    targetEmployer = employers.sort((a, b) => b.score - a.score)[0];
  }

  return {
    message: `I've enriched ${targetEmployer?.name}'s profile with HR contacts, hiring patterns, and payroll intelligence.`,
    objects: [
      {
        type: 'insight',
        title: 'Employer Profile (EB Intelligence)',
        data: {
          company: targetEmployer?.name,
          industry: targetEmployer?.industry,
          location: `${targetEmployer?.city}, UAE`,
          firmographic: {
            employees: targetEmployer?.headcount?.toLocaleString() || 'N/A',
            headcountGrowth: `${targetEmployer?.headcountGrowth}%`,
            tier: targetEmployer?.bankingTier,
          },
          hrContact: targetEmployer?.decisionMaker,
          signals: targetEmployer?.signals.map(s => ({
            type: s.type,
            title: s.title,
            confidence: `${Math.round((s.confidence || 0.8) * 100)}%`,
            source: s.source,
          })),
          payrollOpportunity: {
            estimatedAccounts: targetEmployer?.headcount,
            growthPotential: `${targetEmployer?.headcountGrowth}% annually`,
            competitiveStatus: 'Open to proposals',
          },
          context: 'employee-banking',
        },
        pinned: false,
        expanded: true,
        agent,
      },
    ],
  };
}

// =============================================================================
// GENERIC BANKING OUTPUT (fallback for non-EB)
// =============================================================================

function generateGenericBankingOutput(agent: AgentType, query: string): {
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
} {
  switch (agent) {
    case 'discovery':
      return {
        message: `I found 5 banking companies in the UAE matching your criteria.`,
        objects: [
          {
            type: 'discovery',
            title: 'Discovery Results',
            data: {
              companies: [
                { name: 'Emirates NBD', industry: 'Banking', score: 92, signal: 'Expansion plans' },
                { name: 'ADCB', industry: 'Banking', score: 88, signal: 'Leadership change' },
                { name: 'Mashreq', industry: 'Banking', score: 85, signal: 'Market growth' },
                { name: 'FAB', industry: 'Banking', score: 82, signal: 'New initiatives' },
                { name: 'DIB', industry: 'Banking', score: 78, signal: 'Investment' },
              ],
              query,
              totalResults: 5,
            },
            pinned: false,
            expanded: true,
            agent,
          },
        ],
      };

    case 'ranking':
      return {
        message: `I've analyzed and ranked your prospects. Emirates NBD leads with a composite score of 92.`,
        objects: [
          {
            type: 'ranking',
            title: 'Ranked Prospects',
            data: {
              rankings: [
                { rank: 1, name: 'Emirates NBD', score: 92 },
                { rank: 2, name: 'ADCB', score: 88 },
                { rank: 3, name: 'Mashreq', score: 85 },
              ],
            },
            pinned: false,
            expanded: true,
            agent,
          },
        ],
      };

    case 'outreach':
      return {
        message: `I've drafted a personalized outreach message.`,
        objects: [
          {
            type: 'outreach',
            title: 'Outreach Draft',
            data: {
              company: 'Target Company',
              channel: 'email',
              subject: 'Partnership Opportunity',
              body: `Dear Team,\n\nI noticed your company's growth initiatives. Would you be open to a brief conversation?\n\nBest regards`,
              signals: ['Growth', 'Expansion'],
            },
            pinned: false,
            expanded: true,
            agent,
          },
        ],
      };

    case 'enrichment':
      return {
        message: `I've enriched the company profile with firmographic data and contacts.`,
        objects: [
          {
            type: 'insight',
            title: 'Enriched Profile',
            data: {
              company: 'Target Company',
              firmographic: { employees: 'N/A', revenue: 'N/A' },
              decisionMakers: ['Contact information pending'],
            },
            pinned: false,
            expanded: true,
            agent,
          },
        ],
      };

    default:
      return {
        message: `Here's what I found for your request.`,
        objects: [],
      };
  }
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

// Helper: Generate output based on agent (CONTEXT-AWARE)
async function generateOutput(agent: AgentType, query: string): Promise<{
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
}> {
  await sleep(500);

  const isEB = isEmployeeBankingMode();

  // If in EB mode, use EB-specific output
  if (isEB) {
    // Apply drift guard if needed
    const processedQuery = containsForbiddenTermsForEB(query)
      ? applyEBDriftGuard(query)
      : query;

    switch (agent) {
      case 'discovery':
        return generateEBDiscoveryOutput(processedQuery, agent);
      case 'ranking':
        return generateEBRankingOutput(processedQuery, agent);
      case 'outreach':
        return generateEBOutreachOutput(processedQuery, agent);
      case 'enrichment':
        return generateEBEnrichmentOutput(processedQuery, agent);
      default:
        return generateEBDiscoveryOutput(processedQuery, agent);
    }
  }

  // Generic banking output (non-EB)
  return generateGenericBankingOutput(agent, query);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
