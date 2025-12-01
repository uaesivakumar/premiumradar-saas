/**
 * Debugger Engine
 * Sprint S53: Journey Debugger
 *
 * Main debug session management for journey debugging.
 */
import type {
  DebugSession,
  DebugSessionConfig,
  DebugSessionStatus,
  DebugCallbacks,
  DebugEvent,
  CallStackFrame,
  StepAction,
  BreakpointHit,
  WatchEvaluation,
} from './types';
import {
  generateDebugId,
  DEFAULT_DEBUG_CONFIG,
} from './types';
import { BreakpointManager, createBreakpointManager } from './breakpoint-manager';
import { WatchEvaluator, createWatchEvaluator } from './watch-evaluator';
import type { JourneyRunStep, JourneyRunDetails } from '@/lib/journey-runs';

// =============================================================================
// DEBUGGER ENGINE CLASS
// =============================================================================

export class DebuggerEngine {
  private session: DebugSession | null = null;
  private config: DebugSessionConfig;
  private callbacks: DebugCallbacks;
  private breakpointManager: BreakpointManager | null = null;
  private watchEvaluator: WatchEvaluator | null = null;
  private events: DebugEvent[] = [];
  private steps: JourneyRunStep[] = [];
  private pendingAction: StepAction | null = null;

  constructor(
    config: Partial<DebugSessionConfig> = {},
    callbacks: DebugCallbacks = {}
  ) {
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  // ===========================================================================
  // SESSION LIFECYCLE
  // ===========================================================================

  /**
   * Start a new debug session
   */
  startSession(
    journeyId: string,
    steps: JourneyRunStep[],
    initialContext: Record<string, unknown> = {}
  ): DebugSession {
    // Clean up any existing session
    if (this.session) {
      this.stopSession();
    }

    const sessionId = generateDebugId('session');

    // Initialize managers
    this.breakpointManager = createBreakpointManager(
      journeyId,
      this.handleBreakpointHit.bind(this)
    );
    this.watchEvaluator = createWatchEvaluator(
      this.handleWatchUpdate.bind(this)
    );

    this.steps = steps;
    this.events = [];

    this.session = {
      id: sessionId,
      journeyId,
      status: 'starting',
      currentStepId: null,
      currentStepIndex: -1,
      callStack: [],
      breakpoints: [],
      watchExpressions: [],
      context: { ...initialContext },
      startedAt: new Date(),
    };

    this.emitEvent('session_started');

    // Handle pause on start
    if (this.config.pauseOnStart && steps.length > 0) {
      this.session.status = 'paused';
      this.session.currentStepIndex = 0;
      this.session.currentStepId = steps[0]?.id || null;
      this.session.pausedAt = new Date();
      this.emitEvent('session_paused');
    } else {
      this.session.status = 'running';
    }

    this.callbacks.onSessionStart?.(this.session);
    return this.session;
  }

  /**
   * Load debug session from run details (for replay debugging)
   */
  loadFromRunDetails(runDetails: JourneyRunDetails): DebugSession {
    return this.startSession(
      runDetails.run.journeyId,
      runDetails.steps,
      {} // Context will be populated from snapshots
    );
  }

  /**
   * Stop the debug session
   */
  stopSession(): void {
    if (!this.session) return;

    this.session.status = 'completed';
    this.emitEvent('session_completed');
    this.callbacks.onSessionComplete?.(this.session);

    // Cleanup
    this.breakpointManager = null;
    this.watchEvaluator = null;
    this.steps = [];
    this.session = null;
  }

  /**
   * Get current session
   */
  getSession(): DebugSession | null {
    return this.session;
  }

  /**
   * Get all events
   */
  getEvents(): DebugEvent[] {
    return [...this.events];
  }

  // ===========================================================================
  // STEP EXECUTION CONTROL
  // ===========================================================================

  /**
   * Continue execution
   */
  continue(): void {
    if (!this.session || this.session.status !== 'paused') return;

    this.session.status = 'running';
    this.pendingAction = 'continue';
    this.emitEvent('session_resumed');
    this.callbacks.onSessionResume?.(this.session);

    // Execute next step
    this.executeNextStep();
  }

  /**
   * Step over (execute current step, stop at next)
   */
  stepOver(): void {
    if (!this.session || this.session.status !== 'paused') return;

    this.session.status = 'stepping';
    this.pendingAction = 'step_over';

    this.executeCurrentStep();
  }

  /**
   * Step into (enter sub-journey if applicable)
   */
  stepInto(): void {
    if (!this.session || this.session.status !== 'paused') return;

    this.session.status = 'stepping';
    this.pendingAction = 'step_into';

    this.executeCurrentStep();
  }

  /**
   * Step out (complete current level, stop at parent)
   */
  stepOut(): void {
    if (!this.session || this.session.status !== 'paused') return;

    this.session.status = 'stepping';
    this.pendingAction = 'step_out';

    // Execute until we return to parent depth
    const currentDepth = this.getCurrentFrame()?.depth || 0;
    this.executeUntilDepth(currentDepth - 1);
  }

  /**
   * Restart the session
   */
  restart(): void {
    if (!this.session) return;

    const journeyId = this.session.journeyId;
    const steps = [...this.steps];
    const breakpoints = this.breakpointManager?.toJSON() || [];
    const watchExprs = this.watchEvaluator?.toJSON() || [];

    this.stopSession();
    const newSession = this.startSession(journeyId, steps, {});

    // Restore breakpoints and watches
    if (this.breakpointManager) {
      this.breakpointManager.fromJSON(breakpoints);
    }
    if (this.watchEvaluator) {
      this.watchEvaluator.fromJSON(watchExprs);
    }
  }

  /**
   * Pause execution
   */
  pause(): void {
    if (!this.session || this.session.status !== 'running') return;

    this.session.status = 'paused';
    this.session.pausedAt = new Date();
    this.emitEvent('session_paused');
    this.callbacks.onSessionPause?.(this.session, 'user_request');
  }

  // ===========================================================================
  // STEP EXECUTION (SIMULATED)
  // ===========================================================================

  /**
   * Execute the current step (simulated for debugging)
   */
  private executeCurrentStep(): void {
    if (!this.session) return;

    const stepIndex = this.session.currentStepIndex;
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      this.completeSession();
      return;
    }

    const step = this.steps[stepIndex];

    // Create call stack frame
    const frame = this.createFrame(step, stepIndex);
    this.session.callStack.push(frame);
    this.emitEvent('step_started', { stepId: step.id, stepIndex });
    this.callbacks.onStepStart?.(frame);

    // Check breakpoints
    if (this.breakpointManager) {
      const hit = this.breakpointManager.shouldBreak(frame, this.session.context);
      if (hit && this.pendingAction === 'continue') {
        this.pauseAtBreakpoint(hit);
        return;
      }
    }

    // Simulate step execution (in real debug, this would be actual execution)
    this.simulateStepExecution(step, frame);
  }

