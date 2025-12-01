/**
 * Journey Engine State Machine
 * Sprint S48: Journey State Graph Definition
 *
 * Core state machine for journey execution:
 * - Graph construction from definition
 * - State transitions
 * - Execution lifecycle
 */
import type {
  JourneyDefinition,
  StepNode,
  Transition,
} from '../journey-builder/types';
import type {
  StateGraph,
  StateNode,
  StateEdge,
  ExecutionContext,
  ExecutionData,
  ExecutionStatus,
  StepExecutionStatus,
  StepResult,
  StepHandler,
  StepHandlerEntry,
  JourneyEvent,
  JourneyEventHandler,
  JourneyEngineOptions,
  PersistenceAdapter,
  TransitionEvaluation,
} from './types';
import { JourneyError } from './types';
import { evaluateCondition } from './transitions';
import { checkPreconditions } from './preconditions';
import { handleStepError } from './error-handling';

// =============================================================================
// STATE MACHINE
// =============================================================================

// Internal resolved options type
interface ResolvedOptions {
  maxConcurrentSteps: number;
  defaultStepTimeoutMs: number;
  defaultRetryConfig: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  persistenceEnabled: boolean;
  persistenceAdapter: PersistenceAdapter | null;
  eventHandlers: JourneyEventHandler[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class JourneyStateMachine {
  private definition: JourneyDefinition;
  private context: ExecutionContext;
  private handlers: Map<string, StepHandlerEntry> = new Map();
  private eventHandlers: JourneyEventHandler[] = [];
  private persistence: PersistenceAdapter | null = null;
  private options: ResolvedOptions;

  constructor(
    definition: JourneyDefinition,
    options: JourneyEngineOptions = {}
  ) {
    this.definition = definition;
    this.options = {
      maxConcurrentSteps: options.maxConcurrentSteps ?? 1,
      defaultStepTimeoutMs: options.defaultStepTimeoutMs ?? 30000,
      defaultRetryConfig: options.defaultRetryConfig ?? {
        maxRetries: 3,
        backoffMs: 1000,
        backoffMultiplier: 2,
      },
      persistenceEnabled: options.persistenceEnabled ?? true,
      persistenceAdapter: options.persistenceAdapter ?? null,
      eventHandlers: options.eventHandlers ?? [],
      logLevel: options.logLevel ?? 'info',
    };

    this.eventHandlers = this.options.eventHandlers;
    this.persistence = this.options.persistenceAdapter;
    this.context = this.createInitialContext();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Create initial execution context from definition
   */
  private createInitialContext(): ExecutionContext {
    const graph = this.buildStateGraph();
    const now = new Date();

    return {
      instanceId: crypto.randomUUID(),
      journeyId: this.definition.id,
      version: this.definition.version,
      status: 'idle',
      graph,
      data: {
        input: {},
        stepOutputs: {},
        variables: {},
      },
      createdAt: now,
      lastUpdatedAt: now,
      metadata: {},
      tags: [],
    };
  }

  /**
   * Build state graph from journey definition
   */
  private buildStateGraph(): StateGraph {
    const nodes: StateNode[] = this.definition.steps.map((step) => ({
      id: crypto.randomUUID(),
      stepId: step.id,
      status: 'pending',
      retryCount: 0,
      maxRetries: this.options.defaultRetryConfig.maxRetries,
      metadata: {},
    }));

    // Create a map from stepId to nodeId
    const stepToNode = new Map<string, string>();
    nodes.forEach((node) => {
      stepToNode.set(node.stepId, node.id);
    });

    const edges: StateEdge[] = this.definition.transitions.map((transition) => ({
      id: crypto.randomUUID(),
      transitionId: transition.id,
      fromNodeId: stepToNode.get(transition.fromStepId) || '',
      toNodeId: stepToNode.get(transition.toStepId) || '',
      evaluated: false,
      taken: false,
    }));

    // Find start node
    const startStep = this.definition.steps.find((s) => s.isStart);
    const startNodeId = startStep ? stepToNode.get(startStep.id) : nodes[0]?.id;

    // Find end nodes
    const endNodeIds = this.definition.steps
      .filter((s) => s.isEnd)
      .map((s) => stepToNode.get(s.id))
      .filter((id): id is string => id !== undefined);

    return {
      nodes,
      edges,
      currentNodeIds: [],
      startNodeId,
      endNodeIds,
    };
  }

  // ===========================================================================
  // HANDLER REGISTRATION
  // ===========================================================================

  /**
   * Register a step handler
   */
  registerHandler(entry: StepHandlerEntry): void {
    this.handlers.set(entry.type, entry);
  }

  /**
   * Register multiple handlers
   */
  registerHandlers(entries: StepHandlerEntry[]): void {
    entries.forEach((entry) => this.registerHandler(entry));
  }

  /**
   * Get handler for step type
   */
  private getHandler(stepType: string): StepHandlerEntry | undefined {
    return this.handlers.get(stepType);
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Start journey execution
   */
  async start(input: Record<string, unknown> = {}): Promise<ExecutionContext> {
    if (this.context.status !== 'idle') {
      throw new JourneyError(
        'INVALID_STATE',
        `Cannot start journey in ${this.context.status} state`
      );
    }

    const now = new Date();
    this.context.status = 'running';
    this.context.startedAt = now;
    this.context.lastUpdatedAt = now;
    this.context.data.input = input;

    // Set start node as current
    if (this.context.graph.startNodeId) {
      this.context.graph.currentNodeIds = [this.context.graph.startNodeId];
    }

    await this.emit({
      type: 'journey:started',
      instanceId: this.context.instanceId,
      journeyId: this.definition.id,
      timestamp: now,
    });

    await this.saveState();

    // Begin execution
    await this.executeCurrentNodes();

    return this.context;
  }

  /**
   * Resume a paused journey
   */
  async resume(): Promise<ExecutionContext> {
    if (this.context.status !== 'paused') {
      throw new JourneyError(
        'INVALID_STATE',
        `Cannot resume journey in ${this.context.status} state`
      );
    }

    this.context.status = 'running';
    this.context.pausedAt = undefined;
    this.context.pauseReason = undefined;
    this.context.lastUpdatedAt = new Date();

    await this.emit({
      type: 'journey:resumed',
      instanceId: this.context.instanceId,
      timestamp: new Date(),
    });

    await this.saveState();
    await this.executeCurrentNodes();

    return this.context;
  }

  /**
   * Pause journey execution
   */
  async pause(reason: string): Promise<ExecutionContext> {
    if (this.context.status !== 'running' && this.context.status !== 'waiting') {
      throw new JourneyError(
        'INVALID_STATE',
        `Cannot pause journey in ${this.context.status} state`
      );
    }

    this.context.status = 'paused';
    this.context.pausedAt = new Date();
    this.context.pauseReason = reason;
    this.context.lastUpdatedAt = new Date();

    await this.emit({
      type: 'journey:paused',
      instanceId: this.context.instanceId,
      reason,
      timestamp: new Date(),
    });

    await this.saveState();

    return this.context;
  }

  /**
   * Cancel journey execution
   */
  async cancel(): Promise<ExecutionContext> {
    if (this.context.status === 'completed' || this.context.status === 'cancelled') {
      throw new JourneyError(
        'INVALID_STATE',
        `Cannot cancel journey in ${this.context.status} state`
      );
    }

    this.context.status = 'cancelled';
    this.context.completedAt = new Date();
    this.context.lastUpdatedAt = new Date();

    await this.emit({
      type: 'journey:cancelled',
      instanceId: this.context.instanceId,
      timestamp: new Date(),
    });

    await this.saveState();

    return this.context;
  }

  // ===========================================================================
  // EXECUTION
  // ===========================================================================

  /**
   * Execute all current nodes
   */
  private async executeCurrentNodes(): Promise<void> {
    while (
      this.context.status === 'running' &&
      this.context.graph.currentNodeIds.length > 0
    ) {
      // Get nodes to execute
      const nodesToExecute = this.context.graph.currentNodeIds.slice(
        0,
        this.options.maxConcurrentSteps
      );

      // Execute in parallel if multiple
      const results = await Promise.allSettled(
        nodesToExecute.map((nodeId) => this.executeNode(nodeId))
      );

      // Check for failures
      const failures = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected'
      );

      if (failures.length > 0 && this.context.status === 'running') {
        // Handle first failure
        const error = failures[0].reason as JourneyError;
        await this.handleJourneyError(error);
        break;
      }

      // Advance to next nodes
      if (this.context.status === 'running') {
        await this.advanceGraph();
      }
    }

    // Check if journey is complete
    if (
      this.context.status === 'running' &&
      this.context.graph.currentNodeIds.length === 0
    ) {
      await this.complete();
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(nodeId: string): Promise<StepResult> {
    const node = this.context.graph.nodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new JourneyError('STATE_NOT_FOUND', `Node ${nodeId} not found`);
    }

    const step = this.definition.steps.find((s) => s.id === node.stepId);
    if (!step) {
      throw new JourneyError('INVALID_DEFINITION', `Step ${node.stepId} not found in definition`);
    }

    const handlerEntry = this.getHandler(step.type);
    if (!handlerEntry) {
      throw new JourneyError('HANDLER_NOT_FOUND', `No handler registered for step type: ${step.type}`);
    }

    // Check preconditions
    if (handlerEntry.preconditions) {
      const preconditionResult = await checkPreconditions(
        handlerEntry.preconditions,
        step,
        this.context,
        this.context.data
      );

      for (const result of preconditionResult) {
        await this.emit({
          type: 'precondition:checked',
          instanceId: this.context.instanceId,
          stepId: step.id,
          precondition: result,
          timestamp: new Date(),
        });

        if (!result.passed) {
          if (result.failureAction === 'skip') {
            return this.skipStep(node, step, result.failureMessage || 'Precondition failed');
          } else if (result.failureAction === 'fail') {
            throw new JourneyError(
              'PRECONDITION_FAILED',
              result.failureMessage || `Precondition ${result.name} failed`,
              { preconditionId: result.id }
            );
          } else if (result.failureAction === 'wait') {
            this.context.status = 'waiting';
            return {
              stepId: step.id,
              status: 'waiting',
              startedAt: new Date(),
              completedAt: new Date(),
              durationMs: 0,
              logs: [],
            };
          }
        }
      }
    }

    // Update node status
    const startedAt = new Date();
    node.status = 'running';
    node.startedAt = startedAt;

    await this.emit({
      type: 'step:started',
      instanceId: this.context.instanceId,
      stepId: step.id,
      timestamp: startedAt,
    });

    await this.saveState();

    try {
      // Execute with timeout
      const timeout = handlerEntry.timeout ?? this.options.defaultStepTimeoutMs;
      const result = await this.executeWithTimeout(
        handlerEntry.handler(step, this.context, this.context.data),
        timeout
      );

      // Update node
      const completedAt = new Date();
      node.status = result.status as StepExecutionStatus;
      node.completedAt = completedAt;
      node.result = result.output;

      // Store output
      this.context.data.stepOutputs[step.id] = result.output;

      await this.emit({
        type: 'step:completed',
        instanceId: this.context.instanceId,
        stepId: step.id,
        result,
        timestamp: completedAt,
      });

      await this.saveState();

      return result;
    } catch (error) {
      return await this.handleStepFailure(node, step, handlerEntry, error as Error);
    }
  }

  /**
   * Skip a step
   */
  private async skipStep(
    node: StateNode,
    step: StepNode,
    reason: string
  ): Promise<StepResult> {
    node.status = 'skipped';
    node.completedAt = new Date();

    await this.emit({
      type: 'step:skipped',
      instanceId: this.context.instanceId,
      stepId: step.id,
      reason,
      timestamp: new Date(),
    });

    await this.saveState();

    return {
      stepId: step.id,
      status: 'skipped',
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
      logs: [{ level: 'info', message: `Step skipped: ${reason}`, timestamp: new Date() }],
    };
  }

  /**
   * Handle step failure
   */
  private async handleStepFailure(
    node: StateNode,
    step: StepNode,
    handlerEntry: StepHandlerEntry,
    error: Error
  ): Promise<StepResult> {
    const journeyError =
      error instanceof JourneyError
        ? error
        : new JourneyError('STEP_FAILED', error.message, { originalError: error.name });

    // Check if we should retry
    const retryConfig = handlerEntry.retryConfig ?? this.options.defaultRetryConfig;
    if (node.retryCount < retryConfig.maxRetries && journeyError.retryable !== false) {
      node.retryCount++;
      node.lastRetryAt = new Date();

      await this.emit({
        type: 'step:retrying',
        instanceId: this.context.instanceId,
        stepId: step.id,
        attempt: node.retryCount,
        timestamp: new Date(),
      });

      // Wait with backoff
      const delay =
        retryConfig.backoffMs * Math.pow(retryConfig.backoffMultiplier, node.retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry execution
      return this.executeNode(node.id);
    }

    // No more retries - handle error
    node.status = 'failed';
    node.completedAt = new Date();
    node.error = {
      code: journeyError.code,
      message: journeyError.message,
      details: journeyError.details,
    };

    const result = await handleStepError(journeyError, step, this.context, node);

    await this.emit({
      type: 'step:failed',
      instanceId: this.context.instanceId,
      stepId: step.id,
      error: journeyError,
      timestamp: new Date(),
    });

    await this.saveState();

    // Check fallback strategy
    if (result.fallbackStrategy) {
      await this.emit({
        type: 'fallback:triggered',
        instanceId: this.context.instanceId,
        stepId: step.id,
        strategy: result.fallbackStrategy,
        timestamp: new Date(),
      });

      if (result.fallbackStrategy === 'skip') {
        return this.skipStep(node, step, `Fallback: ${journeyError.message}`);
      }
    }

    throw journeyError;
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new JourneyError('STEP_TIMEOUT', 'Step execution timed out')), timeoutMs)
      ),
    ]);
  }

