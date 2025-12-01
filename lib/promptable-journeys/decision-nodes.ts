/**
 * AI Decision Nodes
 * Sprint S49: AI-Enabled Journey Runtime
 *
 * LLM-based branching with deterministic outcomes:
 * - Maps AI responses to specific transitions
 * - Enforces outcome constraints
 * - Logs reasoning for audit trail
 * - Supports confidence thresholds
 */
import type {
  ExecutionContext,
  ExecutionData,
  StepResult,
  TransitionEvaluation,
} from '../journey-engine/types';
import type { StepNode, Transition } from '../journey-builder/types';
import type {
  AIDecisionConfig,
  AIExecutionResult,
  PromptTemplate,
  AIStepOrchestratorOptions,
} from './types';
import {
  buildContext,
  buildPrompt,
  createDefaultContextSources,
  type OSClientInterface,
} from './context-provider';
import { AIStepError } from './ai-orchestrator';

// =============================================================================
// DECISION NODE EXECUTOR
// =============================================================================

export class AIDecisionExecutor {
  private osClient: OSClientInterface;
  private templateStore: AIDecisionExecutorOptions['templateStore'];
  private onMetrics?: AIDecisionExecutorOptions['onMetrics'];
  private logLevel: 'debug' | 'info' | 'warn' | 'error';

  constructor(options: AIDecisionExecutorOptions = {}) {
    this.osClient = options.osClient || createDefaultOSClient();
    this.templateStore = options.templateStore || new InMemoryDecisionTemplateStore();
    this.onMetrics = options.onMetrics;
    this.logLevel = options.logLevel || 'info';
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
    const startTime = Date.now();

    this.log('debug', `Executing AI decision: ${step.id}`);

    // 1. Get the decision template
    const template = await this.getTemplate(config.templateId, config.templateVersion);
    if (!template) {
      throw new AIStepError(
        'TEMPLATE_NOT_FOUND',
        `Decision template not found: ${config.templateId}`,
        { templateId: config.templateId }
      );
    }

    // 2. Build context
    const contextSources = createDefaultContextSources({
      includeJourneyInput: true,
      includeStepOutputs: config.contextSources.includes('step_outputs'),
      includeEntity: config.contextSources.includes('entity_data'),
      includeVariables: config.contextSources.includes('variables'),
    });

    const resolvedContext = await buildContext(
      { sources: contextSources, mergeStrategy: 'deep', maxContextTokens: 4000, truncateStrategy: 'end' },
      context,
      data,
      this.osClient
    );

    // 3. Add decision-specific context
    const decisionContext = {
      ...resolvedContext,
      availableOutcomes: config.outcomes.map((o) => ({
        id: o.id,
        label: o.label,
        description: o.description,
      })),
    };

    // 4. Build the prompt with decision instructions
    const systemPromptWithDecision = this.buildDecisionSystemPrompt(
      template.systemPrompt,
      config
    );

    const prompt = buildPrompt(systemPromptWithDecision, template.userPrompt, decisionContext);

    // 5. Call LLM with structured output
    const llmResult = await this.callDecisionLLM(prompt, template, config);

    // 6. Parse and validate the decision
    const decision = this.parseDecision(llmResult, config);

    // 7. Map decision to transition
    const selectedTransition = this.mapDecisionToTransition(
      decision,
      config,
      availableTransitions
    );

    // 8. Build results
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const stepResult: StepResult = {
      stepId: step.id,
      status: 'completed',
      output: {
        decision: decision.selectedOutcome,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        selectedTransitionId: selectedTransition.id,
      },
      startedAt: new Date(startTime),
      completedAt: new Date(endTime),
      durationMs,
      logs: [
        {
          level: 'info',
          message: `AI decision completed: ${decision.selectedOutcome} (confidence: ${decision.confidence.toFixed(2)})`,
          timestamp: new Date(),
        },
      ],
    };

    // Add reasoning log if enabled
    if (config.logReasoning && decision.reasoning) {
      stepResult.logs.push({
        level: 'debug',
        message: `AI reasoning: ${decision.reasoning}`,
        timestamp: new Date(),
      });
    }

    const aiResult: AIExecutionResult = {
      stepResult,
      promptUsed: {
        system: prompt.system,
        user: prompt.user,
        variables: decisionContext,
      },
      modelResponse: {
        content: llmResult.raw,
        parsed: llmResult.parsed,
        tokensUsed: llmResult.tokensUsed,
        modelId: llmResult.modelId,
        durationMs: llmResult.durationMs,
      },
      decision,
      metrics: {
        costUsd: llmResult.costUsd,
        inputTokens: llmResult.inputTokens,
        outputTokens: llmResult.outputTokens,
        latencyMs: llmResult.durationMs,
      },
    };

    // 9. Report metrics
    if (this.onMetrics) {
      await this.onMetrics(aiResult.metrics, step.id);
    }

    // 10. Build transition evaluation
    const transitionEval: TransitionEvaluation = {
      transitionId: selectedTransition.id,
      fromStepId: step.id,
      toStepId: selectedTransition.toStepId,
      condition: { aiDecision: decision.selectedOutcome },
      result: true,
      reason: decision.reasoning,
      evaluatedAt: new Date(),
    };

    this.log('info', `AI decision ${step.id}: ${decision.selectedOutcome} → ${selectedTransition.toStepId}`);

    return {
      aiResult,
      selectedTransition,
      transitionEvaluation: transitionEval,
    };
  }

