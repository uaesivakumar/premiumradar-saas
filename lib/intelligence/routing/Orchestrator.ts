/**
 * Orchestrator - S45
 *
 * Executes orchestration plans and manages agent coordination.
 * Handles parallel execution, dependencies, and handoffs.
 */

import type { AgentType } from '@/lib/stores/siva-store';
import type {
  RoutingDecision,
  OrchestrationPlan,
  ExecutionStep,
  ExecutionProgress,
  AgentHandoff,
} from './types';
import { AGENT_CAPABILITIES } from './AgentRegistry';

// =============================================================================
// Execution Types
// =============================================================================

/**
 * Result from executing a step
 */
export interface StepResult {
  stepId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
}

/**
 * Result from executing full plan
 */
export interface PlanExecutionResult {
  planId: string;
  success: boolean;
  stepResults: StepResult[];
  finalResult: unknown;
  totalDuration: number;
  handoffs: AgentHandoff[];
}

/**
 * Step executor function type
 */
export type StepExecutor = (step: ExecutionStep) => Promise<StepResult>;

// =============================================================================
// Orchestrator Functions
// =============================================================================

/**
 * Execute an orchestration plan
 *
 * Note: This executes the ROUTING PLAN only.
 * Actual agent execution still goes through existing SIVA agents.
 */
export async function executePlan(
  plan: OrchestrationPlan,
  executor: StepExecutor,
  onProgress?: (progress: ExecutionProgress) => void
): Promise<PlanExecutionResult> {
  const startTime = Date.now();
  const stepResults: StepResult[] = [];
  const handoffs: AgentHandoff[] = [];
  const completedSteps = new Set<string>();

  // Initialize progress
  const progress: ExecutionProgress = {
    totalSteps: plan.totalSteps,
    completedSteps: 0,
    currentStep: null,
    status: 'executing',
    startedAt: new Date(),
    estimatedCompletion: new Date(Date.now() + plan.estimatedDuration),
  };
  onProgress?.(progress);

  // Execute parallel groups in sequence
  for (const group of plan.parallelGroups) {
    // Get steps in this group that are ready to execute
    const readySteps = plan.steps.filter(
      s => group.includes(s.id) && !completedSteps.has(s.id)
    );

    // Check dependencies
    const executableSteps = readySteps.filter(s =>
      s.dependencies.every(dep => completedSteps.has(dep))
    );

    if (executableSteps.length === 0) continue;

    // Execute group in parallel
    const groupResults = await executeParallelSteps(
      executableSteps,
      executor,
      (stepId) => {
        progress.currentStep = stepId;
        onProgress?.(progress);
      }
    );

    // Process results
    for (const result of groupResults) {
      stepResults.push(result);
      if (result.success) {
        completedSteps.add(result.stepId);
        progress.completedSteps++;
        onProgress?.(progress);
      } else {
        // Check for handoff opportunity
        const failedStep = plan.steps.find(s => s.id === result.stepId);
        if (failedStep) {
          const handoff = createHandoff(failedStep, result.error || 'Unknown error');
          if (handoff) {
            handoffs.push(handoff);
          }
        }
      }
    }
  }

  // Determine success
  const allSucceeded = stepResults.every(r => r.success);

  // Build final result
  const lastSuccessful = stepResults
    .filter(r => r.success)
    .sort((a, b) => {
      const stepA = plan.steps.find(s => s.id === a.stepId);
      const stepB = plan.steps.find(s => s.id === b.stepId);
      return (stepB?.stepNumber || 0) - (stepA?.stepNumber || 0);
    })[0];

  progress.status = allSucceeded ? 'complete' : 'failed';
  progress.currentStep = null;
  onProgress?.(progress);

  return {
    planId: plan.id,
    success: allSucceeded,
    stepResults,
    finalResult: lastSuccessful?.result,
    totalDuration: Date.now() - startTime,
    handoffs,
  };
}

