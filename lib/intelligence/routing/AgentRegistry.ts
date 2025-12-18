/**
 * Agent Registry - S45
 *
 * Defines agent capabilities and characteristics for intelligent routing.
 * Maps intents to agents and tracks agent performance.
 */

import type { AgentType } from '@/lib/stores/siva-store';
import type { AgentCapability } from './types';

// =============================================================================
// Agent Capability Definitions
// =============================================================================

/**
 * Full registry of agent capabilities
 * Note: Uses AgentType from siva-store: 'discovery' | 'ranking' | 'outreach' | 'enrichment' | 'demo'
 */
export const AGENT_CAPABILITIES: Record<AgentType, AgentCapability> = {
  discovery: {
    agent: 'discovery',
    name: 'Discovery Agent',
    description: 'Finds and surfaces new opportunities based on signals, sectors, and criteria',
    primaryIntents: [
      'discover_companies',
      'find_prospects',
      'market_scan',
      'signal_detection',
    ],
    secondaryIntents: [
      'compare_companies',
      'sector_analysis',
      'region_analysis',
    ],
    entityTypes: ['company', 'sector', 'region', 'signal'],
    outputTypes: ['company_list', 'discovery_results', 'signal_report'],
    maxConcurrency: 3,
    averageLatency: 2000,
    successRate: 0.92,
  },

  ranking: {
    agent: 'ranking',
    name: 'Ranking Agent',
    description: 'Scores and prioritizes accounts using Q/T/L/E methodology',
    primaryIntents: [
      'rank_companies',
      'score_account',
      'prioritize_accounts',
      'compare_scores',
    ],
    secondaryIntents: [
      'explain_score',
      'score_components',
    ],
    entityTypes: ['company', 'score', 'metric'],
    outputTypes: ['ranked_list', 'score_card', 'comparison_matrix'],
    maxConcurrency: 5,
    averageLatency: 1500,
    successRate: 0.95,
  },

  outreach: {
    agent: 'outreach',
    name: 'Outreach Agent',
    description: 'Generates personalized outreach sequences and messaging',
    primaryIntents: [
      'generate_outreach',
      'create_sequence',
      'write_email',
      'personalize_message',
    ],
    secondaryIntents: [
      'suggest_timing',
      'find_contacts',
    ],
    entityTypes: ['company', 'contact', 'signal'],
    outputTypes: ['email_sequence', 'outreach_plan', 'personalized_message'],
    maxConcurrency: 2,
    averageLatency: 3000,
    successRate: 0.88,
  },

  enrichment: {
    agent: 'enrichment',
    name: 'Enrichment Agent',
    description: 'Deep dives into companies, sectors, and market trends for research',
    primaryIntents: [
      'research_company',
      'analyze_sector',
      'market_research',
      'competitive_analysis',
      'enrich_data',
    ],
    secondaryIntents: [
      'find_news',
      'track_signals',
      'pipeline_status',
    ],
    entityTypes: ['company', 'sector', 'region', 'signal', 'metric'],
    outputTypes: ['research_report', 'company_profile', 'market_analysis', 'enriched_data'],
    maxConcurrency: 2,
    averageLatency: 5000,
    successRate: 0.90,
  },

  demo: {
    agent: 'demo',
    name: 'Demo Agent',
    description: 'Demonstrates capabilities and provides help with the system',
    primaryIntents: [
      'demo_feature',
      'show_example',
      'help',
      'explain_feature',
    ],
    secondaryIntents: [
      'settings',
      'preferences',
    ],
    entityTypes: ['feature', 'command'],
    outputTypes: ['demo_result', 'help_content', 'example'],
    maxConcurrency: 1,
    averageLatency: 500,
    successRate: 0.98,
  },

  'deal-evaluation': {
    agent: 'deal-evaluation',
    name: 'Deal Evaluator',
    description: 'Evaluates deals through Skeptical CFO lens for GO/HIGH_RISK/NO_GO verdicts',
    primaryIntents: [
      'evaluate_deal',
      'risk_assessment',
      'deal_verdict',
      'go_no_go',
    ],
    secondaryIntents: [
      'identify_risks',
      'deal_advice',
    ],
    entityTypes: ['deal', 'risk', 'verdict'],
    outputTypes: ['deal_verdict', 'risk_factors', 'action_recommendation'],
    maxConcurrency: 2,
    averageLatency: 3000,
    successRate: 0.91,
  },
};

