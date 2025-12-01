/**
 * Journey Debugger Types
 * Sprint S53: Journey Debugger
 *
 * Type definitions for debugging journey executions.
 */

// =============================================================================
// DEBUG SESSION TYPES
// =============================================================================

export type DebugSessionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stepping'
  | 'completed'
  | 'error';

export type StepAction = 'continue' | 'step_over' | 'step_into' | 'step_out' | 'restart' | 'stop';

export interface DebugSession {
  id: string;
  journeyId: string;
  runId?: string;
  status: DebugSessionStatus;
  currentStepId: string | null;
  currentStepIndex: number;
  callStack: CallStackFrame[];
  breakpoints: Breakpoint[];
  watchExpressions: WatchExpression[];
  context: Record<string, unknown>;
  startedAt: Date;
  pausedAt?: Date;
  error?: string;
}

export interface DebugSessionConfig {
  /** Automatically pause on first step */
  pauseOnStart: boolean;
  /** Pause on uncaught errors */
  pauseOnError: boolean;
  /** Pause on caught errors */
  pauseOnCaughtError: boolean;
  /** Maximum call stack depth before warning */
  maxCallStackDepth: number;
  /** Enable verbose logging */
  verbose: boolean;
}

export const DEFAULT_DEBUG_CONFIG: DebugSessionConfig = {
  pauseOnStart: true,
  pauseOnError: true,
  pauseOnCaughtError: false,
  maxCallStackDepth: 100,
  verbose: false,
};

// =============================================================================
// BREAKPOINT TYPES
// =============================================================================

export type BreakpointType =
  | 'step'           // Break on specific step
  | 'conditional'    // Break when condition is true
  | 'logpoint'       // Log message without breaking
  | 'error'          // Break on errors
  | 'context_change' // Break when context key changes

export interface Breakpoint {
  id: string;
  journeyId: string;
  type: BreakpointType;
  stepId?: string;
  stepIndex?: number;
  condition?: string;
  logMessage?: string;
  contextKey?: string;
  enabled: boolean;
  hitCount: number;
  hitCondition?: string; // e.g., ">= 3" to break on 3rd+ hit
  createdAt: Date;
}

export interface BreakpointHit {
  breakpointId: string;
  stepId: string;
  stepIndex: number;
  hitCount: number;
  timestamp: Date;
  context: Record<string, unknown>;
  conditionResult?: boolean;
  logOutput?: string;
}

// =============================================================================
// WATCH EXPRESSION TYPES
// =============================================================================

export interface WatchExpression {
  id: string;
  expression: string;
  name?: string;
  enabled: boolean;
  lastValue?: unknown;
  lastError?: string;
  lastEvaluatedAt?: Date;
}

export interface WatchEvaluation {
  expressionId: string;
  expression: string;
  value: unknown;
  type: string;
  error?: string;
  evaluatedAt: Date;
}

// =============================================================================
// CALL STACK TYPES
// =============================================================================

export interface CallStackFrame {
  id: string;
  stepId: string;
  stepIndex: number;
  stepType: string;
  stepName: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  context: Record<string, unknown>;
  parentFrameId?: string;
  depth: number;
}

// =============================================================================
// VARIABLE INSPECTION TYPES
// =============================================================================

export type VariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'undefined'
  | 'function'
  | 'date'
  | 'unknown';

export interface Variable {
  name: string;
  value: unknown;
  type: VariableType;
  expandable: boolean;
  children?: Variable[];
  path: string;
}

export interface VariableScope {
  name: string;
  variables: Variable[];
  expandable: boolean;
}

// =============================================================================
// DEBUG EVENT TYPES
// =============================================================================

export type DebugEventType =
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'session_error'
  | 'breakpoint_hit'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'context_changed'
  | 'watch_updated'
  | 'logpoint_triggered';

export interface DebugEvent {
  type: DebugEventType;
  sessionId: string;
  timestamp: Date;
  stepId?: string;
  stepIndex?: number;
  breakpointId?: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// DEBUG CALLBACKS
// =============================================================================

export interface DebugCallbacks {
  onSessionStart?: (session: DebugSession) => void;
  onSessionPause?: (session: DebugSession, reason: string) => void;
  onSessionResume?: (session: DebugSession) => void;
  onSessionComplete?: (session: DebugSession) => void;
  onSessionError?: (session: DebugSession, error: string) => void;
  onBreakpointHit?: (hit: BreakpointHit) => void;
  onStepStart?: (frame: CallStackFrame) => void;
  onStepComplete?: (frame: CallStackFrame) => void;
  onContextChange?: (key: string, oldValue: unknown, newValue: unknown) => void;
  onWatchUpdate?: (evaluation: WatchEvaluation) => void;
  onLogpoint?: (breakpoint: Breakpoint, output: string) => void;
}

// =============================================================================
// DEBUG STATE (for UI)
// =============================================================================

export interface DebugState {
  session: DebugSession | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  events: DebugEvent[];
  selectedFrameId: string | null;
  expandedVariables: Set<string>;
}

export const DEFAULT_DEBUG_STATE: DebugState = {
  session: null,
  isConnected: false,
  isLoading: false,
  error: null,
  events: [],
  selectedFrameId: null,
  expandedVariables: new Set(),
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get variable type from value
 */
export function getVariableType(value: unknown): VariableType {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'function') return 'function';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return 'unknown';
}

/**
 * Check if value is expandable (has children)
 */
export function isExpandable(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

/**
 * Convert value to display string
 */
export function formatValue(value: unknown, maxLength: number = 100): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    const escaped = value.replace(/\n/g, '\\n').replace(/\t/g, '\\t');
    if (escaped.length > maxLength) {
      return `"${escaped.substring(0, maxLength)}..."`;
    }
    return `"${escaped}"`;
  }
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return '[Function]';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `Object { ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''} }`;
  }
  return String(value);
}

/**
 * Create a variable from a value
 */
export function createVariable(name: string, value: unknown, path: string): Variable {
  const type = getVariableType(value);
  const expandable = isExpandable(value);

  return {
    name,
    value,
    type,
    expandable,
    path,
    children: expandable ? undefined : undefined, // Lazy load children
  };
}

/**
 * Get children of an expandable variable
 */
export function getVariableChildren(variable: Variable): Variable[] {
  if (!variable.expandable || variable.value === null || variable.value === undefined) {
    return [];
  }

  if (Array.isArray(variable.value)) {
    return variable.value.map((item, index) =>
      createVariable(String(index), item, `${variable.path}[${index}]`)
    );
  }

  if (typeof variable.value === 'object') {
    return Object.entries(variable.value).map(([key, val]) =>
      createVariable(key, val, `${variable.path}.${key}`)
    );
  }

  return [];
}

/**
 * Generate unique ID
 */
export function generateDebugId(prefix: string = 'dbg'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if breakpoint condition is met
 */
export function evaluateHitCondition(hitCount: number, condition: string): boolean {
  if (!condition) return true;

  const match = condition.match(/^(>=?|<=?|==?)\s*(\d+)$/);
  if (!match) return true;

  const [, operator, valueStr] = match;
  const value = parseInt(valueStr, 10);

  switch (operator) {
    case '>': return hitCount > value;
    case '>=': return hitCount >= value;
    case '<': return hitCount < value;
    case '<=': return hitCount <= value;
    case '=':
    case '==': return hitCount === value;
    default: return true;
  }
}