  /**
   * Execute next step
   */
  private executeNextStep(): void {
    if (!this.session) return;

    this.session.currentStepIndex++;

    if (this.session.currentStepIndex >= this.steps.length) {
      this.completeSession();
      return;
    }

    const step = this.steps[this.session.currentStepIndex];
    this.session.currentStepId = step.id;

    if (this.pendingAction === 'step_over') {
      // Pause at next step
      this.session.status = 'paused';
      this.session.pausedAt = new Date();
      this.pendingAction = null;
      this.emitEvent('session_paused');
      this.callbacks.onSessionPause?.(this.session, 'step_over');
      return;
    }

    this.executeCurrentStep();
  }

  /**
   * Execute until we reach target depth
   */
  private executeUntilDepth(targetDepth: number): void {
    if (!this.session) return;

    // For now, just step over since we don't have nested journeys
    this.executeCurrentStep();

    // After step completes, pause
    this.session.status = 'paused';
    this.session.pausedAt = new Date();
    this.pendingAction = null;
    this.emitEvent('session_paused');
    this.callbacks.onSessionPause?.(this.session, 'step_out');
  }

  /**
   * Simulate step execution
   */
  private simulateStepExecution(step: JourneyRunStep, frame: CallStackFrame): void {
    // Simulate processing time
    setTimeout(() => {
      if (!this.session) return;

      // Complete the frame
      frame.status = 'completed';
      frame.endedAt = new Date();
      this.emitEvent('step_completed', { stepId: step.id, stepIndex: frame.stepIndex });
      this.callbacks.onStepComplete?.(frame);

      // Evaluate watch expressions
      if (this.watchEvaluator) {
        this.watchEvaluator.evaluateAll(this.session.context);
      }

      // Continue to next step
      if (this.session.status === 'running' || this.session.status === 'stepping') {
        this.executeNextStep();
      }
    }, 10); // Small delay for UI updates
  }

  /**
   * Pause at a breakpoint
   */
  private pauseAtBreakpoint(hit: BreakpointHit): void {
    if (!this.session) return;

    this.session.status = 'paused';
    this.session.pausedAt = new Date();
    this.pendingAction = null;
    this.emitEvent('breakpoint_hit', { breakpointId: hit.breakpointId });
    this.callbacks.onSessionPause?.(this.session, 'breakpoint');
  }