  /**
   * Build system prompt with decision instructions
   */
  private buildDecisionSystemPrompt(
    basePrompt: string,
    config: AIDecisionConfig
  ): string {
    const outcomeList = config.outcomes
      .map((o) => `- "${o.id}": ${o.label}${o.description ? ` (${o.description})` : ''}`)
      .join('\n');

    const decisionInstructions = `

## Decision Instructions

You must analyze the provided context and select ONE of the following outcomes:

${outcomeList}

${config.enforceOutcome ? 'You MUST select one of the listed outcomes. Do not create new outcomes.' : ''}

Respond with a JSON object containing:
- "outcome": the ID of your selected outcome (string)
- "confidence": your confidence level from 0.0 to 1.0 (number)
- "reasoning": brief explanation of your decision (string)

Example response:
{
  "outcome": "outcome_id",
  "confidence": 0.85,
  "reasoning": "Based on the data, this outcome is most appropriate because..."
}
`;

    return basePrompt + decisionInstructions;
  }

  /**
   * Call LLM for decision
   */
  private async callDecisionLLM(
    prompt: { system: string; user: string },
    template: PromptTemplate,
    config: AIDecisionConfig
  ): Promise<DecisionLLMResult> {
    const startTime = Date.now();

    const response = await this.osClient.call('/llm/chat', {
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      model_preference: template.modelPreference,
      temperature: 0.3, // Lower temperature for more deterministic decisions
      max_tokens: template.maxTokens,
      output_schema: {
        type: 'object',
        properties: {
          outcome: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          reasoning: { type: 'string' },
        },
        required: ['outcome', 'confidence'],
      },
    });

    if (!response.success) {
      throw new AIStepError(
        'LLM_CALL_FAILED',
        `Decision LLM call failed: ${response.error}`,
        { error: response.error }
      );
    }

    const data = response.data as LLMResponseData;
    const durationMs = Date.now() - startTime;

    // Parse the response
    let parsed: DecisionOutput | null = null;
    try {
      parsed = JSON.parse(data.content) as DecisionOutput;
    } catch {
      this.log('warn', 'Failed to parse decision output as JSON');
    }

    return {
      raw: data.content,
      parsed,
      tokensUsed: data.usage?.total_tokens || 0,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      modelId: data.model || 'unknown',
      durationMs,
      costUsd: this.estimateCost(
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0
      ),
    };
  }

