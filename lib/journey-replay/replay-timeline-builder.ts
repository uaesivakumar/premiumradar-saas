/**
 * Replay Timeline Builder
 * Sprint S52: Replay Engine
 *
 * Generates replay timeline events from journey run history.
 * Aligns with S51 timeline viewer visual structure.
 */
import type {
  JourneyRunDetails,
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunTransition,
  JourneyRunError,
  JourneyRunCheckpoint,
  JourneyRunOSCall,
  JourneyRunContextSnapshot,
} from '@/lib/journey-runs';
import type {
  ReplayEvent,
  ReplayStep,
  ReplayTimeline,
  ReplayBranch,
  ReplaySummary,
  ReplayEventType,
} from './types';
import { computeContextDiff, createContextSnapshotManager } from './replay-context';

// =============================================================================
// TIMELINE BUILDER
// =============================================================================

/**
 * Build a replay timeline from journey run details
 */
export function buildReplayTimeline(details: JourneyRunDetails): ReplayTimeline {
  const { run, steps, aiLogs, transitions, errors, checkpoints, osCalls, contextSnapshots } = details;

  // Calculate base timestamp
  const baseTime = run.startedAt.getTime();

  // Build events
  const events = buildReplayEvents(details, baseTime);

  // Build steps with associated data
  const replaySteps = buildReplaySteps(details, events, baseTime);

  // Build branches
  const branches = buildReplayBranches(transitions);

  // Calculate metrics
  const metrics = calculateTimelineMetrics(details, replaySteps);

  return {
    runId: run.id,
    journeyId: run.journeyId,
    totalDurationMs: run.totalDurationMs || calculateDuration(run.startedAt, run.endedAt),
    startTime: run.startedAt,
    endTime: run.endedAt,
    steps: replaySteps,
    events,
    metrics,
    branches,
  };
}

/**
 * Build replay summary from timeline
 */
export function buildReplaySummary(
  details: JourneyRunDetails,
  timeline: ReplayTimeline
): ReplaySummary {
  const { run, aiLogs, checkpoints, osCalls, errors } = details;

  // Count AI metrics
  const modelsUsed = new Set<string>();
  let totalTokens = 0;
  let totalCostMicros = 0;
  let decisionPoints = 0;

  for (const log of aiLogs) {
    if (log.modelId) modelsUsed.add(log.modelId);
    totalTokens += log.totalTokens || 0;
    totalCostMicros += log.costMicros || 0;
    if (log.selectedOutcome) decisionPoints++;
  }

  // Count checkpoints
  const checkpointsApproved = checkpoints.filter(c => c.status === 'approved').length;
  const checkpointsRejected = checkpoints.filter(c => c.status === 'rejected').length;

  // Count OS calls
  const osCallsSucceeded = osCalls.filter(c => c.responseStatus && c.responseStatus < 400).length;

  // Count errors
  const recoveredErrors = errors.filter(e => e.recovered).length;

  // Count retries
  const retryCount = timeline.steps.reduce((sum, s) => sum + (s.originalStep.retryCount || 0), 0);

  return {
    runId: run.id,
    journeyId: run.journeyId,
    journeyName: undefined, // Would need journey definition
    status: run.status,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    totalDurationMs: timeline.totalDurationMs,
    totalSteps: run.totalSteps,
    completedSteps: run.completedSteps,
    failedSteps: run.failedSteps,
    skippedSteps: run.skippedSteps,
    retryCount,
    aiCalls: aiLogs.length,
    totalTokens,
    totalCostMicros,
    modelsUsed: Array.from(modelsUsed),
    decisionPoints,
    branchesTaken: timeline.branches.filter(b => b.taken).length,
    fallbacksTriggered: timeline.metrics.totalFallbacks,
    fallbacksSucceeded: timeline.steps.filter(
      s => s.fallbackTriggered && s.status === 'completed'
    ).length,
    checkpointsRequired: checkpoints.length,
    checkpointsApproved,
    checkpointsRejected,
    osCalls: osCalls.length,
    osCallsSucceeded,
    errorCount: errors.length,
    recoveredErrors,
  };
}

// =============================================================================
// EVENT BUILDING
// =============================================================================

