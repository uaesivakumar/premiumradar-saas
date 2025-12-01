/**
 * Breakpoint Manager
 * Sprint S53: Journey Debugger
 *
 * Manages breakpoints for journey debugging.
 */
import type {
  Breakpoint,
  BreakpointType,
  BreakpointHit,
  CallStackFrame,
} from './types';
import { generateDebugId, evaluateHitCondition } from './types';

// =============================================================================
// BREAKPOINT MANAGER CLASS
// =============================================================================

export class BreakpointManager {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private journeyId: string;
  private onHit?: (hit: BreakpointHit) => void;

  constructor(journeyId: string, onHit?: (hit: BreakpointHit) => void) {
    this.journeyId = journeyId;
    this.onHit = onHit;
  }

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  /**
   * Add a new breakpoint
   */
  addBreakpoint(config: {
    type: BreakpointType;
    stepId?: string;
    stepIndex?: number;
    condition?: string;
    logMessage?: string;
    contextKey?: string;
    hitCondition?: string;
    enabled?: boolean;
  }): Breakpoint {
    const breakpoint: Breakpoint = {
      id: generateDebugId('bp'),
      journeyId: this.journeyId,
      type: config.type,
      stepId: config.stepId,
      stepIndex: config.stepIndex,
      condition: config.condition,
      logMessage: config.logMessage,
      contextKey: config.contextKey,
      hitCondition: config.hitCondition,
      enabled: config.enabled ?? true,
      hitCount: 0,
      createdAt: new Date(),
    };

    this.breakpoints.set(breakpoint.id, breakpoint);
    return breakpoint;
  }

  /**
   * Add a step breakpoint (break on specific step)
   */
  addStepBreakpoint(stepId: string, stepIndex?: number): Breakpoint {
    return this.addBreakpoint({
      type: 'step',
      stepId,
      stepIndex,
    });
  }

  /**
   * Add a conditional breakpoint
   */
  addConditionalBreakpoint(
    stepId: string,
    condition: string,
    stepIndex?: number
  ): Breakpoint {
    return this.addBreakpoint({
      type: 'conditional',
      stepId,
      stepIndex,
      condition,
    });
  }

  /**
   * Add a logpoint (logs without breaking)
   */
  addLogpoint(
    stepId: string,
    logMessage: string,
    stepIndex?: number
  ): Breakpoint {
    return this.addBreakpoint({
      type: 'logpoint',
      stepId,
      stepIndex,
      logMessage,
    });
  }

  /**
   * Add an error breakpoint
   */
  addErrorBreakpoint(): Breakpoint {
    return this.addBreakpoint({
      type: 'error',
    });
  }

  /**
   * Add a context change breakpoint
   */
  addContextChangeBreakpoint(contextKey: string): Breakpoint {
    return this.addBreakpoint({
      type: 'context_change',
      contextKey,
    });
  }

  /**
   * Remove a breakpoint
   */
  removeBreakpoint(breakpointId: string): boolean {
    return this.breakpoints.delete(breakpointId);
  }

  /**
   * Update a breakpoint
   */
  updateBreakpoint(
    breakpointId: string,
    updates: Partial<Omit<Breakpoint, 'id' | 'journeyId' | 'createdAt'>>
  ): Breakpoint | null {
    const breakpoint = this.breakpoints.get(breakpointId);
    if (!breakpoint) return null;

    const updated = { ...breakpoint, ...updates };
    this.breakpoints.set(breakpointId, updated);
    return updated;
  }

  /**
   * Toggle breakpoint enabled state
   */
  toggleBreakpoint(breakpointId: string): Breakpoint | null {
    const breakpoint = this.breakpoints.get(breakpointId);
    if (!breakpoint) return null;

    return this.updateBreakpoint(breakpointId, { enabled: !breakpoint.enabled });
  }

  /**
   * Get a breakpoint by ID
   */
  getBreakpoint(breakpointId: string): Breakpoint | null {
    return this.breakpoints.get(breakpointId) || null;
  }

  /**
   * Get all breakpoints
   */
  getAllBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Get breakpoints for a specific step
   */
  getBreakpointsForStep(stepId: string): Breakpoint[] {
    return this.getAllBreakpoints().filter(
      (bp) => bp.enabled && (bp.stepId === stepId || bp.type === 'error')
    );
  }

  /**
   * Get enabled breakpoints
   */
  getEnabledBreakpoints(): Breakpoint[] {
    return this.getAllBreakpoints().filter((bp) => bp.enabled);
  }

  /**
   * Clear all breakpoints
   */
  clearAllBreakpoints(): void {
    this.breakpoints.clear();
  }

  /**
   * Reset hit counts
   */
  resetHitCounts(): void {
    for (const breakpoint of this.breakpoints.values()) {
      breakpoint.hitCount = 0;
    }
  }

  // ===========================================================================
  // BREAKPOINT EVALUATION
  // ===========================================================================

