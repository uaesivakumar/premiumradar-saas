/**
 * Routing Types - S45
 *
 * Type definitions for tool routing and multi-agent orchestration.
 */

import type { AgentType } from '@/lib/stores/siva-store';
import type { IntentClassification, ExtractedEntity } from '../intent/types';

// =============================================================================
// Routing Mode Types
// =============================================================================

/**
 * Routing execution modes
 */
export type RoutingMode =
  | 'single'      // Single agent execution
  | 'sequential'  // Multiple agents in sequence
  | 'parallel'    // Multiple agents in parallel
  | 'hybrid';     // Mix of sequential and parallel

/**
 * Agent capability definitions
 */
export interface AgentCapability {
  agent: AgentType;
  name: string;
  description: string;
  primaryIntents: string[];
  secondaryIntents: string[];
  entityTypes: string[];
  outputTypes: string[];
  maxConcurrency: number;
  averageLatency: number; // ms
  successRate: number; // 0-1
}

// =============================================================================
// Routing Decision Types
// =============================================================================

/**
 * Routing decision for a query
 */
export interface RoutingDecision {
  id: string;
  query: string;
  mode: RoutingMode;
  primaryAgent: AgentType;
  supportingAgents: AgentType[];
  plan: OrchestrationPlan;
  confidence: number;
  reasoning: string;
  fallbackPath: FallbackPath | null;
  decidedAt: Date;
}

/**
 * Execution step in orchestration
 */
export interface ExecutionStep {
  id: string;
  stepNumber: number;
  agent: AgentType;
  action: string;
  inputs: Record<string, unknown>;
  expectedOutput: string;
  dependencies: string[]; // step IDs this depends on
  timeout: number; // ms
  retryCount: number;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Full orchestration plan
 */
export interface OrchestrationPlan {
  id: string;
  steps: ExecutionStep[];
  totalSteps: number;
  estimatedDuration: number; // ms
  parallelGroups: string[][]; // groups of step IDs that can run in parallel
  criticalPath: string[]; // step IDs on critical path
  createdAt: Date;
}

/**
 * Fallback path when primary route fails
 */
export interface FallbackPath {
  id: string;
  trigger: 'timeout' | 'error' | 'low_confidence' | 'user_request';
  alternative: AgentType;
  steps: ExecutionStep[];
  priority: number;
}

/**
 * Agent handoff between agents
 */
export interface AgentHandoff {
  id: string;
  fromAgent: AgentType;
  toAgent: AgentType;
  reason: string;
  context: Record<string, unknown>;
  partialResults?: unknown;
  handoffAt: Date;
}

// =============================================================================
// Router State Types
// =============================================================================

/**
 * Current routing state
 */
export interface RoutingState {
  currentDecision: RoutingDecision | null;
  currentPlan: OrchestrationPlan | null;
  executionProgress: ExecutionProgress;
  handoffs: AgentHandoff[];
  isRouting: boolean;
  isExecuting: boolean;
  error: string | null;
}

/**
 * Execution progress tracking
 */
export interface ExecutionProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: string | null;
  status: 'idle' | 'planning' | 'executing' | 'complete' | 'failed';
  startedAt: Date | null;
  estimatedCompletion: Date | null;
}

// =============================================================================
// Router Configuration
// =============================================================================

/**
 * Router configuration options
 */
export interface RouterConfig {
  defaultTimeout: number;
  maxRetries: number;
  parallelismLimit: number;
  confidenceThreshold: number;
  enableFallbacks: boolean;
  enableHandoffs: boolean;
}

/**
 * Default router configuration
 */
export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  defaultTimeout: 30000, // 30 seconds
  maxRetries: 2,
  parallelismLimit: 3,
  confidenceThreshold: 0.6,
  enableFallbacks: true,
  enableHandoffs: true,
};