function buildReplayEvents(details: JourneyRunDetails, baseTime: number): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  let eventId = 0;

  const generateId = () => `event-${++eventId}`;

  // Journey start event
  events.push({
    id: generateId(),
    type: 'journey:start',
    timestamp: 0,
    absoluteTime: details.run.startedAt,
    data: {
      runId: details.run.id,
      journeyId: details.run.journeyId,
      triggeredBy: details.run.triggeredBy,
      inputData: details.run.inputData || {},
    },
  });

  // Sort steps by execution order
  const sortedSteps = [...details.steps].sort(
    (a, b) => (a.executionOrder || 0) - (b.executionOrder || 0)
  );

  // Create index maps for related data
  const aiLogsByStep = groupBy(details.aiLogs, 'stepId');
  const transitionsByFrom = groupBy(details.transitions, 'fromStepId');
  const errorsByStep = groupBy(details.errors, 'stepId');
  const checkpointsByStep = groupBy(details.checkpoints, 'stepId');
  const osCallsByStep = groupBy(details.osCalls, 'stepId');
  const snapshotsByStep = groupBy(details.contextSnapshots, 'stepId');

  // Context manager for diffs
  const contextManager = createContextSnapshotManager(details);

  // Build events for each step
  for (let stepIndex = 0; stepIndex < sortedSteps.length; stepIndex++) {
    const step = sortedSteps[stepIndex];
    const stepBaseTime = step.startedAt ? step.startedAt.getTime() - baseTime : 0;

    // Step queue event
    if (step.queuedAt) {
      events.push({
        id: generateId(),
        type: 'step:queue',
        timestamp: step.queuedAt.getTime() - baseTime,
        absoluteTime: step.queuedAt,
        stepId: step.stepId,
        stepIndex,
        data: {
          stepName: step.stepName || step.stepId,
          stepType: step.stepType || 'action',
          executionOrder: step.executionOrder || stepIndex,
        },
      });
    }

    // Step start event
    if (step.startedAt) {
      events.push({
        id: generateId(),
        type: 'step:start',
        timestamp: stepBaseTime,
        absoluteTime: step.startedAt,
        stepId: step.stepId,
        stepIndex,
        data: {
          stepName: step.stepName || step.stepId,
          stepType: step.stepType || 'action',
          inputData: step.inputData || {},
        },
      });
    }

    // Context snapshot event
    const snapshots = snapshotsByStep.get(step.stepId) || [];
    for (const snapshot of snapshots) {
      events.push({
        id: generateId(),
        type: 'context:snapshot',
        timestamp: snapshot.createdAt.getTime() - baseTime,
        absoluteTime: snapshot.createdAt,
        stepId: step.stepId,
        stepIndex,
        data: {
          snapshot,
          estimatedTokens: snapshot.estimatedTokens || 0,
        },
      });

      // Context change event if there are changes
      const diff = contextManager.getDiffForStep(step.stepId);
      if (diff && diff.totalChanges > 0) {
        events.push({
          id: generateId(),
          type: 'context:change',
          timestamp: snapshot.createdAt.getTime() - baseTime + 1,
          absoluteTime: new Date(snapshot.createdAt.getTime() + 1),
          stepId: step.stepId,
          stepIndex,
          data: {
            changes: diff.changes,
            addedKeys: diff.addedKeys,
            removedKeys: diff.removedKeys,
            changedKeys: diff.changedKeys,
          },
        });
      }
    }

    // AI events
    const aiLogs = aiLogsByStep.get(step.stepId) || [];
    for (const aiLog of aiLogs) {
      // AI prompt event
      events.push({
        id: generateId(),
        type: 'ai:prompt',
        timestamp: aiLog.createdAt.getTime() - baseTime,
        absoluteTime: aiLog.createdAt,
        stepId: step.stepId,
        stepIndex,
        data: {
          systemPrompt: aiLog.systemPrompt,
          userPrompt: aiLog.userPrompt,
          modelId: aiLog.modelId,
          variables: aiLog.promptVariables || {},
        },
      });

      // AI response event
      const responseTime = aiLog.createdAt.getTime() + (aiLog.latencyMs || 0);
      events.push({
        id: generateId(),
        type: 'ai:response',
        timestamp: responseTime - baseTime,
        absoluteTime: new Date(responseTime),
        stepId: step.stepId,
        stepIndex,
        data: {
          response: aiLog.response || '',
          responseParsed: aiLog.responseParsed,
          tokens: {
            input: aiLog.inputTokens || 0,
            output: aiLog.outputTokens || 0,
            total: aiLog.totalTokens || 0,
          },
          latencyMs: aiLog.latencyMs || 0,
          costMicros: aiLog.costMicros || 0,
        },
      });

      // AI decision event (if applicable)
      if (aiLog.selectedOutcome) {
        events.push({
          id: generateId(),
          type: 'ai:decision',
          timestamp: responseTime - baseTime + 1,
          absoluteTime: new Date(responseTime + 1),
          stepId: step.stepId,
          stepIndex,
          data: {
            selectedOutcome: aiLog.selectedOutcome,
            confidence: aiLog.confidence || 0,
            reasoning: aiLog.reasoning || '',
          },
        });
      }

      // Checkpoint events
      if (aiLog.checkpointRequired && aiLog.checkpointId) {
        const checkpoint = details.checkpoints.find(c => c.id === aiLog.checkpointId);
        if (checkpoint) {
          events.push({
            id: generateId(),
            type: 'checkpoint:require',
            timestamp: checkpoint.createdAt.getTime() - baseTime,
            absoluteTime: checkpoint.createdAt,
            stepId: step.stepId,
            stepIndex,
            data: {
              checkpoint,
              riskLevel: checkpoint.riskLevel || 'medium',
              description: checkpoint.description || '',
            },
          });

          if (checkpoint.reviewedAt) {
            events.push({
              id: generateId(),
              type: 'checkpoint:resolve',
              timestamp: checkpoint.reviewedAt.getTime() - baseTime,
              absoluteTime: checkpoint.reviewedAt,
              stepId: step.stepId,
              stepIndex,
              data: {
                checkpoint,
                status: checkpoint.status,
                reviewedBy: checkpoint.reviewedBy,
                reviewNotes: checkpoint.reviewNotes,
              },
            });
          }
        }
      }
    }

    // OS call events
    const osCalls = osCallsByStep.get(step.stepId) || [];
    for (const osCall of osCalls) {
      events.push({
        id: generateId(),
        type: 'os:call',
        timestamp: osCall.createdAt.getTime() - baseTime,
        absoluteTime: osCall.createdAt,
        stepId: step.stepId,
        stepIndex,
        data: {
          endpoint: osCall.endpoint,
          method: osCall.method,
          requestBody: osCall.requestBody || {},
          capability: osCall.osCapability,
        },
      });

      const responseTime = osCall.createdAt.getTime() + (osCall.latencyMs || 0);
      events.push({
        id: generateId(),
        type: 'os:response',
        timestamp: responseTime - baseTime,
        absoluteTime: new Date(responseTime),
        stepId: step.stepId,
        stepIndex,
        data: {
          endpoint: osCall.endpoint,
          responseBody: osCall.responseBody || {},
          responseStatus: osCall.responseStatus || 200,
          latencyMs: osCall.latencyMs || 0,
        },
      });
    }

    // Fallback events
    if (step.fallbackTriggered) {
      events.push({
        id: generateId(),
        type: 'fallback:trigger',
        timestamp: stepBaseTime + (step.durationMs || 0) / 2,
        absoluteTime: new Date(baseTime + stepBaseTime + (step.durationMs || 0) / 2),
        stepId: step.stepId,
        stepIndex,
        data: {
          strategy: step.fallbackStrategy || 'unknown',
          reason: 'Step execution triggered fallback',
        },
      });

      if (step.fallbackStepId) {
        events.push({
          id: generateId(),
          type: 'fallback:execute',
          timestamp: stepBaseTime + (step.durationMs || 0) / 2 + 1,
          absoluteTime: new Date(baseTime + stepBaseTime + (step.durationMs || 0) / 2 + 1),
          stepId: step.stepId,
          stepIndex,
          data: {
            fallbackStepId: step.fallbackStepId,
            success: step.status === 'completed',
          },
        });
      }
    }

    // Error events
    const stepErrors = errorsByStep.get(step.stepId) || [];
    for (const error of stepErrors) {
      events.push({
        id: generateId(),
        type: 'error:occur',
        timestamp: error.createdAt.getTime() - baseTime,
        absoluteTime: error.createdAt,
        stepId: step.stepId,
        stepIndex,
        data: { error },
      });

      if (error.recovered) {
        events.push({
          id: generateId(),
          type: 'error:recover',
          timestamp: error.createdAt.getTime() - baseTime + 1,
          absoluteTime: new Date(error.createdAt.getTime() + 1),
          stepId: step.stepId,
          stepIndex,
          data: {
            error,
            recoveryAction: error.recoveryAction || 'auto-recover',
          },
        });
      }
    }

    // Retry events
    if (step.retryCount > 0 && step.lastRetryAt) {
      events.push({
        id: generateId(),
        type: 'step:retry',
        timestamp: step.lastRetryAt.getTime() - baseTime,
        absoluteTime: step.lastRetryAt,
        stepId: step.stepId,
        stepIndex,
        data: {
          stepName: step.stepName || step.stepId,
          attempt: step.retryCount,
          maxRetries: step.maxRetries,
        },
      });
    }

    // Step completion event
    if (step.completedAt) {
      const eventType: ReplayEventType =
        step.status === 'completed' ? 'step:complete' :
        step.status === 'failed' ? 'step:fail' :
        step.status === 'skipped' ? 'step:skip' :
        'step:complete';

      if (eventType === 'step:complete') {
        events.push({
          id: generateId(),
          type: 'step:complete',
          timestamp: step.completedAt.getTime() - baseTime,
          absoluteTime: step.completedAt,
          stepId: step.stepId,
          stepIndex,
          data: {
            stepName: step.stepName || step.stepId,
            outputData: step.outputData || {},
            durationMs: step.durationMs || 0,
          },
        });
      } else if (eventType === 'step:fail') {
        const error = stepErrors[0];
        events.push({
          id: generateId(),
          type: 'step:fail',
          timestamp: step.completedAt.getTime() - baseTime,
          absoluteTime: step.completedAt,
          stepId: step.stepId,
          stepIndex,
          data: {
            stepName: step.stepName || step.stepId,
            error: error || {
              id: 'unknown',
              runId: details.run.id,
              errorCode: 'UNKNOWN',
              message: 'Step failed',
              retryable: false,
              recovered: false,
              createdAt: step.completedAt,
            },
            retryCount: step.retryCount,
          },
        });
      } else if (eventType === 'step:skip') {
        events.push({
          id: generateId(),
          type: 'step:skip',
          timestamp: step.completedAt.getTime() - baseTime,
          absoluteTime: step.completedAt,
          stepId: step.stepId,
          stepIndex,
          data: {
            stepName: step.stepName || step.stepId,
            reason: step.decisionReason || 'Condition not met',
          },
        });
      }
    }

    // Transition events
    const transitions = transitionsByFrom.get(step.stepId) || [];
    for (const transition of transitions) {
      events.push({
        id: generateId(),
        type: 'transition:evaluate',
        timestamp: transition.evaluatedAt.getTime() - baseTime,
        absoluteTime: transition.evaluatedAt,
        stepId: step.stepId,
        stepIndex,
        data: {
          transition,
          conditionMet: transition.conditionMet,
          reason: transition.evaluationReason,
        },
      });

      if (transition.taken) {
        events.push({
          id: generateId(),
          type: 'transition:take',
          timestamp: transition.evaluatedAt.getTime() - baseTime + 1,
          absoluteTime: new Date(transition.evaluatedAt.getTime() + 1),
          stepId: step.stepId,
          stepIndex,
          data: {
            fromStepId: transition.fromStepId,
            toStepId: transition.toStepId,
            transition,
          },
        });
      }
    }
  }

  // Journey complete/fail event
  if (details.run.endedAt) {
    const isSuccess = details.run.status === 'success';
    if (isSuccess) {
      events.push({
        id: generateId(),
        type: 'journey:complete',
        timestamp: details.run.endedAt.getTime() - baseTime,
        absoluteTime: details.run.endedAt,
        data: {
          status: details.run.status,
          outputData: details.run.outputData || {},
          durationMs: details.run.totalDurationMs || 0,
        },
      });
    } else {
      const lastError = details.errors[details.errors.length - 1];
      events.push({
        id: generateId(),
        type: 'journey:fail',
        timestamp: details.run.endedAt.getTime() - baseTime,
        absoluteTime: details.run.endedAt,
        data: {
          error: lastError || {
            id: 'unknown',
            runId: details.run.id,
            errorCode: 'JOURNEY_FAILED',
            message: 'Journey execution failed',
            retryable: false,
            recovered: false,
            createdAt: details.run.endedAt,
          },
        },
      });
    }
  }

  // Sort events by timestamp
  events.sort((a, b) => a.timestamp - b.timestamp);

  return events;
}

