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

import { useCallback, useMemo } from 'react';
import { useSIVAStore } from '@/lib/stores/siva-store';
import { useIntentStore } from '@/lib/stores/intent-store';
import { useRoutingStore, selectRoutingSummary, selectExecutionStatus } from '@/lib/stores/routing-store';
import type { RoutingWrapperResult } from '../types';
import type {
  RoutingDecision,
  OrchestrationPlan,
  RoutingMode,
} from '../routing/types';

/**
 * Routing Wrapper Hook
 *
 * Usage:
 *   const { routeToAgent, currentPlan, mode, setMode } = useRoutingWrapper();
 *   const decision = await routeToAgent(intent);
 */
export function useRoutingWrapper(): RoutingWrapperResult {
  const { setActiveAgent } = useSIVAStore();
  const { currentIntent, currentEntities } = useIntentStore();
  const {
    currentDecision,
    currentPlan,
    executionProgress,
    isRouting,
    isExecuting,
    error,
    routeQuery,
    quickRouteIntent,
    executeCurrentPlan,
  } = useRoutingStore();

  /**
   * Route based on current intent from intent store
   */
  const routeCurrentIntent = useCallback(
    (query: string): RoutingDecision | null => {
      if (!currentIntent) {
        console.warn('No current intent. Call useIntentWrapper.processQuery first.');
        return null;
      }

      // Route the query - currentIntent is already IntentClassification
      const decision = routeQuery(query, currentIntent, currentEntities?.entities || []);

      // Set the primary agent as active (WRAPS existing setActiveAgent)
      if (decision.primaryAgent) {
        setActiveAgent(decision.primaryAgent);
      }

      return decision;
    },
    [currentIntent, currentEntities, routeQuery, setActiveAgent]
  );

  /**
   * Route to agent based on intent type directly
   */
  const routeToAgent = useCallback(
    async (intent: {
      type: string;
      confidence: number;
      agents: string[];
      normalized: { original: string };
    }): Promise<RoutingDecision> => {
      // Build a complete intent classification
      // Filter agents to only include valid AgentType values
      const validAgents = intent.agents.filter(
        (a): a is import('@/lib/stores/siva-store').AgentType =>
          ['discovery', 'ranking', 'outreach', 'enrichment', 'demo'].includes(a)
      );

      const primaryIntent = {
        type: intent.type as import('../intent/types').IntentType,
        category: 'discovery' as import('../intent/types').IntentCategory,
        confidence: intent.confidence,
        agents: validAgents,
        matchedKeywords: [],
        matchedPatterns: [],
      };

      const intentClassification: import('../intent/types').IntentClassification = {
        primary: primaryIntent,
        secondary: [],
        isCompound: false,
        allIntents: [primaryIntent],
        rawQuery: intent.normalized.original,
        processedQuery: intent.normalized.original,
      };

      // Route the query
      const decision = routeQuery(
        intent.normalized.original,
        intentClassification,
        currentEntities?.entities || []
      );

      // Set the primary agent as active (WRAPS existing setActiveAgent)
      if (decision.primaryAgent) {
        setActiveAgent(decision.primaryAgent);
      }

      return decision;
    },
    [currentEntities, routeQuery, setActiveAgent]
  );

  /**
   * Execute the current plan
   */
  const executePlan = useCallback(async () => {
    return executeCurrentPlan();
  }, [executeCurrentPlan]);

  /**
   * Quick route for simple intent types
   */
  const quickRoute = useCallback(
    (intentType: string) => {
      const agent = quickRouteIntent(intentType);
      setActiveAgent(agent);
      return agent;
    },
    [quickRouteIntent, setActiveAgent]
  );

  /**
   * Get current routing mode
   */
  const mode: RoutingMode = currentDecision?.mode || 'single';

  /**
   * Set routing mode (updates decision if exists)
   */
  const setMode = useCallback((newMode: RoutingMode) => {
    // Mode changes would require re-routing
    // For now, just log - actual mode is determined by routing decision
    console.log('Mode change requested:', newMode);
  }, []);

  /**
   * Routing summary for display
   */
  const routingSummary = useMemo(() => {
    if (!currentDecision) return null;

    return {
      primaryAgent: currentDecision.primaryAgent,
      supportingAgents: currentDecision.supportingAgents,
      mode: currentDecision.mode,
      confidence: currentDecision.confidence,
      reasoning: currentDecision.reasoning,
    };
  }, [currentDecision]);

  /**
   * Execution status for display
   */
  const executionStatus = useMemo(() => {
    return {
      isExecuting,
      status: executionProgress.status,
      progress: executionProgress.totalSteps > 0
        ? Math.round((executionProgress.completedSteps / executionProgress.totalSteps) * 100)
        : 0,
      currentStep: executionProgress.currentStep,
    };
  }, [isExecuting, executionProgress]);

  return {
    // Core routing
    routeToAgent,
    routeCurrentIntent,
    quickRoute,

    // Plan management
    currentPlan,
    executePlan,

    // Mode
    mode,
    setMode,

    // Status
    routingSummary,
    executionStatus,
    isRouting,
    error,
  };
}