  /**
   * Check if any breakpoint should trigger at current step
   */
  shouldBreak(
    frame: CallStackFrame,
    context: Record<string, unknown>,
    error?: Error
  ): BreakpointHit | null {
    const breakpoints = this.getEnabledBreakpoints();

    for (const breakpoint of breakpoints) {
      const hit = this.evaluateBreakpoint(breakpoint, frame, context, error);
      if (hit) {
        // Update hit count
        breakpoint.hitCount++;
        this.breakpoints.set(breakpoint.id, breakpoint);

        // Call hit callback
        if (this.onHit) {
          this.onHit(hit);
        }

        // Logpoints don't actually break
        if (breakpoint.type === 'logpoint') {
          continue;
        }

        return hit;
      }
    }

    return null;
  }

  /**
   * Evaluate a single breakpoint
   */
  private evaluateBreakpoint(
    breakpoint: Breakpoint,
    frame: CallStackFrame,
    context: Record<string, unknown>,
    error?: Error
  ): BreakpointHit | null {
    // Check if breakpoint applies to this step
    if (breakpoint.stepId && breakpoint.stepId !== frame.stepId) {
      return null;
    }

    if (breakpoint.stepIndex !== undefined && breakpoint.stepIndex !== frame.stepIndex) {
      return null;
    }

    // Check breakpoint type
    switch (breakpoint.type) {
      case 'step':
        return this.createHit(breakpoint, frame, context);

      case 'conditional':
        if (breakpoint.condition) {
          const result = this.evaluateCondition(breakpoint.condition, context);
          if (result) {
            return this.createHit(breakpoint, frame, context, true);
          }
        }
        return null;

      case 'logpoint':
        if (breakpoint.logMessage) {
          const output = this.interpolateLogMessage(breakpoint.logMessage, context);
          return this.createHit(breakpoint, frame, context, undefined, output);
        }
        return null;

      case 'error':
        if (error) {
          return this.createHit(breakpoint, frame, context);
        }
        return null;

      case 'context_change':
        // Context change is handled separately in checkContextChange
        return null;

      default:
        return null;
    }
  }

  /**
   * Check for context change breakpoints
   */
  checkContextChange(
    key: string,
    oldValue: unknown,
    newValue: unknown,
    frame: CallStackFrame,
    context: Record<string, unknown>
  ): BreakpointHit | null {
    const breakpoints = this.getEnabledBreakpoints().filter(
      (bp) => bp.type === 'context_change' && bp.contextKey === key
    );

    for (const breakpoint of breakpoints) {
      if (oldValue !== newValue) {
        breakpoint.hitCount++;
        this.breakpoints.set(breakpoint.id, breakpoint);

        const hit = this.createHit(breakpoint, frame, context);

        if (hit && this.onHit) {
          this.onHit(hit);
        }

        return hit;
      }
    }

    return null;
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    context: Record<string, unknown>
  ): boolean {
    try {
      // Create a safe evaluation function
      // In production, use a proper expression parser
      const keys = Object.keys(context);
      const values = Object.values(context);

      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `return (${condition})`);
      return Boolean(fn(...values));
    } catch {
      return false;
    }
  }

  /**
   * Interpolate log message with context values
   */
  private interpolateLogMessage(
    message: string,
    context: Record<string, unknown>
  ): string {
    return message.replace(/\{(\w+)\}/g, (_, key) => {
      const value = context[key];
      if (value === undefined) return `{${key}}`;
      return String(value);
    });
  }

  /**
   * Create a breakpoint hit object
   */
  private createHit(
    breakpoint: Breakpoint,
    frame: CallStackFrame,
    context: Record<string, unknown>,
    conditionResult?: boolean,
    logOutput?: string
  ): BreakpointHit | null {
    // Check hit condition
    const nextHitCount = breakpoint.hitCount + 1;
    if (breakpoint.hitCondition && !evaluateHitCondition(nextHitCount, breakpoint.hitCondition)) {
      return null;
    }

    return {
      breakpointId: breakpoint.id,
      stepId: frame.stepId,
      stepIndex: frame.stepIndex,
      hitCount: nextHitCount,
      timestamp: new Date(),
      context: { ...context },
      conditionResult,
      logOutput,
    };
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Export breakpoints to JSON
   */
  toJSON(): Breakpoint[] {
    return this.getAllBreakpoints();
  }

  /**
   * Import breakpoints from JSON
   */
  fromJSON(breakpoints: Breakpoint[]): void {
    this.clearAllBreakpoints();
    for (const bp of breakpoints) {
      this.breakpoints.set(bp.id, {
        ...bp,
        createdAt: new Date(bp.createdAt),
      });
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createBreakpointManager(
  journeyId: string,
  onHit?: (hit: BreakpointHit) => void
): BreakpointManager {
  return new BreakpointManager(journeyId, onHit);
}