/**
 * Execute multiple steps in parallel
 */
async function executeParallelSteps(
  steps: ExecutionStep[],
  executor: StepExecutor,
  onStepStart?: (stepId: string) => void
): Promise<StepResult[]> {
  const promises = steps.map(async (step) => {
    onStepStart?.(step.id);
    return executeStepWithRetry(step, executor);
  });

  return Promise.all(promises);
}

/**
 * Execute a step with retry logic
 */
async function executeStepWithRetry(
  step: ExecutionStep,
  executor: StepExecutor
): Promise<StepResult> {
  let lastError: string | undefined;
  let attempts = 0;

  while (attempts <= step.retryCount) {
    try {
      const result = await executeWithTimeout(
        () => executor(step),
        step.timeout
      );

      if (result.success) {
        return result;
      }

      lastError = result.error;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
    }

    attempts++;
  }

  return {
    stepId: step.id,
    success: false,
    error: `Failed after ${attempts} attempts: ${lastError}`,
    duration: 0,
  };
}

/**
 * Execute with timeout
 */
async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ]);
}

/**
 * Create a handoff when a step fails
 */
function createHandoff(
  failedStep: ExecutionStep,
  reason: string
): AgentHandoff | null {
  // Find alternative agent
  const capability = AGENT_CAPABILITIES[failedStep.agent];
  const alternatives = Object.entries(AGENT_CAPABILITIES)
    .filter(([agent, cap]) => {
      if (agent === failedStep.agent) return false;
      // Check for overlapping capabilities
      return cap.primaryIntents.some(i => capability.primaryIntents.includes(i)) ||
             cap.secondaryIntents.some(i => capability.primaryIntents.includes(i));
    })
    .map(([agent]) => agent as AgentType);

  if (alternatives.length === 0) return null;

  return {
    id: `ho-${Date.now()}`,
    fromAgent: failedStep.agent,
    toAgent: alternatives[0],
    reason,
    context: failedStep.inputs,
    handoffAt: new Date(),
  };
}

// =============================================================================
// Progress Tracking
// =============================================================================

/**
 * Create initial execution progress
 */
export function createInitialProgress(plan: OrchestrationPlan): ExecutionProgress {
  return {
    totalSteps: plan.totalSteps,
    completedSteps: 0,
    currentStep: null,
    status: 'planning',
    startedAt: null,
    estimatedCompletion: null,
  };
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(progress: ExecutionProgress): number {
  if (progress.totalSteps === 0) return 0;
  return Math.round((progress.completedSteps / progress.totalSteps) * 100);
}

/**
 * Get progress status message
 */
export function getProgressMessage(progress: ExecutionProgress): string {
  switch (progress.status) {
    case 'idle':
      return 'Ready to execute';
    case 'planning':
      return 'Creating execution plan...';
    case 'executing':
      const pct = calculateProgressPercentage(progress);
      return progress.currentStep
        ? `Executing ${progress.currentStep} (${pct}%)`
        : `Executing (${pct}%)`;
    case 'complete':
      return 'Execution complete';
    case 'failed':
      return 'Execution failed';
    default:
      return 'Unknown status';
  }
}

// =============================================================================
// Simulation Executor (for testing/demo)
// =============================================================================

/**
 * Create a simulated step executor
 * Used for testing and demonstration purposes
 */
export function createSimulatedExecutor(
  latencyMultiplier: number = 1
): StepExecutor {
  return async (step: ExecutionStep): Promise<StepResult> => {
    const capability = AGENT_CAPABILITIES[step.agent];
    const latency = capability.averageLatency * latencyMultiplier;

    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate success/failure based on agent success rate
    const success = Math.random() < capability.successRate;

    return {
      stepId: step.id,
      success,
      result: success
        ? { agent: step.agent, action: step.action, simulated: true }
        : undefined,
      error: success ? undefined : 'Simulated failure',
      duration: latency,
    };
  };
}