// =============================================================================
// STEP BUILDING
// =============================================================================

function buildReplaySteps(
  details: JourneyRunDetails,
  events: ReplayEvent[],
  baseTime: number
): ReplayStep[] {
  const contextManager = createContextSnapshotManager(details);

  // Index related data
  const aiLogsByStep = groupBy(details.aiLogs, 'stepId');
  const transitionsByFrom = groupBy(details.transitions, 'fromStepId');
  const transitionsByTo = groupBy(details.transitions, 'toStepId');
  const errorsByStep = groupBy(details.errors, 'stepId');

  // Sort steps by execution order
  const sortedSteps = [...details.steps].sort(
    (a, b) => (a.executionOrder || 0) - (b.executionOrder || 0)
  );

  return sortedSteps.map((step, index) => {
    const stepEvents = events.filter(e => e.stepId === step.stepId);
    const aiLogs = aiLogsByStep.get(step.stepId) || [];
    const incomingTransitions = transitionsByTo.get(step.stepId) || [];
    const outgoingTransitions = transitionsByFrom.get(step.stepId) || [];
    const stepErrors = errorsByStep.get(step.stepId) || [];

    // Get context data
    const contextBefore = contextManager.getSnapshotBefore(step.stepId);
    const contextAfter = contextManager.getSnapshotAtStep(step.stepId);
    const contextDiff = contextManager.getDiffForStep(step.stepId);

    // Calculate timing
    const startTime = step.startedAt ? step.startedAt.getTime() - baseTime : 0;
    const endTime = step.completedAt
      ? step.completedAt.getTime() - baseTime
      : startTime + (step.durationMs || 0);

    // Calculate tokens and cost from AI logs
    const tokens = aiLogs.reduce((sum, log) => sum + (log.totalTokens || 0), 0);
    const costMicros = aiLogs.reduce((sum, log) => sum + (log.costMicros || 0), 0);

    return {
      id: `replay-step-${index}`,
      stepId: step.stepId,
      stepName: step.stepName || step.stepId,
      stepType: step.stepType || 'action',
      status: step.status,
      startTime,
      endTime,
      durationMs: step.durationMs || endTime - startTime,
      events: stepEvents,
      aiLog: aiLogs[0], // Primary AI log
      contextBefore: contextBefore || undefined,
      contextAfter: contextAfter || undefined,
      contextDiff: contextDiff?.changes,
      incomingTransitions,
      outgoingTransitions,
      errors: stepErrors,
      fallbackTriggered: step.fallbackTriggered,
      fallbackStrategy: step.fallbackStrategy,
      tokens: tokens > 0 ? tokens : undefined,
      costMicros: costMicros > 0 ? costMicros : undefined,
      originalStep: step,
    };
  });
}

