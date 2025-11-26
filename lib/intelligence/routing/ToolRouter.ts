/**
 * Tool Router - S45
 *
 * Intelligent routing of queries to appropriate agents.
 * Creates orchestration plans for multi-agent execution.
 */

import type { AgentType } from '@/lib/stores/siva-store';
import type { IntentClassification, ExtractedEntity } from '../intent/types';
import type {
  RoutingMode,
  RoutingDecision,
  ExecutionStep,
  OrchestrationPlan,
  FallbackPath,
  RouterConfig,
  DEFAULT_ROUTER_CONFIG,
} from './types';
import {
  getBestAgent,
  getCompatibleAgents,
  findAgentsForIntent,
  estimateExecutionTime,
  isValidAgentCombination,
  AGENT_CAPABILITIES,
} from './AgentRegistry';

// =============================================================================
// Router Functions
// =============================================================================

/**
 * Make routing decision based on intent and entities
 */
export function makeRoutingDecision(
  query: string,
  intent: IntentClassification,
  entities: ExtractedEntity[],
  config: RouterConfig = {
    defaultTimeout: 30000,
    maxRetries: 2,
    parallelismLimit: 3,
    confidenceThreshold: 0.6,
    enableFallbacks: true,
    enableHandoffs: true,
  }
): RoutingDecision {
  const decisionId = `rd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Determine primary agent from intent
  const entityTypes = entities.map(e => e.type);
  const primaryAgent = getBestAgent(intent.primary.type, entityTypes);

  // Determine if we need supporting agents
  const { mode, supportingAgents } = determineExecutionMode(
    intent,
    entities,
    primaryAgent,
    config
  );

  // Build orchestration plan
  const plan = buildOrchestrationPlan(
    query,
    primaryAgent,
    supportingAgents,
    mode,
    intent,
    entities,
    config
  );

  // Create fallback path if enabled
  const fallbackPath = config.enableFallbacks
    ? createFallbackPath(primaryAgent, intent, config)
    : null;

  // Calculate confidence
  const confidence = calculateRoutingConfidence(intent, primaryAgent, entities);

  // Generate reasoning
  const reasoning = generateRoutingReasoning(
    primaryAgent,
    supportingAgents,
    mode,
    intent,
    confidence
  );

  return {
    id: decisionId,
    query,
    mode,
    primaryAgent,
    supportingAgents,
    plan,
    confidence,
    reasoning,
    fallbackPath,
    decidedAt: new Date(),
  };
}

/**
 * Determine execution mode based on intent complexity
 */
function determineExecutionMode(
  intent: IntentClassification,
  entities: ExtractedEntity[],
  primaryAgent: AgentType,
  config: RouterConfig
): { mode: RoutingMode; supportingAgents: AgentType[] } {
  // Simple cases: single agent
  if (intent.secondary.length === 0 && entities.length <= 2) {
    return { mode: 'single', supportingAgents: [] };
  }

  // Check if secondary intents need different agents
  const secondaryAgents: AgentType[] = [];
  for (const secondary of intent.secondary) {
    const agents = findAgentsForIntent(secondary.type);
    for (const agent of agents) {
      if (agent !== primaryAgent && !secondaryAgents.includes(agent)) {
        secondaryAgents.push(agent);
      }
    }
  }

  // Limit supporting agents
  const supportingAgents = secondaryAgents.slice(0, config.parallelismLimit - 1);

  // Validate combination
  if (!isValidAgentCombination([primaryAgent, ...supportingAgents])) {
    return { mode: 'single', supportingAgents: [] };
  }

  // Determine mode based on dependencies
  if (supportingAgents.length === 0) {
    return { mode: 'single', supportingAgents: [] };
  }

  // Check for dependencies between agents
  const hasDependencies = checkAgentDependencies(primaryAgent, supportingAgents);

  if (hasDependencies) {
    return { mode: 'sequential', supportingAgents };
  }

  if (supportingAgents.length >= 2) {
    return { mode: 'hybrid', supportingAgents };
  }

  return { mode: 'parallel', supportingAgents };
}

/**
 * Check if agents have execution dependencies
 */
function checkAgentDependencies(primary: AgentType, supporting: AgentType[]): boolean {
  // Outreach typically depends on ranking results
  if (primary === 'ranking' && supporting.includes('outreach')) {
    return true;
  }

  // Enrichment often feeds into ranking
  if (primary === 'enrichment' && supporting.includes('ranking')) {
    return true;
  }

  return false;
}

/**
 * Build orchestration plan for agent execution
 */
function buildOrchestrationPlan(
  query: string,
  primaryAgent: AgentType,
  supportingAgents: AgentType[],
  mode: RoutingMode,
  intent: IntentClassification,
  entities: ExtractedEntity[],
  config: RouterConfig
): OrchestrationPlan {
  const planId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const steps: ExecutionStep[] = [];
  let stepNumber = 1;

  // Create primary agent step
  const primaryStep = createExecutionStep(
    stepNumber++,
    primaryAgent,
    intent.primary.type,
    query,
    entities,
    [],
    config
  );
  steps.push(primaryStep);

  // Create supporting agent steps
  const supportingSteps: ExecutionStep[] = [];
  for (const agent of supportingAgents) {
    const relevantIntent = intent.secondary.find(s =>
      AGENT_CAPABILITIES[agent].primaryIntents.includes(s.type) ||
      AGENT_CAPABILITIES[agent].secondaryIntents.includes(s.type)
    );

    const step = createExecutionStep(
      stepNumber++,
      agent,
      relevantIntent?.type || 'support',
      query,
      entities,
      mode === 'sequential' ? [primaryStep.id] : [],
      config
    );
    supportingSteps.push(step);
  }
  steps.push(...supportingSteps);

  // Determine parallel groups
  const parallelGroups = determineParallelGroups(steps, mode);

  // Calculate critical path
  const criticalPath = calculateCriticalPath(steps);

  // Estimate duration
  const allAgents = [primaryAgent, ...supportingAgents];
  const estimatedDuration = mode === 'parallel' || mode === 'hybrid'
    ? estimateExecutionTime(allAgents, 'parallel')
    : estimateExecutionTime(allAgents, 'sequential');

  return {
    id: planId,
    steps,
    totalSteps: steps.length,
    estimatedDuration,
    parallelGroups,
    criticalPath,
    createdAt: new Date(),
  };
}

/**
 * Create an execution step
 */
function createExecutionStep(
  stepNumber: number,
  agent: AgentType,
  action: string,
  query: string,
  entities: ExtractedEntity[],
  dependencies: string[],
  config: RouterConfig
): ExecutionStep {
  const stepId = `step-${stepNumber}-${agent}`;
  const capability = AGENT_CAPABILITIES[agent];

  return {
    id: stepId,
    stepNumber,
    agent,
    action,
    inputs: {
      query,
      entities: entities.map(e => ({ type: e.type, value: e.value })),
    },
    expectedOutput: capability.outputTypes[0] || 'result',
    dependencies,
    timeout: config.defaultTimeout,
    retryCount: config.maxRetries,
    status: 'pending',
  };
}

/**
 * Determine which steps can run in parallel
 */
function determineParallelGroups(steps: ExecutionStep[], mode: RoutingMode): string[][] {
  if (mode === 'single') {
    return [steps.map(s => s.id)];
  }

  if (mode === 'sequential') {
    return steps.map(s => [s.id]);
  }

  // For parallel and hybrid modes, group by dependencies
  const groups: string[][] = [];
  const processed = new Set<string>();

  // First, steps with no dependencies
  const noDeps = steps.filter(s => s.dependencies.length === 0);
  if (noDeps.length > 0) {
    groups.push(noDeps.map(s => s.id));
    noDeps.forEach(s => processed.add(s.id));
  }

  // Then, remaining steps
  const remaining = steps.filter(s => !processed.has(s.id));
  if (remaining.length > 0) {
    groups.push(remaining.map(s => s.id));
  }

  return groups;
}

/**
 * Calculate critical path through steps
 */
function calculateCriticalPath(steps: ExecutionStep[]): string[] {
  // Simple implementation: steps with dependencies form the critical path
  const withDeps = steps.filter(s => s.dependencies.length > 0);

  if (withDeps.length === 0) {
    // All parallel, just return first step
    return steps.length > 0 ? [steps[0].id] : [];
  }

  // Build dependency chain
  const criticalPath: string[] = [];

  // Start with steps that have no dependencies
  const roots = steps.filter(s => s.dependencies.length === 0);
  if (roots.length > 0) {
    criticalPath.push(roots[0].id);
  }

  // Add dependent steps
  for (const step of withDeps) {
    criticalPath.push(step.id);
  }

  return criticalPath;
}

/**
 * Create fallback path for routing decision
 */
function createFallbackPath(
  primaryAgent: AgentType,
  intent: IntentClassification,
  config: RouterConfig
): FallbackPath | null {
  // Get compatible agents as fallback
  const compatible = getCompatibleAgents(primaryAgent);
  if (compatible.length === 0) {
    return null;
  }

  const fallbackAgent = compatible[0];
  const fallbackStep = createExecutionStep(
    1,
    fallbackAgent,
    intent.primary.type,
    '',
    [],
    [],
    config
  );

  return {
    id: `fb-${Date.now()}`,
    trigger: 'error',
    alternative: fallbackAgent,
    steps: [fallbackStep],
    priority: 1,
  };
}

/**
 * Calculate routing confidence
 */
function calculateRoutingConfidence(
  intent: IntentClassification,
  primaryAgent: AgentType,
  entities: ExtractedEntity[]
): number {
  let confidence = intent.primary.confidence;

  // Boost if primary intent matches agent's primary capabilities
  const capability = AGENT_CAPABILITIES[primaryAgent];
  if (capability.primaryIntents.includes(intent.primary.type)) {
    confidence = Math.min(1, confidence * 1.1);
  }

  // Boost for entity coverage
  const entityTypes = entities.map(e => e.type);
  const coverage = entityTypes.filter(et =>
    capability.entityTypes.includes(et)
  ).length / Math.max(entityTypes.length, 1);

  confidence = confidence * 0.7 + coverage * 0.3;

  // Factor in agent's historical success rate
  confidence = confidence * 0.8 + capability.successRate * 0.2;

  return Math.round(confidence * 100) / 100;
}

/**
 * Generate human-readable routing reasoning
 */
function generateRoutingReasoning(
  primaryAgent: AgentType,
  supportingAgents: AgentType[],
  mode: RoutingMode,
  intent: IntentClassification,
  confidence: number
): string {
  const parts: string[] = [];

  // Primary agent selection
  parts.push(
    `Routing to ${AGENT_CAPABILITIES[primaryAgent].name} for "${intent.primary.type}" intent.`
  );

  // Supporting agents
  if (supportingAgents.length > 0) {
    const supportNames = supportingAgents
      .map(a => AGENT_CAPABILITIES[a].name)
      .join(', ');
    parts.push(`Supporting agents: ${supportNames}.`);
  }

  // Execution mode
  const modeDescriptions: Record<RoutingMode, string> = {
    single: 'Single agent execution.',
    sequential: 'Sequential execution (each agent waits for previous).',
    parallel: 'Parallel execution (agents run simultaneously).',
    hybrid: 'Hybrid execution (mix of sequential and parallel).',
  };
  parts.push(modeDescriptions[mode]);

  // Confidence level
  const level = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'moderate' : 'low';
  parts.push(`Confidence: ${level} (${(confidence * 100).toFixed(0)}%)`);

  return parts.join(' ');
}

/**
 * Quick route for simple queries
 */
export function quickRoute(intentType: string): AgentType {
  // Direct mapping for common intents
  const directRoutes: Record<string, AgentType> = {
    discover_companies: 'discovery',
    find_prospects: 'discovery',
    rank_companies: 'ranking',
    score_account: 'ranking',
    generate_outreach: 'outreach',
    write_email: 'outreach',
    research_company: 'enrichment',
    enrich_data: 'enrichment',
    demo_feature: 'demo',
    help: 'demo',
  };

  return directRoutes[intentType] || 'discovery';
}