  /**
   * Complete the session
   */
  private completeSession(): void {
    if (!this.session) return;

    this.session.status = 'completed';
    this.emitEvent('session_completed');
    this.callbacks.onSessionComplete?.(this.session);
  }

  /**
   * Create a call stack frame
   */
  private createFrame(step: JourneyRunStep, stepIndex: number): CallStackFrame {
    const parentFrame = this.getCurrentFrame();

    return {
      id: generateDebugId('frame'),
      stepId: step.stepId || step.id,
      stepIndex,
      stepType: step.stepType || 'unknown',
      stepName: step.stepName || `Step ${stepIndex}`,
      startedAt: new Date(),
      status: 'running',
      context: { ...this.session!.context },
      parentFrameId: parentFrame?.id,
      depth: (parentFrame?.depth || 0) + 1,
    };
  }

  /**
   * Get current call stack frame
   */
  private getCurrentFrame(): CallStackFrame | null {
    if (!this.session || this.session.callStack.length === 0) return null;
    return this.session.callStack[this.session.callStack.length - 1];
  }

  // ===========================================================================
  // CONTEXT MANAGEMENT
  // ===========================================================================

  /**
   * Update context value
   */
  updateContext(key: string, value: unknown): void {
    if (!this.session) return;

    const oldValue = this.session.context[key];
    this.session.context[key] = value;

    this.emitEvent('context_changed', { key, oldValue, newValue: value });
    this.callbacks.onContextChange?.(key, oldValue, value);

    // Check context change breakpoints
    if (this.breakpointManager) {
      const frame = this.getCurrentFrame();
      if (frame) {
        const hit = this.breakpointManager.checkContextChange(
          key,
          oldValue,
          value,
          frame,
          this.session.context
        );
        if (hit && this.session.status === 'running') {
          this.pauseAtBreakpoint(hit);
        }
      }
    }

    // Re-evaluate watches
    if (this.watchEvaluator) {
      this.watchEvaluator.evaluateAll(this.session.context);
    }
  }

  /**
   * Get current context
   */
  getContext(): Record<string, unknown> {
    return this.session ? { ...this.session.context } : {};
  }

  // ===========================================================================
  // BREAKPOINT MANAGEMENT (DELEGATED)
  // ===========================================================================

  /**
   * Get breakpoint manager
   */
  getBreakpointManager(): BreakpointManager | null {
    return this.breakpointManager;
  }

  // ===========================================================================
  // WATCH EXPRESSION MANAGEMENT (DELEGATED)
  // ===========================================================================

  /**
   * Get watch evaluator
   */
  getWatchEvaluator(): WatchEvaluator | null {
    return this.watchEvaluator;
  }

  /**
   * Evaluate an expression
   */
  evaluateExpression(expression: string): WatchEvaluation | null {
    if (!this.session || !this.watchEvaluator) return null;
    return this.watchEvaluator.evaluateSingle(expression, this.session.context);
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  /**
   * Emit a debug event
   */
  private emitEvent(
    type: DebugEvent['type'],
    data?: Record<string, unknown>
  ): void {
    if (!this.session) return;

    const event: DebugEvent = {
      type,
      sessionId: this.session.id,
      timestamp: new Date(),
      stepId: this.session.currentStepId || undefined,
      stepIndex: this.session.currentStepIndex >= 0 ? this.session.currentStepIndex : undefined,
      data,
    };

    this.events.push(event);
  }

  /**
   * Handle breakpoint hit callback
   */
  private handleBreakpointHit(hit: BreakpointHit): void {
    this.callbacks.onBreakpointHit?.(hit);
  }

  /**
   * Handle watch update callback
   */
  private handleWatchUpdate(evaluation: WatchEvaluation): void {
    this.callbacks.onWatchUpdate?.(evaluation);
  }

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  /**
   * Jump to a specific step (for debugging)
   */
  jumpToStep(stepIndex: number): void {
    if (!this.session) return;

    if (stepIndex < 0 || stepIndex >= this.steps.length) return;

    this.session.currentStepIndex = stepIndex;
    this.session.currentStepId = this.steps[stepIndex].id;
    this.session.status = 'paused';
    this.session.pausedAt = new Date();

    this.emitEvent('session_paused');
    this.callbacks.onSessionPause?.(this.session, 'jump');
  }

  /**
   * Get step at index
   */
  getStepAt(index: number): JourneyRunStep | null {
    if (index < 0 || index >= this.steps.length) return null;
    return this.steps[index];
  }

  /**
   * Get all steps
   */
  getSteps(): JourneyRunStep[] {
    return [...this.steps];
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createDebuggerEngine(
  config?: Partial<DebugSessionConfig>,
  callbacks?: DebugCallbacks
): DebuggerEngine {
  return new DebuggerEngine(config, callbacks);
}
