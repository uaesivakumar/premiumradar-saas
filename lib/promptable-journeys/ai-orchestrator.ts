/**
 * AI Step Orchestrator
 * Sprint S49: AI-Enabled Journey Runtime
 *
 * Orchestrates LLM-executed steps in journeys:
 * - Manages prompt templates (versioned, deterministic)
 * - Routes through OS LLM endpoint
 * - Handles checkpoints for safety
 * - Tracks metrics for S70
 */
import type {
  ExecutionContext,
  ExecutionData,
  StepResult,
} from '../journey-engine/types';
import type { StepNode } from '../journey-builder/types';
import type {
  AIStepConfig,
  AIExecutionResult,
  PromptTemplate,
  Checkpoint,
  AIStepOrchestratorOptions,
  PromptTemplateStore,
  CheckpointStore,
} from './types';
import {
  buildContext,
  buildPrompt,
  createDefaultContextSources,
  truncateContext,
  estimateTokens,
  type OSClientInterface,
} from './context-provider';

// =============================================================================
// AI STEP ORCHESTRATOR
// =============================================================================

export class AIStepOrchestrator {
  private templateStore: PromptTemplateStore;
  private checkpointStore: CheckpointStore | null;
  private osClient: OSClientInterface;
  private options: Required<Pick<AIStepOrchestratorOptions, 'checkpointTimeoutMs' | 'logLevel'>>;
  private onMetrics?: AIStepOrchestratorOptions['onMetrics'];
  private onCheckpointRequired?: AIStepOrchestratorOptions['onCheckpointRequired'];

