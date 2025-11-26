/**
 * Routing Wrapper Hook - S45
 *
 * Wraps agent selection with intelligent tool routing.
 *
 * Pattern:
 *   1. Intent comes from useIntentWrapper
 *   2. ToolRouter decides which agents to use
 *   3. MultiAgentOrchestrator plans execution order
 *   4. ExecutionQueue manages parallel/sequential execution
 *   5. FallbackHandler manages failures
 *   6. THEN calls existing agent handlers (unchanged)
 *
 * CRITICAL: This hook WRAPS agent selection, it does NOT replace it.
 */

'use client';

import { useCallback, useState } from 'react';
import { useSIVAStore, AgentType } from '@/lib/stores/siva-store';
import type {
  Intent,
  RoutingDecision,
  OrchestrationPlan,
  RoutingMode,
  ExecutionStep,
  FallbackPath,
  RoutingWrapperResult,
} from '../types';

// Placeholder - will be implemented in S45
const createRoutingDecision = async (intent: Intent): Promise<RoutingDecision> => {
  // TODO: S45 - Implement ToolRouter
  return {
    id: `route-${Date.now()}`,
    query: intent.normalized.original,
    intent,
    selectedAgents: intent.agents,
    executionOrder: intent.agents,
    mode: 'step-by-step',
    reasoning: 'Default routing based on intent agents',
    confidence: intent.confidence,
    timestamp: new Date(),
  };
};

// Placeholder - will be implemented in S45
const createOrchestrationPlan = (decision: RoutingDecision): OrchestrationPlan => {
  // TODO: S45 - Implement MultiAgentOrchestrator
  const steps: ExecutionStep[] = decision.executionOrder.map((agent, index) => ({
    id: `step-${index}`,
    agent,
    status: 'pending',
    inputs: {},
  }));

  const fallbackPaths: FallbackPath[] = [
    {
      trigger: 'error',
      fromAgent: decision.executionOrder[0],
      toAgent: 'abort',
      message: 'Agent execution failed',
    },
  ];

  return {
    id: `plan-${Date.now()}`,
    decision,
    steps,
    fallbackPaths,
    estimatedDuration: steps.length * 2000, // 2s per step estimate
  };
};

/**
 * Routing Wrapper Hook
 *
 * Usage:
 *   const { routeToAgent, currentPlan, mode, setMode } = useRoutingWrapper();
 *   const decision = await routeToAgent(intent);
 */
export function useRoutingWrapper(): RoutingWrapperResult {
  const { setActiveAgent } = useSIVAStore();

  const [currentPlan, setCurrentPlan] = useState<OrchestrationPlan | null>(null);
  const [mode, setMode] = useState<RoutingMode>('step-by-step');

  const routeToAgent = useCallback(
    async (intent: Intent): Promise<RoutingDecision> => {
      // Step 1: Create routing decision
      const decision = await createRoutingDecision(intent);

      // Step 2: Create orchestration plan
      const plan = createOrchestrationPlan(decision);
      setCurrentPlan(plan);

      // Step 3: Set the first agent as active (WRAPS existing setActiveAgent)
      if (decision.executionOrder.length > 0) {
        setActiveAgent(decision.executionOrder[0]);
      }

      return decision;
    },
    [setActiveAgent]
  );

  return {
    routeToAgent,
    currentPlan,
    mode,
    setMode,
  };
}