  // ===========================================================================
  // GRAPH TRAVERSAL
  // ===========================================================================

  /**
   * Advance the graph to next nodes
   */
  private async advanceGraph(): Promise<void> {
    const nextNodeIds: string[] = [];

    for (const currentNodeId of this.context.graph.currentNodeIds) {
      const currentNode = this.context.graph.nodes.find((n) => n.id === currentNodeId);
      if (!currentNode || currentNode.status !== 'completed') continue;

      // Find outgoing edges
      const outgoingEdges = this.context.graph.edges.filter(
        (e) => e.fromNodeId === currentNodeId
      );

      // Evaluate transitions
      for (const edge of outgoingEdges) {
        const transition = this.definition.transitions.find(
          (t) => t.id === edge.transitionId
        );
        if (!transition) continue;

        const evaluation = await this.evaluateTransition(transition, edge);

        await this.emit({
          type: 'transition:evaluated',
          instanceId: this.context.instanceId,
          evaluation,
          timestamp: new Date(),
        });

        if (evaluation.result) {
          edge.taken = true;
          edge.conditionMet = true;
          edge.evaluatedAt = evaluation.evaluatedAt;
          nextNodeIds.push(edge.toNodeId);
        }

        edge.evaluated = true;
      }
    }

    // Update current nodes
    this.context.graph.currentNodeIds = Array.from(new Set(nextNodeIds));
    this.context.lastUpdatedAt = new Date();

    await this.saveState();
  }

