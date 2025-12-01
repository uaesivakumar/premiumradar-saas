/**
 * Journey Debugger
 * Sprint S53: Journey Debugger
 *
 * Complete debugging toolkit for journey development.
 */

// Types
export type {
  DebugSessionStatus,
  StepAction,
  DebugSession,
  DebugSessionConfig,
  BreakpointType,
  Breakpoint,
  BreakpointHit,
  WatchExpression,
  WatchEvaluation,
  CallStackFrame,
  VariableType,
  Variable,
  VariableScope,
  DebugEventType,
  DebugEvent,
  DebugCallbacks,
  DebugState,
} from './types';

// Constants
export {
  DEFAULT_DEBUG_CONFIG,
  DEFAULT_DEBUG_STATE,
} from './types';

// Type helpers
export {
  getVariableType,
  isExpandable,
  formatValue,
  createVariable,
  getVariableChildren,
  generateDebugId,
  evaluateHitCondition,
} from './types';

// Breakpoint Manager
export { BreakpointManager, createBreakpointManager } from './breakpoint-manager';

// Watch Evaluator
export {
  WatchEvaluator,
  VariableInspector,
  createWatchEvaluator,
} from './watch-evaluator';

// Debugger Engine
export { DebuggerEngine, createDebuggerEngine } from './debugger-engine';

// Hooks
export {
  useDebugSession,
  useBreakpoints,
  useWatchExpressions,
  useVariableInspector,
  useDebugKeyboard,
} from './hooks';

export type {
  UseDebugSessionOptions,
  UseDebugSessionReturn,
  UseBreakpointsReturn,
  UseWatchExpressionsReturn,
  UseVariableInspectorReturn,
  UseDebugKeyboardOptions,
} from './hooks';
