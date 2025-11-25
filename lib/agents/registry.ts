/**
 * Agent Registry - Sprint S28
 * Central registry for all SIVA agents
 */

import { AgentConfig, Agent, AgentContext, AgentResponse } from './types';
import { AgentType, PartialOutputObject } from '@/lib/stores/siva-store';

// Agent configurations
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  discovery: {
    id: 'discovery',
    name: 'Discovery Agent',
    description: 'Finds and identifies potential prospects matching your criteria',
    icon: 'Search',
    color: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    capabilities: [
      { id: 'company-search', name: 'Company Search', description: 'Search company databases' },
      { id: 'signal-detection', name: 'Signal Detection', description: 'Detect buying signals' },
      { id: 'market-scan', name: 'Market Scan', description: 'Scan markets for opportunities' },
    ],
    keywords: ['find', 'discover', 'search', 'companies', 'prospects', 'look for', 'identify', 'locate'],
    priority: 10,
  },
  ranking: {
    id: 'ranking',
    name: 'Ranking Agent',
    description: 'Scores and prioritizes prospects using Q/T/L/E methodology',
    icon: 'Trophy',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    capabilities: [
      { id: 'qtle-scoring', name: 'Q/T/L/E Scoring', description: 'Calculate prospect scores' },
      { id: 'prioritization', name: 'Prioritization', description: 'Rank by potential' },
      { id: 'comparison', name: 'Comparison', description: 'Compare prospects' },
    ],
    keywords: ['rank', 'score', 'prioritize', 'best', 'top', 'compare', 'evaluate', 'assess', 'qtle'],
    priority: 8,
  },
  outreach: {
    id: 'outreach',
    name: 'Outreach Agent',
    description: 'Crafts personalized messages for prospect engagement',
    icon: 'Send',
    color: '#10B981',
    gradient: 'from-green-500 to-emerald-500',
    capabilities: [
      { id: 'email-draft', name: 'Email Draft', description: 'Write email messages' },
      { id: 'linkedin-draft', name: 'LinkedIn Draft', description: 'Write LinkedIn messages' },
      { id: 'personalization', name: 'Personalization', description: 'Personalize content' },
    ],
    keywords: ['write', 'draft', 'email', 'message', 'outreach', 'contact', 'reach out', 'linkedin', 'compose'],
    priority: 7,
  },
  enrichment: {
    id: 'enrichment',
    name: 'Enrichment Agent',
    description: 'Gathers deep data on companies and decision makers',
    icon: 'Database',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-pink-500',
    capabilities: [
      { id: 'firmographic', name: 'Firmographic Data', description: 'Company details' },
      { id: 'technographic', name: 'Technographic Data', description: 'Tech stack info' },
      { id: 'contact-mapping', name: 'Contact Mapping', description: 'Find decision makers' },
    ],
    keywords: ['enrich', 'details', 'more about', 'tell me about', 'info', 'information', 'profile', 'learn about'],
    priority: 6,
  },
  demo: {
    id: 'demo',
    name: 'Demo Agent',
    description: 'Provides interactive demonstrations of SIVA capabilities',
    icon: 'Play',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    capabilities: [
      { id: 'showcase', name: 'Feature Showcase', description: 'Demo features' },
      { id: 'walkthrough', name: 'Walkthrough', description: 'Guide through flows' },
      { id: 'example', name: 'Examples', description: 'Show examples' },
    ],
    keywords: ['demo', 'show me', 'example', 'demonstrate', 'how does', 'walkthrough', 'tutorial'],
    priority: 5,
  },
};

// Agent implementations
class DiscoveryAgent implements Agent {
  config = AGENT_CONFIGS.discovery;

  canHandle(query: string): boolean {
    return this.getConfidence(query) > 0.3;
  }