  /**
   * Parse and validate decision from LLM response
   */
  private parseDecision(
    llmResult: DecisionLLMResult,
    config: AIDecisionConfig
  ): AIExecutionResult['decision'] & { selectedOutcome: string; confidence: number } {
    const parsed = llmResult.parsed;

    if (!parsed) {
      // Try to extract from raw text
      const extractedOutcome = this.extractOutcomeFromText(llmResult.raw, config);
      if (extractedOutcome) {
        return extractedOutcome;
      }

      // Use default outcome if available
      if (config.defaultOutcome) {
        this.log('warn', `Using default outcome: ${config.defaultOutcome}`);
        return {
          selectedOutcome: config.defaultOutcome,
          confidence: 0.5,
          reasoning: 'Default outcome used due to parsing failure',
        };
      }

      throw new AIStepError(
        'DECISION_PARSE_FAILED',
        'Failed to parse AI decision output',
        { raw: llmResult.raw }
      );
    }

    // Validate outcome
    const validOutcomeIds = config.outcomes.map((o) => o.id);

    if (config.enforceOutcome && !validOutcomeIds.includes(parsed.outcome)) {
      if (config.defaultOutcome) {
        this.log('warn', `Invalid outcome "${parsed.outcome}", using default: ${config.defaultOutcome}`);
        return {
          selectedOutcome: config.defaultOutcome,
          confidence: parsed.confidence,
          reasoning: `Original decision "${parsed.outcome}" was invalid. ${parsed.reasoning || ''}`,
        };
      }

      throw new AIStepError(
        'INVALID_OUTCOME',
        `AI selected invalid outcome: ${parsed.outcome}`,
        { selectedOutcome: parsed.outcome, validOutcomes: validOutcomeIds }
      );
    }

    // Check confidence threshold
    if (parsed.confidence < config.confidenceThreshold) {
      this.log('warn', `Low confidence decision: ${parsed.confidence} < ${config.confidenceThreshold}`);
      // Still proceed but log the warning
    }

    return {
      selectedOutcome: parsed.outcome,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  }

  /**
   * Try to extract outcome from raw text
   */
  private extractOutcomeFromText(
    text: string,
    config: AIDecisionConfig
  ): { selectedOutcome: string; confidence: number; reasoning?: string } | null {
    // Look for outcome IDs in the text
    for (const outcome of config.outcomes) {
      if (text.toLowerCase().includes(outcome.id.toLowerCase())) {
        return {
          selectedOutcome: outcome.id,
          confidence: 0.6, // Lower confidence for extracted outcomes
          reasoning: 'Extracted from unstructured response',
        };
      }
    }

    return null;
  }

  /**
   * Map the decision to a transition
   */
  private mapDecisionToTransition(
    decision: { selectedOutcome: string },
    config: AIDecisionConfig,
    availableTransitions: Transition[]
  ): Transition {
    // Find the outcome configuration
    const outcomeConfig = config.outcomes.find((o) => o.id === decision.selectedOutcome);

    if (!outcomeConfig) {
      throw new AIStepError(
        'OUTCOME_NOT_FOUND',
        `Outcome configuration not found: ${decision.selectedOutcome}`,
        { selectedOutcome: decision.selectedOutcome }
      );
    }

    // Find the matching transition
    const transition = availableTransitions.find((t) => t.id === outcomeConfig.transitionId);

    if (!transition) {
      throw new AIStepError(
        'TRANSITION_NOT_FOUND',
        `Transition not found for outcome: ${decision.selectedOutcome}`,
        { transitionId: outcomeConfig.transitionId }
      );
    }

    return transition;
  }

  /**
   * Get template from store
   */
  private async getTemplate(
    templateId: string,
    version?: number
  ): Promise<PromptTemplate | null> {
    if (this.templateStore) {
      return this.templateStore.getTemplate(templateId, version);
    }
    return null;
  }

  /**
   * Estimate cost
   */
  private estimateCost(inputTokens: number, outputTokens: number): number {
    // Default to balanced model pricing
    return (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;
  }

  /**
   * Log helper
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.logLevel)) {
      const prefix = '[AI Decision]';
      console[level](prefix, message);
    }
  }
}

// =============================================================================
// DEFAULT OS CLIENT
// =============================================================================

function createDefaultOSClient(): OSClientInterface {
  const url = process.env.UPR_OS_BASE_URL || 'http://localhost:8080';
  const key = process.env.UPR_OS_API_KEY || '';

  return {
    async call(endpoint: string, params: Record<string, unknown>) {
      try {
        const response = await fetch(`${url}/api/os${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': key,
            'X-Client': 'promptable-journeys-decision',
          },
          body: JSON.stringify(params),
        });

        const data = await response.json();
        return {
          success: response.ok,
          data: data.data || data,
          error: data.error,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  };
}

// =============================================================================
// IN-MEMORY TEMPLATE STORE
// =============================================================================

class InMemoryDecisionTemplateStore {
  private templates = new Map<string, Map<number, PromptTemplate>>();

  async getTemplate(id: string, version?: number): Promise<PromptTemplate | null> {
    const versions = this.templates.get(id);
    if (!versions) return null;

    if (version !== undefined) {
      return versions.get(version) || null;
    }

    // Get latest version
    const latestVersion = Math.max(...versions.keys());
    return versions.get(latestVersion) || null;
  }

  async saveTemplate(template: PromptTemplate): Promise<void> {
    if (!this.templates.has(template.id)) {
      this.templates.set(template.id, new Map());
    }
    this.templates.get(template.id)!.set(template.version, template);
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface AIDecisionExecutorOptions {
  osClient?: OSClientInterface;
  templateStore?: {
    getTemplate(id: string, version?: number): Promise<PromptTemplate | null>;
    saveTemplate(template: PromptTemplate): Promise<void>;
  };
  onMetrics?: (metrics: AIExecutionResult['metrics'], stepId: string) => void | Promise<void>;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface AIDecisionResult {
  aiResult: AIExecutionResult;
  selectedTransition: Transition;
  transitionEvaluation: TransitionEvaluation;
}

interface DecisionOutput {
  outcome: string;
  confidence: number;
  reasoning?: string;
}

interface DecisionLLMResult {
  raw: string;
  parsed: DecisionOutput | null;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
  durationMs: number;
  costUsd: number;
}

interface LLMResponseData {
  content: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createAIDecisionExecutor(
  options?: AIDecisionExecutorOptions
): AIDecisionExecutor {
  return new AIDecisionExecutor(options);
}
