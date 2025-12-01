/**
 * Autonomous Step Executor
 * Sprint S49: AI-Enabled Journey Runtime
 *
 * Integrates with OS autonomous capabilities (S67-S70):
 * - S66: Autonomous Safety (checkpoints, kill switch)
 * - S67: Auto-Discovery Engine
 * - S68: Auto-Outreach Engine
 * - S69: ML Self-Tuning
 * - S70: Autonomous Observability (cost & performance metrics)
 *
 * All autonomous steps route through safety checkpoints
 * and report metrics for observability.
 */
import type {
  ExecutionContext,
  ExecutionData,
  StepResult,
} from '../journey-engine/types';
import type { StepNode } from '../journey-builder/types';
import type {
  AutonomousStepConfig,
  AIExecutionResult,
  Checkpoint,
  CheckpointStore,
} from './types';
import type { OSClientInterface } from './context-provider';
import { AIStepError } from './ai-orchestrator';

// =============================================================================
// AUTONOMOUS STEP EXECUTOR
// =============================================================================

export class AutonomousStepExecutor {
  private osClient: OSClientInterface;
  private checkpointStore: CheckpointStore | null;
  private options: AutonomousExecutorOptions;

  constructor(options: AutonomousExecutorOptions = {}) {
    this.osClient = options.osClient || createDefaultOSClient();
    this.checkpointStore = options.checkpointStore || null;
    this.options = {
      checkpointTimeoutMs: options.checkpointTimeoutMs || 300000, // 5 min default
      logLevel: options.logLevel || 'info',
      onMetrics: options.onMetrics,
      onSafetyEvent: options.onSafetyEvent,
      osClient: this.osClient,
    };
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
    const startTime = Date.now();

    this.log('debug', `Executing autonomous step: ${step.id} (${config.capability})`);

    // 1. Check kill switch status via OS autonomous safety (S66)
    const safetyStatus = await this.checkSafetyStatus();
    if (!safetyStatus.enabled) {
      throw new AutonomousStepError(
        'AUTONOMOUS_DISABLED',
        'Autonomous execution is disabled (kill switch active)',
        { reason: safetyStatus.reason }
      );
    }

    // 2. Create checkpoint if required
    let checkpoint: Checkpoint | null = null;
    if (config.requiresCheckpoint && this.checkpointStore) {
      checkpoint = await this.createSafetyCheckpoint(step, context, config);

      // Notify about checkpoint
      if (this.options.onSafetyEvent) {
        await this.options.onSafetyEvent({
          type: 'checkpoint_created',
          checkpointId: checkpoint.id,
          stepId: step.id,
          timestamp: new Date(),
        });
      }

      // Wait for approval
      const approved = await this.waitForCheckpoint(checkpoint.id);
      if (!approved) {
        throw new AutonomousStepError(
          'CHECKPOINT_NOT_APPROVED',
          'Autonomous step was not approved',
          { checkpointId: checkpoint.id }
        );
      }
    }

    // 3. Log activity to OS activity log (S66)
    const activityId = await this.logActivity(step, context, config, 'started');

    // 4. Execute the capability
    let result: CapabilityResult;
    try {
      result = await this.executeCapability(config, context, data);
    } catch (error) {
      // Log failure
      await this.logActivity(step, context, config, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }

    // 5. Log completion
    await this.logActivity(step, context, config, 'completed', {
      resultSummary: result.summary,
    });

    // 6. Report metrics to S70
    const metrics = await this.reportMetrics(step.id, config, result, startTime);

    // 7. Build result
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const stepResult: StepResult = {
      stepId: step.id,
      status: 'completed',
      output: result.data,
      startedAt: new Date(startTime),
      completedAt: new Date(endTime),
      durationMs,
      logs: [
        {
          level: 'info',
          message: `Autonomous ${config.capability} completed: ${result.summary}`,
          timestamp: new Date(),
          data: { activityId },
        },
      ],
    };

    const autonomousResult: AutonomousExecutionResult = {
      stepResult,
      capability: config.capability,
      activityId,
      checkpoint: checkpoint
        ? {
            id: checkpoint.id,
            approved: true,
            approvedAt: new Date(),
          }
        : undefined,
      metrics,
      osResponse: result.osResponse,
    };

    this.log('info', `Autonomous step ${step.id} completed in ${durationMs}ms`);

    return autonomousResult;
  }

  // ===========================================================================
  // SAFETY (S66)
  // ===========================================================================

  /**
   * Check if autonomous execution is enabled
   */
  private async checkSafetyStatus(): Promise<{ enabled: boolean; reason?: string }> {
    try {
      const response = await this.osClient.call('/autonomous/status', {});

      if (!response.success) {
        return { enabled: false, reason: response.error || 'Failed to check status' };
      }

      const data = response.data as { enabled: boolean; reason?: string };
      return { enabled: data.enabled, reason: data.reason };
    } catch (error) {
      // If we can't reach the safety endpoint, assume disabled for safety
      return {
        enabled: false,
        reason: `Safety check failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Create a safety checkpoint
   */
  private async createSafetyCheckpoint(
    step: StepNode,
    context: ExecutionContext,
    config: AutonomousStepConfig
  ): Promise<Checkpoint> {
    if (!this.checkpointStore) {
      throw new AutonomousStepError(
        'CHECKPOINT_STORE_MISSING',
        'Checkpoint store is required for autonomous steps'
      );
    }

    // Also register with OS checkpoint system
    const osCheckpointResponse = await this.osClient.call('/autonomous/checkpoint/create', {
      instanceId: context.instanceId,
      stepId: step.id,
      capability: config.capability,
      config: config,
    });

    const checkpoint: Checkpoint = {
      id: (osCheckpointResponse.data as { checkpointId?: string })?.checkpointId || crypto.randomUUID(),
      instanceId: context.instanceId,
      stepId: step.id,
      status: 'pending',
      previewData: {
        stepType: `autonomous_${config.capability}`,
        input: this.buildCapabilityPreview(config),
        riskLevel: this.assessRiskLevel(config),
      },
      expiresAt: new Date(Date.now() + (this.options.checkpointTimeoutMs || 300000)),
      createdAt: new Date(),
    };

    await this.checkpointStore.createCheckpoint(checkpoint);

    return checkpoint;
  }

  /**
   * Wait for checkpoint approval
   */
  private async waitForCheckpoint(checkpointId: string): Promise<boolean> {
    if (!this.checkpointStore) return true;

    const pollIntervalMs = 3000;
    const maxWaitMs = this.options.checkpointTimeoutMs || 300000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      // Check local store
      const checkpoint = await this.checkpointStore.getCheckpoint(checkpointId);

      if (!checkpoint) {
        throw new AutonomousStepError('CHECKPOINT_NOT_FOUND', `Checkpoint ${checkpointId} not found`);
      }

      if (checkpoint.status === 'approved') return true;
      if (checkpoint.status === 'rejected') return false;
      if (checkpoint.status === 'expired') return false;

      // Also check OS checkpoint status
      const osStatus = await this.osClient.call('/autonomous/checkpoint/status', {
        checkpointId,
      });

      if (osStatus.success) {
        const status = (osStatus.data as { status: string }).status;
        if (status === 'approved') {
          await this.checkpointStore.updateCheckpoint(checkpointId, { status: 'approved' });
          return true;
        }
        if (status === 'rejected') {
          await this.checkpointStore.updateCheckpoint(checkpointId, { status: 'rejected' });
          return false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    // Timeout
    await this.checkpointStore.updateCheckpoint(checkpointId, { status: 'expired' });
    return false;
  }

  /**
   * Log activity to OS
   */
  private async logActivity(
    step: StepNode,
    context: ExecutionContext,
    config: AutonomousStepConfig,
    status: 'started' | 'completed' | 'failed',
    details?: Record<string, unknown>
  ): Promise<string> {
    const response = await this.osClient.call('/autonomous/activity/log', {
      instanceId: context.instanceId,
      stepId: step.id,
      capability: config.capability,
      status,
      details,
      timestamp: new Date().toISOString(),
    });

    return (response.data as { activityId?: string })?.activityId || crypto.randomUUID();
  }

  /**
   * Assess risk level of autonomous operation
   */
  private assessRiskLevel(config: AutonomousStepConfig): 'low' | 'medium' | 'high' {
    // Outreach is high risk (external communication)
    if (config.capability === 'auto_outreach') {
      return 'high';
    }

    // Discovery and tuning are medium risk
    if (config.capability === 'auto_discovery' || config.capability === 'self_tuning') {
      return 'medium';
    }

    // Performance metrics are low risk (read-only)
    return 'low';
  }

  /**
   * Build preview for checkpoint
   */
  private buildCapabilityPreview(config: AutonomousStepConfig): Record<string, unknown> {
    switch (config.capability) {
      case 'auto_discovery':
        return {
          action: 'Auto-Discovery',
          targetType: config.discoveryConfig?.targetType || 'default',
          qualityThreshold: config.discoveryConfig?.qualityThreshold || 0.6,
          maxResults: config.discoveryConfig?.maxResults || 100,
        };

      case 'auto_outreach':
        return {
          action: 'Auto-Outreach',
          channel: config.outreachConfig?.channel || 'email',
          sequenceId: config.outreachConfig?.sequenceId || 'default',
          sendTimeOptimization: config.outreachConfig?.sendTimeOptimization,
        };

      case 'self_tuning':
        return {
          action: 'ML Self-Tuning',
          signalType: config.tuningConfig?.signalType,
          feedbackType: config.tuningConfig?.feedbackType,
        };

      case 'performance':
        return {
          action: 'Performance Metrics',
          metricTypes: config.metricsConfig?.metricTypes || ['cost', 'performance'],
          aggregation: config.metricsConfig?.aggregation || 'sum',
        };

      default:
        return { action: config.capability };
    }
  }

  // ===========================================================================
  // CAPABILITY EXECUTION
  // ===========================================================================

  /**
   * Execute the autonomous capability via OS
   */
  private async executeCapability(
    config: AutonomousStepConfig,
    context: ExecutionContext,
    data: ExecutionData
  ): Promise<CapabilityResult> {
    switch (config.capability) {
      case 'auto_discovery':
        return this.executeAutoDiscovery(config, context, data);

      case 'auto_outreach':
        return this.executeAutoOutreach(config, context, data);

      case 'self_tuning':
        return this.executeSelfTuning(config, context, data);

      case 'performance':
        return this.executePerformanceMetrics(config, context, data);

      default:
        throw new AutonomousStepError(
          'UNKNOWN_CAPABILITY',
          `Unknown autonomous capability: ${config.capability}`
        );
    }
  }

  /**
   * Execute Auto-Discovery (S67)
   */
  private async executeAutoDiscovery(
    config: AutonomousStepConfig,
    context: ExecutionContext,
    data: ExecutionData
  ): Promise<CapabilityResult> {
    const response = await this.osClient.call('/auto-discovery/execute', {
      targetType: config.discoveryConfig?.targetType,
      qualityThreshold: config.discoveryConfig?.qualityThreshold || 0.6,
      maxResults: config.discoveryConfig?.maxResults || 100,
      journeyContext: {
        instanceId: context.instanceId,
        journeyId: context.journeyId,
        input: data.input,
      },
    });

    if (!response.success) {
      throw new AutonomousStepError(
        'AUTO_DISCOVERY_FAILED',
        `Auto-discovery failed: ${response.error}`,
        { error: response.error }
      );
    }

    const result = response.data as AutoDiscoveryResult;

    return {
      data: result,
      summary: `Discovered ${result.count || 0} entities (${result.qualityScore?.toFixed(2) || 'N/A'} quality)`,
      osResponse: response,
    };
  }

  /**
   * Execute Auto-Outreach (S68)
   */
  private async executeAutoOutreach(
    config: AutonomousStepConfig,
    context: ExecutionContext,
    data: ExecutionData
  ): Promise<CapabilityResult> {
    const response = await this.osClient.call('/auto-outreach/execute', {
      channel: config.outreachConfig?.channel || 'email',
      sequenceId: config.outreachConfig?.sequenceId,
      sendTimeOptimization: config.outreachConfig?.sendTimeOptimization !== false,
      targets: data.input.targets || [],
      journeyContext: {
        instanceId: context.instanceId,
        journeyId: context.journeyId,
      },
    });

    if (!response.success) {
      throw new AutonomousStepError(
        'AUTO_OUTREACH_FAILED',
        `Auto-outreach failed: ${response.error}`,
        { error: response.error }
      );
    }

    const result = response.data as AutoOutreachResult;

    return {
      data: result,
      summary: `Queued ${result.queuedCount || 0} outreach messages`,
      osResponse: response,
    };
  }

  /**
   * Execute Self-Tuning (S69)
   */
  private async executeSelfTuning(
    config: AutonomousStepConfig,
    context: ExecutionContext,
    data: ExecutionData
  ): Promise<CapabilityResult> {
    const response = await this.osClient.call('/tuning/feedback', {
      signalType: config.tuningConfig?.signalType,
      feedbackType: config.tuningConfig?.feedbackType,
      feedback: data.input.feedback || {},
      journeyContext: {
        instanceId: context.instanceId,
        journeyId: context.journeyId,
      },
    });

    if (!response.success) {
      throw new AutonomousStepError(
        'SELF_TUNING_FAILED',
        `Self-tuning failed: ${response.error}`,
        { error: response.error }
      );
    }

    const result = response.data as SelfTuningResult;

    return {
      data: result,
      summary: `Processed ${result.feedbackCount || 0} feedback items`,
      osResponse: response,
    };
  }

  /**
   * Execute Performance Metrics (S70)
   */
  private async executePerformanceMetrics(
    config: AutonomousStepConfig,
    context: ExecutionContext,
    data: ExecutionData
  ): Promise<CapabilityResult> {
    const response = await this.osClient.call('/metrics/aggregate', {
      metricTypes: config.metricsConfig?.metricTypes || ['cost', 'performance', 'conversion'],
      aggregation: config.metricsConfig?.aggregation || 'sum',
      journeyContext: {
        instanceId: context.instanceId,
        journeyId: context.journeyId,
      },
    });

    if (!response.success) {
      throw new AutonomousStepError(
        'PERFORMANCE_METRICS_FAILED',
        `Performance metrics failed: ${response.error}`,
        { error: response.error }
      );
    }

    const result = response.data as PerformanceMetricsResult;

    return {
      data: result,
      summary: `Retrieved ${Object.keys(result.metrics || {}).length} metric types`,
      osResponse: response,
    };
  }

  // ===========================================================================
  // METRICS (S70)
  // ===========================================================================

  /**
   * Report metrics to OS S70
   */
  private async reportMetrics(
    stepId: string,
    config: AutonomousStepConfig,
    result: CapabilityResult,
    startTime: number
  ): Promise<AutonomousMetrics> {
    const durationMs = Date.now() - startTime;

    const metrics: AutonomousMetrics = {
      capability: config.capability,
      durationMs,
      success: true,
      // Additional metrics from result
      itemsProcessed: (result.data as { count?: number }).count || 0,
      costUsd: (result.data as { costUsd?: number }).costUsd || 0,
    };

    // Report to OS metrics endpoint
    if (config.trackMetrics !== false) {
      await this.osClient.call('/metrics/record', {
        stepId,
        capability: config.capability,
        metrics,
        tags: config.metricTags || [],
        timestamp: new Date().toISOString(),
      });
    }

    // Notify local callback
    if (this.options.onMetrics) {
      await this.options.onMetrics(metrics, stepId);
    }

    return metrics;
  }

  /**
   * Log helper
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.options.logLevel || 'info')) {
      console[level]('[Autonomous]', message);
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
            'X-Client': 'promptable-journeys-autonomous',
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

export class AutonomousStepError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AutonomousStepError';
  }
}

// =============================================================================
// TYPES
// =============================================================================

export interface AutonomousExecutorOptions {
  osClient?: OSClientInterface;
  checkpointStore?: CheckpointStore;
  checkpointTimeoutMs?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  onMetrics?: (metrics: AutonomousMetrics, stepId: string) => void | Promise<void>;
  onSafetyEvent?: (event: SafetyEvent) => void | Promise<void>;
}

export interface AutonomousExecutionResult {
  stepResult: StepResult;
  capability: AutonomousStepConfig['capability'];
  activityId: string;
  checkpoint?: {
    id: string;
    approved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
  };
  metrics: AutonomousMetrics;
  osResponse: unknown;
}

export interface AutonomousMetrics {
  capability: string;
  durationMs: number;
  success: boolean;
  itemsProcessed?: number;
  costUsd?: number;
}

export interface SafetyEvent {
  type: 'checkpoint_created' | 'checkpoint_approved' | 'checkpoint_rejected' | 'kill_switch_activated';
  checkpointId?: string;
  stepId?: string;
  reason?: string;
  timestamp: Date;
}

interface CapabilityResult {
  data: unknown;
  summary: string;
  osResponse: unknown;
}

interface AutoDiscoveryResult {
  count?: number;
  qualityScore?: number;
  entities?: unknown[];
}

interface AutoOutreachResult {
  queuedCount?: number;
  messages?: unknown[];
}

interface SelfTuningResult {
  feedbackCount?: number;
  adjustments?: unknown[];
}

interface PerformanceMetricsResult {
  metrics?: Record<string, number>;
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createAutonomousExecutor(
  options?: AutonomousExecutorOptions
): AutonomousStepExecutor {
  return new AutonomousStepExecutor(options);
}