  constructor(options: AIStepOrchestratorOptions = {}) {
    this.templateStore = options.templateStore || new InMemoryTemplateStore();
    this.checkpointStore = options.checkpointStore || null;
    this.osClient = createOSClient(options.osBaseUrl, options.osApiKey);
    this.options = {
      checkpointTimeoutMs: options.checkpointTimeoutMs || 3600000, // 1 hour default
      logLevel: options.logLevel || 'info',
    };
    this.onMetrics = options.onMetrics;
    this.onCheckpointRequired = options.onCheckpointRequired;
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
    const startTime = Date.now();

    this.log('debug', `Executing AI step: ${step.id}`);

    // 1. Get the prompt template
    const template = await this.getTemplate(config.templateId, config.templateVersion);
    if (!template) {
      throw new AIStepError(
        'TEMPLATE_NOT_FOUND',
        `Template not found: ${config.templateId}`,
        { templateId: config.templateId }
      );
    }

    // 2. Build context from configured sources
    const contextSources = createDefaultContextSources({
      includeJourneyInput: config.contextSources.includes('journey_input'),
      includeStepOutputs: config.contextSources.includes('step_outputs'),
      includeEntity: config.contextSources.includes('entity_data'),
      includeVariables: config.contextSources.includes('variables'),
      includeOSEvidence: config.contextSources.includes('evidence'),
      includeOSObjectIntel: config.contextSources.includes('object_intel'),
    });

    const resolvedContext = await buildContext(
      { sources: contextSources, mergeStrategy: 'deep', maxContextTokens: 4000, truncateStrategy: 'end' },
      context,
      data,
      this.osClient
    );

    // 3. Merge with variable overrides
    const finalContext = {
      ...resolvedContext,
      ...config.variableOverrides,
    };

    // 4. Apply variable defaults from template
    for (const variable of template.variables) {
      if (!(variable.name in finalContext) && variable.default !== undefined) {
        finalContext[variable.name] = variable.default;
      }
    }

    // 5. Validate required variables
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in finalContext)) {
        throw new AIStepError(
          'MISSING_VARIABLE',
          `Required variable missing: ${variable.name}`,
          { variableName: variable.name, templateId: template.id }
        );
      }
    }

    // 6. Build the prompt
    const prompt = buildPrompt(
      template.systemPrompt,
      template.userPrompt,
      finalContext
    );

    // 7. Check if checkpoint is required
    if (config.requiresCheckpoint && this.checkpointStore) {
      const checkpoint = await this.createCheckpoint(step, context, prompt, template);

      if (this.onCheckpointRequired) {
        await this.onCheckpointRequired(checkpoint);
      }

      // Wait for checkpoint approval (or timeout)
      const approved = await this.waitForCheckpoint(checkpoint.id);
      if (!approved) {
        throw new AIStepError(
          'CHECKPOINT_REJECTED',
          'AI step execution was not approved',
          { checkpointId: checkpoint.id }
        );
      }
    }

    // 8. Execute the LLM call via OS
    const llmResult = await this.callLLM(prompt, template);

    // 9. Build the result
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const stepResult: StepResult = {
      stepId: step.id,
      status: 'completed',
      output: llmResult.parsed || llmResult.content,
      startedAt: new Date(startTime),
      completedAt: new Date(endTime),
      durationMs,
      logs: [
        {
          level: 'info',
          message: `AI step completed using template ${template.id} v${template.version}`,
          timestamp: new Date(),
          data: { tokensUsed: llmResult.tokensUsed, modelId: llmResult.modelId },
        },
      ],
    };

    const aiResult: AIExecutionResult = {
      stepResult,
      promptUsed: {
        system: prompt.system,
        user: prompt.user,
        variables: finalContext,
      },
      modelResponse: {
        content: llmResult.content,
        parsed: llmResult.parsed,
        tokensUsed: llmResult.tokensUsed,
        modelId: llmResult.modelId,
        durationMs: llmResult.durationMs,
      },
      metrics: {
        costUsd: llmResult.costUsd,
        inputTokens: llmResult.inputTokens,
        outputTokens: llmResult.outputTokens,
        latencyMs: llmResult.durationMs,
      },
    };

    // 10. Report metrics
    if (this.onMetrics) {
      await this.onMetrics(aiResult.metrics, step.id);
    }

    this.log('info', `AI step ${step.id} completed in ${durationMs}ms`);

    return aiResult;
  }

  /**
   * Get a prompt template
   */
  private async getTemplate(
    templateId: string,
    version?: number
  ): Promise<PromptTemplate | null> {
    return this.templateStore.getTemplate(templateId, version);
  }

  /**
   * Create a checkpoint for human approval
   */
  private async createCheckpoint(
    step: StepNode,
    context: ExecutionContext,
    prompt: { system: string; user: string },
    template: PromptTemplate
  ): Promise<Checkpoint> {
    if (!this.checkpointStore) {
      throw new AIStepError(
        'CHECKPOINT_STORE_MISSING',
        'Checkpoint store is required for checkpoint creation'
      );
    }

    const checkpoint: Checkpoint = {
      id: crypto.randomUUID(),
      instanceId: context.instanceId,
      stepId: step.id,
      status: 'pending',
      previewData: {
        stepType: step.type,
        input: { system: prompt.system, user: prompt.user },
        promptPreview: `${prompt.system.slice(0, 200)}...\n\n${prompt.user.slice(0, 500)}...`,
        estimatedCost: estimateTokens(prompt.system + prompt.user) * 0.00001, // Rough estimate
        riskLevel: this.assessRiskLevel(step, context),
      },
      expiresAt: new Date(Date.now() + this.options.checkpointTimeoutMs),
      createdAt: new Date(),
    };

    await this.checkpointStore.createCheckpoint(checkpoint);

    this.log('info', `Created checkpoint ${checkpoint.id} for step ${step.id}`);

    return checkpoint;
  }

  /**
   * Wait for checkpoint approval
   */
  private async waitForCheckpoint(checkpointId: string): Promise<boolean> {
    if (!this.checkpointStore) return true;

    const pollIntervalMs = 5000; // Poll every 5 seconds
    const maxWaitMs = this.options.checkpointTimeoutMs;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const checkpoint = await this.checkpointStore.getCheckpoint(checkpointId);

      if (!checkpoint) {
        throw new AIStepError('CHECKPOINT_NOT_FOUND', `Checkpoint ${checkpointId} not found`);
      }

      if (checkpoint.status === 'approved') {
        return true;
      }

      if (checkpoint.status === 'rejected') {
        return false;
      }

      if (checkpoint.status === 'expired') {
        return false;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    // Timeout - mark as expired
    await this.checkpointStore.updateCheckpoint(checkpointId, { status: 'expired' });
    return false;
  }

  /**
   * Assess risk level for a step
   */
  private assessRiskLevel(
    step: StepNode,
    context: ExecutionContext
  ): 'low' | 'medium' | 'high' {
    // High risk: outreach, action steps
    if (step.type === 'outreach' || step.type === 'action') {
      return 'high';
    }

    // Medium risk: decision, scoring steps
    if (step.type === 'decision' || step.type === 'scoring') {
      return 'medium';
    }

    // Low risk: discovery, enrichment, validation
    return 'low';
  }

  /**
   * Call the OS LLM endpoint
   */
  private async callLLM(
    prompt: { system: string; user: string },
    template: PromptTemplate
  ): Promise<LLMCallResult> {
    const startTime = Date.now();

    const response = await this.osClient.call('/llm/chat', {
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      model_preference: template.modelPreference,
      temperature: template.temperature,
      max_tokens: template.maxTokens,
      output_schema: template.outputSchema,
    });

    if (!response.success) {
      throw new AIStepError(
        'LLM_CALL_FAILED',
        `LLM call failed: ${response.error}`,
        { error: response.error }
      );
    }

    const data = response.data as LLMResponseData;
    const durationMs = Date.now() - startTime;

    // Parse structured output if schema was provided
    let parsed: unknown = undefined;
    if (template.outputSchema && data.content) {
      try {
        parsed = JSON.parse(data.content);
      } catch {
        // Content is not valid JSON, use as-is
        this.log('warn', 'Failed to parse LLM output as JSON');
      }
    }

    return {
      content: data.content,
      parsed,
      tokensUsed: data.usage?.total_tokens || 0,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      modelId: data.model || 'unknown',
      durationMs,
      costUsd: this.estimateCost(
        data.usage?.prompt_tokens || 0,
        data.usage?.completion_tokens || 0,
        data.model || 'unknown'
      ),
    };
  }

  /**
   * Estimate cost in USD (rough approximation)
   */
  private estimateCost(
    inputTokens: number,
    outputTokens: number,
    modelId: string
  ): number {
    // Default pricing (Claude/GPT-4 class)
    let inputCostPer1K = 0.003;
    let outputCostPer1K = 0.015;

    // Adjust for model tier
    if (modelId.includes('haiku') || modelId.includes('mini')) {
      inputCostPer1K = 0.00025;
      outputCostPer1K = 0.00125;
    } else if (modelId.includes('sonnet') || modelId.includes('4o')) {
      inputCostPer1K = 0.003;
      outputCostPer1K = 0.015;
    } else if (modelId.includes('opus') || modelId.includes('o1')) {
      inputCostPer1K = 0.015;
      outputCostPer1K = 0.075;
    }

    return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K;
  }

  /**
   * Log with level check
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.options.logLevel)) {
      const prefix = `[AI Orchestrator]`;
      switch (level) {
        case 'debug':
          console.debug(prefix, message);
          break;
        case 'info':
          console.info(prefix, message);
          break;
        case 'warn':
          console.warn(prefix, message);
          break;
        case 'error':
          console.error(prefix, message);
          break;
      }
    }
  }

  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  /**
   * Register a prompt template
   */
  async registerTemplate(template: Omit<PromptTemplate, 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    const now = new Date();
    const fullTemplate: PromptTemplate = {
      ...template,
      createdAt: now,
      updatedAt: now,
    };

    await this.templateStore.saveTemplate(fullTemplate);
    return fullTemplate;
  }

  /**
   * List available templates
   */
  async listTemplates(filters?: { category?: string; tags?: string[] }): Promise<PromptTemplate[]> {
    return this.templateStore.listTemplates(filters);
  }
}