  /**
   * Evaluate a transition
   */
  private async evaluateTransition(
    transition: Transition,
    edge: StateEdge
  ): Promise<TransitionEvaluation> {
    const fromNode = this.context.graph.nodes.find((n) => n.id === edge.fromNodeId);
    const toNode = this.context.graph.nodes.find((n) => n.id === edge.toNodeId);

    if (!fromNode || !toNode) {
      return {
        transitionId: transition.id,
        fromStepId: transition.fromStepId,
        toStepId: transition.toStepId,
        result: false,
        reason: 'Invalid node reference',
        evaluatedAt: new Date(),
      };
    }

    // If no condition, transition always passes
    if (!transition.condition) {
      return {
        transitionId: transition.id,
        fromStepId: transition.fromStepId,
        toStepId: transition.toStepId,
        result: true,
        reason: 'No condition (always true)',
        evaluatedAt: new Date(),
      };
    }

    // Evaluate condition
    const result = await evaluateCondition(
      transition.condition,
      this.context.data,
      fromNode.result
    );

    return {
      transitionId: transition.id,
      fromStepId: transition.fromStepId,
      toStepId: transition.toStepId,
      condition: transition.condition,
      result,
      reason: result ? 'Condition met' : 'Condition not met',
      evaluatedAt: new Date(),
    };
  }