// =============================================================================
// Agent Selection Functions
// =============================================================================

/**
 * Get agent capability by type
 */
export function getAgentCapability(agent: AgentType): AgentCapability {
  return AGENT_CAPABILITIES[agent];
}

/**
 * Find agents that support a specific intent
 */
export function findAgentsForIntent(intentType: string): AgentType[] {
  const matches: { agent: AgentType; priority: 'primary' | 'secondary' }[] = [];

  for (const [agentType, capability] of Object.entries(AGENT_CAPABILITIES)) {
    if (capability.primaryIntents.includes(intentType)) {
      matches.push({ agent: agentType as AgentType, priority: 'primary' });
    } else if (capability.secondaryIntents.includes(intentType)) {
      matches.push({ agent: agentType as AgentType, priority: 'secondary' });
    }
  }

  // Primary matches first, then secondary
  return matches
    .sort((a, b) => (a.priority === 'primary' ? -1 : 1))
    .map(m => m.agent);
}

/**
 * Find agents that handle specific entity types
 */
export function findAgentsForEntityTypes(entityTypes: string[]): AgentType[] {
  const matches: { agent: AgentType; coverage: number }[] = [];

  for (const [agentType, capability] of Object.entries(AGENT_CAPABILITIES)) {
    const coverage = entityTypes.filter(et =>
      capability.entityTypes.includes(et)
    ).length / entityTypes.length;

    if (coverage > 0) {
      matches.push({ agent: agentType as AgentType, coverage });
    }
  }

  // Sort by coverage (highest first)
  return matches
    .sort((a, b) => b.coverage - a.coverage)
    .map(m => m.agent);
}

/**
 * Get best agent for a given intent and entities
 */
export function getBestAgent(
  intentType: string,
  entityTypes: string[]
): AgentType {
  // First try intent match
  const intentAgents = findAgentsForIntent(intentType);
  if (intentAgents.length > 0) {
    // If we have entity types, prefer agents that handle them
    if (entityTypes.length > 0) {
      const entityAgents = new Set(findAgentsForEntityTypes(entityTypes));
      const bestMatch = intentAgents.find(a => entityAgents.has(a));
      if (bestMatch) return bestMatch;
    }
    return intentAgents[0];
  }

  // Fallback to entity-based selection
  const entityAgents = findAgentsForEntityTypes(entityTypes);
  if (entityAgents.length > 0) {
    return entityAgents[0];
  }

  // Default to discovery
  return 'discovery';
}

/**
 * Get agents that can work together
 */
export function getCompatibleAgents(primaryAgent: AgentType): AgentType[] {
  const compatibility: Record<AgentType, AgentType[]> = {
    discovery: ['enrichment', 'ranking'],
    ranking: ['discovery', 'outreach'],
    outreach: ['ranking', 'enrichment'],
    enrichment: ['discovery', 'ranking'],
    demo: [],
    'deal-evaluation': ['enrichment', 'discovery'],
  };

  return compatibility[primaryAgent] || [];
}

/**
 * Calculate estimated execution time for agent chain
 */
export function estimateExecutionTime(agents: AgentType[], mode: 'sequential' | 'parallel'): number {
  const latencies = agents.map(a => AGENT_CAPABILITIES[a].averageLatency);

  if (mode === 'parallel') {
    return Math.max(...latencies);
  }

  return latencies.reduce((sum, l) => sum + l, 0);
}

/**
 * Check if agent combination is valid
 */
export function isValidAgentCombination(agents: AgentType[]): boolean {
  // Demo agent should not be combined with others
  if (agents.includes('demo') && agents.length > 1) {
    return false;
  }

  // All other combinations are valid
  return true;
}