  getConfidence(query: string): number {
    const q = query.toLowerCase();
    const matches = this.config.keywords.filter((kw) => q.includes(kw));
    return Math.min(matches.length * 0.3, 1);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    const companies = [
      { name: 'Emirates NBD', industry: 'Banking', score: 92, signal: 'Digital transformation' },
      { name: 'ADCB', industry: 'Banking', score: 88, signal: 'Leadership change' },
      { name: 'Mashreq', industry: 'Banking', score: 85, signal: 'Cloud migration' },
      { name: 'FAB', industry: 'Banking', score: 82, signal: 'Expansion plans' },
      { name: 'DIB', industry: 'Banking', score: 78, signal: 'Tech investment' },
    ];

    const objects: PartialOutputObject[] = [
      {
        type: 'discovery',
        title: 'Discovery Results',
        data: { companies, query: context.query, totalResults: companies.length },
        pinned: false,
        expanded: true,
        agent: 'discovery',
      },
    ];

    return {
      message: `I found ${companies.length} ${context.industry || 'banking'} companies matching your criteria. Here are the top prospects with active buying signals.`,
      objects,
      reasoningSteps: [
        { step: 1, title: 'Parsing query intent', description: 'Understanding search criteria', status: 'complete' },
        { step: 2, title: 'Querying databases', description: 'Searching company registries', status: 'complete' },
        { step: 3, title: 'Detecting signals', description: 'Identifying buying signals', status: 'complete' },
        { step: 4, title: 'Ranking results', description: 'Sorting by relevance', status: 'complete' },
      ],
      followUpSuggestions: [
        'Rank these companies by Q/T/L/E score',
        'Tell me more about Emirates NBD',
        'Draft an outreach email for the top result',
      ],
    };
  }
}

class RankingAgent implements Agent {
  config = AGENT_CONFIGS.ranking;

  canHandle(query: string): boolean {
    return this.getConfidence(query) > 0.3;
  }

  getConfidence(query: string): number {
    const q = query.toLowerCase();
    const matches = this.config.keywords.filter((kw) => q.includes(kw));
    return Math.min(matches.length * 0.3, 1);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    const rankings = [
      { rank: 1, name: 'Emirates NBD', Q: 95, T: 88, L: 90, E: 94, total: 92, signal: 'Digital transformation' },
      { rank: 2, name: 'ADCB', Q: 90, T: 92, L: 85, E: 86, total: 88, signal: 'Leadership change' },
      { rank: 3, name: 'Mashreq', Q: 88, T: 80, L: 88, E: 82, total: 85, signal: 'Cloud migration' },
    ];

    const objects: PartialOutputObject[] = [
      {
        type: 'ranking',
        title: 'Ranked Prospects',
        data: { rankings },
        pinned: false,
        expanded: true,
        agent: 'ranking',
      },
    ];

    return {
      message: `I've analyzed and ranked your prospects using Q/T/L/E scoring. Emirates NBD leads with a composite score of 92, driven by strong digital transformation signals.`,
      objects,
      reasoningSteps: [
        { step: 1, title: 'Loading profiles', description: 'Gathering company data', status: 'complete' },
        { step: 2, title: 'Quality scoring', description: 'Assessing ICP fit', status: 'complete' },
        { step: 3, title: 'Timing analysis', description: 'Evaluating buying signals', status: 'complete' },
        { step: 4, title: 'Final ranking', description: 'Computing composite scores', status: 'complete' },
      ],
      followUpSuggestions: [
        'Show me the score breakdown for Emirates NBD',
        'Draft outreach for the top 3',
        'Why is ADCB ranked second?',
      ],
    };
  }
}

class OutreachAgent implements Agent {
  config = AGENT_CONFIGS.outreach;

  canHandle(query: string): boolean {
    return this.getConfidence(query) > 0.3;
  }

  getConfidence(query: string): number {
    const q = query.toLowerCase();
    const matches = this.config.keywords.filter((kw) => q.includes(kw));
    return Math.min(matches.length * 0.3, 1);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    const objects: PartialOutputObject[] = [
      {
        type: 'outreach',
        title: 'Outreach Draft',
        data: {
          company: 'Emirates NBD',
          channel: 'email',
          subject: 'Digital Banking Transformation Partnership',
          body: `Dear Team,

I noticed Emirates NBD's impressive digital transformation initiatives, particularly your recent investments in cloud infrastructure and customer experience platforms.

Our AI-powered sales intelligence platform has helped similar institutions in the region accelerate their digital journey while maintaining regulatory compliance.

Would you be open to a brief 15-minute conversation to explore how we might support your digital banking goals?

Best regards`,
          signals: ['Digital transformation', 'Cloud migration'],
        },
        pinned: false,
        expanded: true,
        agent: 'outreach',
      },
    ];

    return {
      message: `I've drafted a personalized outreach message for Emirates NBD based on their digital transformation signals. The message references their specific initiatives to increase relevance.`,
      objects,
      reasoningSteps: [
        { step: 1, title: 'Analyzing signals', description: 'Identifying key triggers', status: 'complete' },
        { step: 2, title: 'Selecting template', description: 'Choosing optimal format', status: 'complete' },
        { step: 3, title: 'Personalizing', description: 'Adding company context', status: 'complete' },
        { step: 4, title: 'Optimizing', description: 'Refining for engagement', status: 'complete' },
      ],
      followUpSuggestions: [
        'Make it more casual',
        'Create a LinkedIn version',
        'Add a specific case study reference',
      ],
    };
  }
}