  // ===========================================================================
  // COMPLETION
  // ===========================================================================

  /**
   * Mark journey as complete
   */
  private async complete(): Promise<void> {
    this.context.status = 'completed';
    this.context.completedAt = new Date();
    this.context.lastUpdatedAt = new Date();

    await this.emit({
      type: 'journey:completed',
      instanceId: this.context.instanceId,
      status: 'completed',
      timestamp: new Date(),
    });

    await this.saveState();
  }

  /**
   * Handle journey-level error
   */
  private async handleJourneyError(error: JourneyError): Promise<void> {
    this.context.status = 'failed';
    this.context.completedAt = new Date();
    this.context.lastUpdatedAt = new Date();

    await this.emit({
      type: 'journey:failed',
      instanceId: this.context.instanceId,
      error,
      timestamp: new Date(),
    });

    await this.saveState();
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Get current context
   */
  getContext(): ExecutionContext {
    return { ...this.context };
  }

  /**
   * Get current status
   */
  getStatus(): ExecutionStatus {
    return this.context.status;
  }

  /**
   * Get state graph
   */
  getGraph(): StateGraph {
    return { ...this.context.graph };
  }

  /**
   * Set context from loaded state
   */
  setContext(context: ExecutionContext): void {
    this.context = context;
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  /**
   * Save current state
   */
  private async saveState(): Promise<void> {
    if (!this.persistence || !this.options.persistenceEnabled) return;

    await this.persistence.saveCheckpoint(this.context.instanceId, this.context);
  }

  /**
   * Load state from persistence
   */
  async loadState(instanceId: string): Promise<boolean> {
    if (!this.persistence) return false;

    const checkpoint = await this.persistence.loadCheckpoint(instanceId);
    if (!checkpoint) return false;

    this.context = checkpoint;
    return true;
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  /**
   * Emit an event
   */
  private async emit(event: JourneyEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    }
  }

  /**
   * Add event handler
   */
  addEventListener(handler: JourneyEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Remove event handler
   */
  removeEventListener(handler: JourneyEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a new journey state machine
 */
export function createJourneyEngine(
  definition: JourneyDefinition,
  options?: JourneyEngineOptions
): JourneyStateMachine {
  return new JourneyStateMachine(definition, options);
}
