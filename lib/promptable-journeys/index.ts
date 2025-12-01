/**
 * Promptable Journeys
 * Sprint S49: AI-Enabled Journey Runtime
 *
 * AI-powered journey execution built on S48 Journey Engine:
 * - AI Step Orchestrator (LLM-executed steps)
 * - Auto-Context Provider (context injection into prompts)
 * - AI Decision Nodes (LLM-based branching)
 * - Autonomous Step Execution (S67-S70 integration)
 *
 * All AI steps route through OS autonomousSafety (S66)
 * Metrics flow to OS autonomousMetrics (S70)
 */

// Types
export * from './types';

// AI Step Orchestrator
export {
  AIStepOrchestrator,
  createAIStepOrchestrator,
  AIStepError,
} from './ai-orchestrator';

// Auto-Context Provider
export {
  resolveContextSource,
  buildContext,
  createDefaultContextSources,
  injectContextIntoPrompt,
  buildPrompt,
  estimateTokens,
  truncateContext,
  getCachedContext,
  setCachedContext,
  clearExpiredCache,
  clearContextCache,
  type OSClientInterface,
} from './context-provider';

// AI Decision Nodes
export {
  AIDecisionExecutor,
  createAIDecisionExecutor,
  type AIDecisionExecutorOptions,
  type AIDecisionResult,
} from './decision-nodes';

// Autonomous Step Execution
export {
  AutonomousStepExecutor,
  createAutonomousExecutor,
  AutonomousStepError,
  type AutonomousExecutorOptions,
  type AutonomousExecutionResult,
  type AutonomousMetrics,
  type SafetyEvent,
} from './autonomous-executor';

// =============================================================================
// UNIFIED PROMPTABLE JOURNEY ENGINE
// =============================================================================

import type {
  ExecutionContext,
  ExecutionData,
  StepResult,
} from '../journey-engine/types';
import type { StepNode, Transition } from '../journey-builder/types';
import type {
  AIStepConfig,
  AIDecisionConfig,
  AutonomousStepConfig,
  AIExecutionResult,
  PromptTemplateStore,
  CheckpointStore,
  JourneyEventHandler,
} from './types';
import { AIStepOrchestrator } from './ai-orchestrator';
import { AIDecisionExecutor, type AIDecisionResult } from './decision-nodes';
import { AutonomousStepExecutor, type AutonomousExecutionResult } from './autonomous-executor';

/**
 * Unified engine for all promptable journey capabilities
 */
export class PromptableJourneyEngine {
  private aiOrchestrator: AIStepOrchestrator;
  private decisionExecutor: AIDecisionExecutor;
  private autonomousExecutor: AutonomousStepExecutor;

  constructor(options: PromptableJourneyEngineOptions = {}) {
    this.aiOrchestrator = new AIStepOrchestrator({
      osBaseUrl: options.osBaseUrl,
      osApiKey: options.osApiKey,
      templateStore: options.templateStore,
      checkpointStore: options.checkpointStore,
      checkpointTimeoutMs: options.checkpointTimeoutMs,
      onMetrics: options.onMetrics,
      onCheckpointRequired: options.onCheckpointRequired,
      eventHandlers: options.eventHandlers,
      logLevel: options.logLevel,
    });

    this.decisionExecutor = new AIDecisionExecutor({
      templateStore: options.templateStore,
      onMetrics: options.onMetrics,
      logLevel: options.logLevel,
    });

    this.autonomousExecutor = new AutonomousStepExecutor({
      checkpointStore: options.checkpointStore,
      checkpointTimeoutMs: options.checkpointTimeoutMs,
      onMetrics: options.onAutonomousMetrics,
      onSafetyEvent: options.onSafetyEvent,
      logLevel: options.logLevel,
    });
  }

  /**
   * Execute an AI-powered step
   */
  async executeAIStep(
    step: StepNode,
    context: ExecutionContext,
    data: ExecutionData,
    config: AIStepConfig
  ): Promise<AIExecutionResult> {
    return this.aiOrchestrator.executeAIStep(step, context, data, config);
  }

  /**
   * Execute an AI decision node
   */
  async executeDecision(
    step: StepNode,
    context: ExecutionContext,
    data: ExecutionData,
    config: AIDecisionConfig,
    availableTransitions: Transition[]
  ): Promise<AIDecisionResult> {
    return this.decisionExecutor.executeDecision(
      step,
      context,
      data,
      config,
      availableTransitions
    );
  }

  /**
   * Execute an autonomous step
   */
  async executeAutonomousStep(
    step: StepNode,
    context: ExecutionContext,
    data: ExecutionData,
    config: AutonomousStepConfig
  ): Promise<AutonomousExecutionResult> {
    return this.autonomousExecutor.executeAutonomousStep(step, context, data, config);
  }

  /**
   * Register a prompt template
   */
  async registerTemplate(
    template: Parameters<AIStepOrchestrator['registerTemplate']>[0]
  ) {
    return this.aiOrchestrator.registerTemplate(template);
  }

  /**
   * List available templates
   */
  async listTemplates(filters?: { category?: string; tags?: string[] }) {
    return this.aiOrchestrator.listTemplates(filters);
  }

  /**
   * Determine the step handler type based on step configuration
   */
  getStepHandlerType(step: StepNode): 'ai' | 'decision' | 'autonomous' | 'standard' {
    const config = step.config as Record<string, unknown>;

    // Check for AI step configuration
    if (config.templateId && config.contextSources) {
      return 'ai';
    }

    // Check for AI decision configuration
    if (config.templateId && config.outcomes) {
      return 'decision';
    }

    // Check for autonomous configuration
    if (config.capability && ['auto_discovery', 'auto_outreach', 'self_tuning', 'performance'].includes(config.capability as string)) {
      return 'autonomous';
    }

    // Standard journey engine step
    return 'standard';
  }
}

/**
 * Options for the unified engine
 */
export interface PromptableJourneyEngineOptions {
  osBaseUrl?: string;
  osApiKey?: string;
  templateStore?: PromptTemplateStore;
  checkpointStore?: CheckpointStore;
  checkpointTimeoutMs?: number;
  onMetrics?: (metrics: AIExecutionResult['metrics'], stepId: string) => void | Promise<void>;
  onAutonomousMetrics?: (metrics: import('./autonomous-executor').AutonomousMetrics, stepId: string) => void | Promise<void>;
  onCheckpointRequired?: (checkpoint: import('./types').Checkpoint) => void | Promise<void>;
  onSafetyEvent?: (event: import('./autonomous-executor').SafetyEvent) => void | Promise<void>;
  eventHandlers?: JourneyEventHandler[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Factory function to create the engine
 */
export function createPromptableJourneyEngine(
  options?: PromptableJourneyEngineOptions
): PromptableJourneyEngine {
  return new PromptableJourneyEngine(options);
}
