/**
 * Tool Routing & Multi-Agent Orchestration - S45
 *
 * Intelligent routing of queries to appropriate agents.
 * Multi-agent orchestration with parallel/sequential execution.
 */

// Types
export type {
  RoutingMode,
  RoutingDecision,
  ExecutionStep,
  OrchestrationPlan,
  FallbackPath,
  AgentHandoff,
  AgentCapability,
  RoutingState,
  ExecutionProgress,
  RouterConfig,
} from './types';

export { DEFAULT_ROUTER_CONFIG } from './types';

// Agent Registry
export {
  AGENT_CAPABILITIES,
  getAgentCapability,
  findAgentsForIntent,
  findAgentsForEntityTypes,
  getBestAgent,
  getCompatibleAgents,
  estimateExecutionTime,
  isValidAgentCombination,
} from './AgentRegistry';

// Tool Router
export {
  makeRoutingDecision,
  quickRoute,
} from './ToolRouter';

// Orchestrator
export {
  executePlan,
  createInitialProgress,
  calculateProgressPercentage,
  getProgressMessage,
  createSimulatedExecutor,
} from './Orchestrator';

export type {
  StepResult,
  PlanExecutionResult,
  StepExecutor,
} from './Orchestrator';