class EnrichmentAgent implements Agent {
  config = AGENT_CONFIGS.enrichment;

  canHandle(query: string): boolean {
    return this.getConfidence(query) > 0.3;
  }

  getConfidence(query: string): number {
    const q = query.toLowerCase();
    const matches = this.config.keywords.filter((kw) => q.includes(kw));
    return Math.min(matches.length * 0.3, 1);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    const objects: PartialOutputObject[] = [
      {
        type: 'insight',
        title: 'Company Profile: Emirates NBD',
        data: {
          company: 'Emirates NBD',
          firmographic: {
            employees: '10,000+',
            revenue: '$5B+',
            founded: 2007,
            headquarters: 'Dubai, UAE',
            type: 'Public (DFM: EMIRATESNBD)',
          },
          decisionMakers: [
            { name: 'Shayne Nelson', role: 'Group CEO' },
            { name: 'Patrick Sullivan', role: 'Group CTO' },
            { name: 'Ahmed Al Qassim', role: 'EVP Retail Banking' },
          ],
          techStack: ['Oracle Banking', 'AWS', 'Salesforce', 'Temenos T24'],
          recentNews: [
            'Announced $500M digital transformation initiative',
            'Partnership with Microsoft for cloud services',
            'Launched new mobile banking platform',
          ],
        },
        pinned: false,
        expanded: true,
        agent: 'enrichment',
      },
    ];

    return {
      message: `I've enriched the profile for Emirates NBD with firmographic data, key decision makers, tech stack information, and recent news. They're a strong prospect with active digital initiatives.`,
      objects,
      reasoningSteps: [
        { step: 1, title: 'Gathering firmographics', description: 'Company details', status: 'complete' },
        { step: 2, title: 'Mapping contacts', description: 'Finding decision makers', status: 'complete' },
        { step: 3, title: 'Tech detection', description: 'Identifying tech stack', status: 'complete' },
        { step: 4, title: 'News analysis', description: 'Recent developments', status: 'complete' },
      ],
      followUpSuggestions: [
        'Find similar companies',
        'Score this company',
        'Draft outreach to the CTO',
      ],
    };
  }
}

class DemoAgent implements Agent {
  config = AGENT_CONFIGS.demo;

  canHandle(query: string): boolean {
    return this.getConfidence(query) > 0.3;
  }

  getConfidence(query: string): number {
    const q = query.toLowerCase();
    const matches = this.config.keywords.filter((kw) => q.includes(kw));
    return Math.min(matches.length * 0.3, 1);
  }

  async execute(context: AgentContext): Promise<AgentResponse> {
    return {
      message: `Let me walk you through SIVA's capabilities! I can discover companies, score them with Q/T/L/E methodology, and craft personalized outreach. Try asking me to "find banking companies in UAE" to see the discovery flow in action.`,
      objects: [],
      reasoningSteps: [
        { step: 1, title: 'Preparing demo', description: 'Loading examples', status: 'complete' },
        { step: 2, title: 'Setting context', description: 'Configuring industry', status: 'complete' },
      ],
      followUpSuggestions: [
        'Find banking companies in UAE',
        'Show me how scoring works',
        'Demo the outreach feature',
      ],
    };
  }
}

// Agent registry
const agents: Agent[] = [
  new DiscoveryAgent(),
  new RankingAgent(),
  new OutreachAgent(),
  new EnrichmentAgent(),
  new DemoAgent(),
];

// Route query to best agent
export function routeToAgent(query: string): Agent {
  let bestAgent: Agent = agents[0];
  let bestConfidence = 0;

  for (const agent of agents) {
    const confidence = agent.getConfidence(query);
    if (confidence > bestConfidence) {
      bestConfidence = confidence;
      bestAgent = agent;
    }
  }

  return bestAgent;
}

// Get agent by type
export function getAgent(type: AgentType): Agent | undefined {
  return agents.find((a) => a.config.id === type);
}

// Get all agent configs
export function getAllAgentConfigs(): AgentConfig[] {
  return Object.values(AGENT_CONFIGS);
}

// Execute agent
export async function executeAgent(query: string, industry: string): Promise<{
  agent: AgentType;
  response: AgentResponse;
}> {
  const agent = routeToAgent(query);
  const response = await agent.execute({ query, industry });
  return { agent: agent.config.id, response };
}
