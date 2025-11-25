/**
 * SIVA Store - Sprint S26
 * Global state management for SIVA AI Surface
 */

import { create } from 'zustand';

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

// Helper: Get reasoning steps for agent
function getReasoningSteps(agent: AgentType): ReasoningStep[] {
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

// Helper: Generate output based on agent
async function generateOutput(agent: AgentType, query: string): Promise<{
  message: string;
  objects: Omit<OutputObject, 'id' | 'timestamp'>[];
}> {
  await sleep(500);

  switch (agent) {
    case 'discovery':
      return {
        message: `I found 5 banking companies in the UAE matching your criteria. Here are the top prospects with high digital transformation signals.`,
        objects: [
          {
            type: 'discovery',
            title: 'Discovery Results',
            data: {
              companies: [
                { name: 'Emirates NBD', industry: 'Banking', score: 92, signal: 'Digital transformation' },
                { name: 'ADCB', industry: 'Banking', score: 88, signal: 'Leadership change' },
                { name: 'Mashreq', industry: 'Banking', score: 85, signal: 'Cloud migration' },
                { name: 'FAB', industry: 'Banking', score: 82, signal: 'Expansion plans' },
                { name: 'DIB', industry: 'Banking', score: 78, signal: 'Tech investment' },
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
        message: `I've analyzed and ranked your prospects using Q/T/L/E scoring. Emirates NBD leads with a composite score of 92.`,
        objects: [
          {
            type: 'ranking',
            title: 'Ranked Prospects',
            data: {
              rankings: [
                { rank: 1, name: 'Emirates NBD', Q: 95, T: 88, L: 90, E: 94, total: 92 },
                { rank: 2, name: 'ADCB', Q: 90, T: 92, L: 85, E: 86, total: 88 },
                { rank: 3, name: 'Mashreq', Q: 88, T: 80, L: 88, E: 82, total: 85 },
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
        message: `I've drafted a personalized outreach message for Emirates NBD based on their digital transformation signals.`,
        objects: [
          {
            type: 'outreach',
            title: 'Outreach Draft',
            data: {
              company: 'Emirates NBD',
              channel: 'email',
              subject: 'Digital Banking Transformation Partnership',
              body: `Dear Team,\n\nI noticed Emirates NBD's impressive digital transformation initiatives. Our AI-powered sales intelligence platform has helped similar institutions accelerate their digital journey.\n\nWould you be open to a brief conversation about how we're helping banks in the region?\n\nBest regards`,
              signals: ['Digital transformation', 'Tech investment'],
            },
            pinned: false,
            expanded: true,
            agent,
          },
        ],
      };

    case 'enrichment':
      return {
        message: `I've enriched the company profile with firmographic data, decision makers, and tech stack information.`,
        objects: [
          {
            type: 'insight',
            title: 'Enriched Profile',
            data: {
              company: 'Emirates NBD',
              firmographic: { employees: '10,000+', revenue: '$5B+', founded: 2007 },
              decisionMakers: ['CEO: Shayne Nelson', 'CTO: Patrick Sullivan'],
              techStack: ['Oracle', 'AWS', 'Salesforce'],
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
