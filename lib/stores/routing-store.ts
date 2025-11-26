/**
 * Routing Store - S45
 *
 * Zustand store for routing decisions and orchestration state.
 * DOES NOT modify siva-store.ts - standalone store.
 */

import { create } from 'zustand';
import type { AgentType } from '@/lib/stores/siva-store';
import type {
  RoutingDecision,
  OrchestrationPlan,
  ExecutionProgress,
  AgentHandoff,
} from '@/lib/intelligence/routing/types';
import type { IntentClassification, ExtractedEntity } from '@/lib/intelligence/intent/types';
import {
  makeRoutingDecision,
  quickRoute,
  executePlan,
  createInitialProgress,
  createSimulatedExecutor,
} from '@/lib/intelligence/routing';
import type { PlanExecutionResult, StepExecutor } from '@/lib/intelligence/routing/Orchestrator';

// =============================================================================
// Store Types
// =============================================================================

interface RoutingStore {
  // Current state
  currentDecision: RoutingDecision | null;
  currentPlan: OrchestrationPlan | null;
  executionProgress: ExecutionProgress;
  handoffs: AgentHandoff[];

  // Processing state
  isRouting: boolean;
  isExecuting: boolean;
  error: string | null;

  // History
  decisionHistory: RoutingDecision[];
  executionHistory: PlanExecutionResult[];

  // Actions
  routeQuery: (
    query: string,
    intent: IntentClassification,
    entities: ExtractedEntity[]
  ) => RoutingDecision;

  quickRouteIntent: (intentType: string) => AgentType;

  executeCurrentPlan: (executor?: StepExecutor) => Promise<PlanExecutionResult | null>;

  // History management
  addToHistory: (decision: RoutingDecision) => void;
  clearHistory: () => void;

  // Reset
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialProgress: ExecutionProgress = {
  totalSteps: 0,
  completedSteps: 0,
  currentStep: null,
  status: 'idle',
  startedAt: null,
  estimatedCompletion: null,
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useRoutingStore = create<RoutingStore>((set, get) => ({
  // Initial state
  currentDecision: null,
  currentPlan: null,
  executionProgress: initialProgress,
  handoffs: [],
  isRouting: false,
  isExecuting: false,
  error: null,
  decisionHistory: [],
  executionHistory: [],

  // Route a query to appropriate agents
  routeQuery: (query, intent, entities) => {
    set({ isRouting: true, error: null });

    try {
      const decision = makeRoutingDecision(query, intent, entities);

      set({
        currentDecision: decision,
        currentPlan: decision.plan,
        executionProgress: createInitialProgress(decision.plan),
        isRouting: false,
      });

      // Add to history
      get().addToHistory(decision);

      return decision;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Routing failed';
      set({ error: errorMessage, isRouting: false });
      throw err;
    }
  },

  // Quick route for simple intents
  quickRouteIntent: (intentType) => {
    return quickRoute(intentType);
  },

  // Execute the current plan
  executeCurrentPlan: async (executor) => {
    const { currentPlan } = get();

    if (!currentPlan) {
      set({ error: 'No plan to execute. Call routeQuery first.' });
      return null;
    }

    set({ isExecuting: true, error: null });

    try {
      // Use provided executor or create simulated one
      const stepExecutor = executor || createSimulatedExecutor(0.1);

      const result = await executePlan(
        currentPlan,
        stepExecutor,
        (progress) => set({ executionProgress: progress })
      );

      // Update handoffs
      set({
        handoffs: [...get().handoffs, ...result.handoffs],
        isExecuting: false,
        executionHistory: [...get().executionHistory, result],
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Execution failed';
      set({ error: errorMessage, isExecuting: false });
      return null;
    }
  },

  // Add decision to history
  addToHistory: (decision) => {
    set((state) => ({
      decisionHistory: [...state.decisionHistory.slice(-19), decision], // Keep last 20
    }));
  },

  // Clear history
  clearHistory: () => {
    set({
      decisionHistory: [],
      executionHistory: [],
    });
  },

  // Reset store
  reset: () => {
    set({
      currentDecision: null,
      currentPlan: null,
      executionProgress: initialProgress,
      handoffs: [],
      isRouting: false,
      isExecuting: false,
      error: null,
      decisionHistory: [],
      executionHistory: [],
    });
  },
}));

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select routing summary
 */
export const selectRoutingSummary = (state: RoutingStore) => {
  const { currentDecision } = state;
  if (!currentDecision) return null;

  return {
    primaryAgent: currentDecision.primaryAgent,
    mode: currentDecision.mode,
    confidence: currentDecision.confidence,
    supportingAgents: currentDecision.supportingAgents,
  };
};

/**
 * Select execution status
 */
export const selectExecutionStatus = (state: RoutingStore) => {
  const { executionProgress, isExecuting } = state;

  return {
    isExecuting,
    status: executionProgress.status,
    progress: executionProgress.totalSteps > 0
      ? Math.round((executionProgress.completedSteps / executionProgress.totalSteps) * 100)
      : 0,
    currentStep: executionProgress.currentStep,
  };
};

/**
 * Select handoff information
 */
export const selectHandoffs = (state: RoutingStore) => {
  return state.handoffs.map(h => ({
    from: h.fromAgent,
    to: h.toAgent,
    reason: h.reason,
    timestamp: h.handoffAt,
  }));
};