// =============================================================================
// IN-MEMORY TEMPLATE STORE
// =============================================================================

class InMemoryTemplateStore implements PromptTemplateStore {
  private templates = new Map<string, Map<number, PromptTemplate>>();

  async getTemplate(id: string, version?: number): Promise<PromptTemplate | null> {
    const versions = this.templates.get(id);
    if (!versions) return null;

    if (version !== undefined) {
      return versions.get(version) || null;
    }

    // Get latest version
    const latest = await this.getLatestVersion(id);
    return versions.get(latest) || null;
  }

  async saveTemplate(template: PromptTemplate): Promise<void> {
    if (!this.templates.has(template.id)) {
      this.templates.set(template.id, new Map());
    }
    this.templates.get(template.id)!.set(template.version, template);
  }

  async listTemplates(filters?: { category?: string; tags?: string[] }): Promise<PromptTemplate[]> {
    const result: PromptTemplate[] = [];

    for (const versions of this.templates.values()) {
      // Get latest version of each template
      const latestVersion = Math.max(...versions.keys());
      const template = versions.get(latestVersion)!;

      // Apply filters
      if (filters?.category && template.category !== filters.category) {
        continue;
      }

      if (filters?.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every((tag) => template.tags.includes(tag));
        if (!hasAllTags) continue;
      }

      result.push(template);
    }

    return result;
  }

  async getLatestVersion(id: string): Promise<number> {
    const versions = this.templates.get(id);
    if (!versions || versions.size === 0) return 0;
    return Math.max(...versions.keys());
  }
}

// =============================================================================
// OS CLIENT FACTORY
// =============================================================================

function createOSClient(baseUrl?: string, apiKey?: string): OSClientInterface {
  const url = baseUrl || process.env.UPR_OS_BASE_URL || 'http://localhost:8080';
  const key = apiKey || process.env.UPR_OS_API_KEY || '';

  return {
    async call(endpoint: string, params: Record<string, unknown>) {
      try {
        const response = await fetch(`${url}/api/os${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': key,
            'X-Client': 'promptable-journeys',
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
// ERROR CLASS
// =============================================================================

export class AIStepError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIStepError';
  }
}

// =============================================================================
// TYPES
// =============================================================================

interface LLMCallResult {
  content: string;
  parsed?: unknown;
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

export function createAIStepOrchestrator(
  options?: AIStepOrchestratorOptions
): AIStepOrchestrator {
  return new AIStepOrchestrator(options);
}