// =============================================================================
// BRANCH BUILDING
// =============================================================================

function buildReplayBranches(transitions: JourneyRunTransition[]): ReplayBranch[] {
  return transitions.map(t => ({
    id: t.id,
    fromStepId: t.fromStepId,
    toStepId: t.toStepId,
    condition: t.evaluationReason,
    taken: t.taken,
  }));
}

// =============================================================================
// METRICS CALCULATION
// =============================================================================

function calculateTimelineMetrics(
  details: JourneyRunDetails,
  steps: ReplayStep[]
): ReplayTimeline['metrics'] {
  const { run, aiLogs, osCalls, checkpoints, errors } = details;

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const failedSteps = steps.filter(s => s.status === 'failed').length;
  const skippedSteps = steps.filter(s => s.status === 'skipped').length;

  const totalTokens = aiLogs.reduce((sum, log) => sum + (log.totalTokens || 0), 0);
  const totalCostMicros = aiLogs.reduce((sum, log) => sum + (log.costMicros || 0), 0);

  const totalFallbacks = steps.filter(s => s.fallbackTriggered).length;
  const totalCheckpoints = checkpoints.length;
  const totalErrors = errors.length;

  const stepDurations = steps.map(s => s.durationMs).filter(d => d > 0);
  const avgStepDurationMs =
    stepDurations.length > 0
      ? stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length
      : 0;

  return {
    totalSteps: steps.length,
    completedSteps,
    failedSteps,
    skippedSteps,
    totalTokens,
    totalCostMicros,
    totalOSCalls: osCalls.length,
    totalFallbacks,
    totalCheckpoints,
    totalErrors,
    avgStepDurationMs: Math.round(avgStepDurationMs),
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function groupBy<T>(items: T[], key: keyof T): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const value = item[key] as unknown as string;
    if (value) {
      const existing = map.get(value) || [];
      existing.push(item);
      map.set(value, existing);
    }
  }
  return map;
}

function calculateDuration(start: Date, end?: Date): number {
  if (!end) return 0;
  return end.getTime() - start.getTime();
}
