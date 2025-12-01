/**
 * Journey Debugger Hooks
 * Sprint S53: Journey Debugger
 *
 * React hooks for debug session management.
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  DebugSession,
  DebugSessionConfig,
  DebugState,
  DebugEvent,
  Breakpoint,
  BreakpointType,
  BreakpointHit,
  WatchExpression,
  WatchEvaluation,
  Variable,
  VariableScope,
  StepAction,
} from './types';
import { DEFAULT_DEBUG_STATE, DEFAULT_DEBUG_CONFIG } from './types';
import { DebuggerEngine, createDebuggerEngine } from './debugger-engine';
import { VariableInspector } from './watch-evaluator';
import type { JourneyRunStep, JourneyRunDetails } from '@/lib/journey-runs';

// =============================================================================
// USE DEBUG SESSION HOOK
// =============================================================================

export interface UseDebugSessionOptions {
  config?: Partial<DebugSessionConfig>;
  onEvent?: (event: DebugEvent) => void;
  onBreakpointHit?: (hit: BreakpointHit) => void;
}

export interface UseDebugSessionReturn {
  // State
  session: DebugSession | null;
  status: DebugSession['status'] | 'idle';
  isRunning: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  currentStepId: string | null;
  callStack: DebugSession['callStack'];
  context: Record<string, unknown>;
  events: DebugEvent[];
  error: string | null;

  // Session lifecycle
  startSession: (journeyId: string, steps: JourneyRunStep[], initialContext?: Record<string, unknown>) => void;
  loadFromRun: (runDetails: JourneyRunDetails) => void;
  stopSession: () => void;

  // Execution control
  continue: () => void;
  stepOver: () => void;
  stepInto: () => void;
  stepOut: () => void;
  restart: () => void;
  pause: () => void;

  // Navigation
  jumpToStep: (stepIndex: number) => void;

  // Context
  updateContext: (key: string, value: unknown) => void;

  // Expression evaluation
  evaluateExpression: (expression: string) => WatchEvaluation | null;

  // Engine access
  engine: DebuggerEngine | null;
}

export function useDebugSession(
  options: UseDebugSessionOptions = {}
): UseDebugSessionReturn {
  const { config, onEvent, onBreakpointHit } = options;

  const [session, setSession] = useState<DebugSession | null>(null);
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<DebuggerEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    engineRef.current = createDebuggerEngine(
      { ...DEFAULT_DEBUG_CONFIG, ...config },
      {
        onSessionStart: (s) => {
          setSession({ ...s });
          setError(null);
        },
        onSessionPause: (s) => {
          setSession({ ...s });
        },
        onSessionResume: (s) => {
          setSession({ ...s });
        },
        onSessionComplete: (s) => {
          setSession({ ...s });
        },
        onSessionError: (s, err) => {
          setSession({ ...s });
          setError(err);
        },
        onBreakpointHit: (hit) => {
          onBreakpointHit?.(hit);
          const s = engineRef.current?.getSession();
          if (s) setSession({ ...s });
        },
        onStepStart: () => {
          const s = engineRef.current?.getSession();
          if (s) setSession({ ...s });
        },
        onStepComplete: () => {
          const s = engineRef.current?.getSession();
          if (s) setSession({ ...s });
        },
        onContextChange: () => {
          const s = engineRef.current?.getSession();
          if (s) setSession({ ...s });
        },
      }
    );

    return () => {
      engineRef.current?.stopSession();
      engineRef.current = null;
    };
  }, [config, onBreakpointHit]);

  // Sync events
  useEffect(() => {
    if (engineRef.current) {
      const newEvents = engineRef.current.getEvents();
      setEvents(newEvents);

      // Call event callback for new events
      if (onEvent && newEvents.length > events.length) {
        const latestEvent = newEvents[newEvents.length - 1];
        onEvent(latestEvent);
      }
    }
  }, [session, onEvent, events.length]);

  // Session lifecycle
  const startSession = useCallback(
    (journeyId: string, steps: JourneyRunStep[], initialContext?: Record<string, unknown>) => {
      if (engineRef.current) {
        engineRef.current.startSession(journeyId, steps, initialContext || {});
        setEvents([]);
      }
    },
    []
  );

  const loadFromRun = useCallback((runDetails: JourneyRunDetails) => {
    if (engineRef.current) {
      engineRef.current.loadFromRunDetails(runDetails);
      setEvents([]);
    }
  }, []);

  const stopSession = useCallback(() => {
    engineRef.current?.stopSession();
    setSession(null);
    setEvents([]);
  }, []);

  // Execution control
  const continueExec = useCallback(() => {
    engineRef.current?.continue();
  }, []);

  const stepOver = useCallback(() => {
    engineRef.current?.stepOver();
  }, []);

  const stepInto = useCallback(() => {
    engineRef.current?.stepInto();
  }, []);

  const stepOut = useCallback(() => {
    engineRef.current?.stepOut();
  }, []);

  const restart = useCallback(() => {
    engineRef.current?.restart();
    setEvents([]);
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  // Navigation
  const jumpToStep = useCallback((stepIndex: number) => {
    engineRef.current?.jumpToStep(stepIndex);
  }, []);

  // Context
  const updateContext = useCallback((key: string, value: unknown) => {
    engineRef.current?.updateContext(key, value);
  }, []);

  // Expression evaluation
  const evaluateExpression = useCallback((expression: string): WatchEvaluation | null => {
    return engineRef.current?.evaluateExpression(expression) || null;
  }, []);

  return {
    // State
    session,
    status: session?.status || 'idle',
    isRunning: session?.status === 'running' || session?.status === 'stepping',
    isPaused: session?.status === 'paused',
    currentStepIndex: session?.currentStepIndex ?? -1,
    currentStepId: session?.currentStepId ?? null,
    callStack: session?.callStack || [],
    context: session?.context || {},
    events,
    error,

    // Session lifecycle
    startSession,
    loadFromRun,
    stopSession,

    // Execution control
    continue: continueExec,
    stepOver,
    stepInto,
    stepOut,
    restart,
    pause,

    // Navigation
    jumpToStep,

    // Context
    updateContext,

    // Expression evaluation
    evaluateExpression,

    // Engine access
    engine: engineRef.current,
  };
}

// =============================================================================
// USE BREAKPOINTS HOOK
// =============================================================================

export interface UseBreakpointsReturn {
  breakpoints: Breakpoint[];
  addBreakpoint: (config: {
    type: BreakpointType;
    stepId?: string;
    stepIndex?: number;
    condition?: string;
    logMessage?: string;
    contextKey?: string;
  }) => Breakpoint | null;
  addStepBreakpoint: (stepId: string, stepIndex?: number) => Breakpoint | null;
  addConditionalBreakpoint: (stepId: string, condition: string) => Breakpoint | null;
  addLogpoint: (stepId: string, logMessage: string) => Breakpoint | null;
  removeBreakpoint: (breakpointId: string) => void;
  toggleBreakpoint: (breakpointId: string) => void;
  clearAllBreakpoints: () => void;
  getBreakpointsForStep: (stepId: string) => Breakpoint[];
}

export function useBreakpoints(engine: DebuggerEngine | null): UseBreakpointsReturn {
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);

  // Sync breakpoints from engine
  const syncBreakpoints = useCallback(() => {
    const manager = engine?.getBreakpointManager();
    if (manager) {
      setBreakpoints(manager.getAllBreakpoints());
    }
  }, [engine]);

  useEffect(() => {
    syncBreakpoints();
  }, [syncBreakpoints]);

  const addBreakpoint = useCallback(
    (config: {
      type: BreakpointType;
      stepId?: string;
      stepIndex?: number;
      condition?: string;
      logMessage?: string;
      contextKey?: string;
    }): Breakpoint | null => {
      const manager = engine?.getBreakpointManager();
      if (!manager) return null;

      const bp = manager.addBreakpoint(config);
      syncBreakpoints();
      return bp;
    },
    [engine, syncBreakpoints]
  );

  const addStepBreakpoint = useCallback(
    (stepId: string, stepIndex?: number): Breakpoint | null => {
      const manager = engine?.getBreakpointManager();
      if (!manager) return null;

      const bp = manager.addStepBreakpoint(stepId, stepIndex);
      syncBreakpoints();
      return bp;
    },
    [engine, syncBreakpoints]
  );

  const addConditionalBreakpoint = useCallback(
    (stepId: string, condition: string): Breakpoint | null => {
      const manager = engine?.getBreakpointManager();
      if (!manager) return null;

      const bp = manager.addConditionalBreakpoint(stepId, condition);
      syncBreakpoints();
      return bp;
    },
    [engine, syncBreakpoints]
  );

  const addLogpoint = useCallback(
    (stepId: string, logMessage: string): Breakpoint | null => {
      const manager = engine?.getBreakpointManager();
      if (!manager) return null;

      const bp = manager.addLogpoint(stepId, logMessage);
      syncBreakpoints();
      return bp;
    },
    [engine, syncBreakpoints]
  );

  const removeBreakpoint = useCallback(
    (breakpointId: string) => {
      const manager = engine?.getBreakpointManager();
      if (manager) {
        manager.removeBreakpoint(breakpointId);
        syncBreakpoints();
      }
    },
    [engine, syncBreakpoints]
  );

  const toggleBreakpoint = useCallback(
    (breakpointId: string) => {
      const manager = engine?.getBreakpointManager();
      if (manager) {
        manager.toggleBreakpoint(breakpointId);
        syncBreakpoints();
      }
    },
    [engine, syncBreakpoints]
  );

  const clearAllBreakpoints = useCallback(() => {
    const manager = engine?.getBreakpointManager();
    if (manager) {
      manager.clearAllBreakpoints();
      syncBreakpoints();
    }
  }, [engine, syncBreakpoints]);

  const getBreakpointsForStep = useCallback(
    (stepId: string): Breakpoint[] => {
      const manager = engine?.getBreakpointManager();
      return manager?.getBreakpointsForStep(stepId) || [];
    },
    [engine]
  );

  return {
    breakpoints,
    addBreakpoint,
    addStepBreakpoint,
    addConditionalBreakpoint,
    addLogpoint,
    removeBreakpoint,
    toggleBreakpoint,
    clearAllBreakpoints,
    getBreakpointsForStep,
  };
}

// =============================================================================
// USE WATCH EXPRESSIONS HOOK
// =============================================================================

export interface UseWatchExpressionsReturn {
  expressions: WatchExpression[];
  evaluations: Map<string, WatchEvaluation>;
  addExpression: (expression: string, name?: string) => WatchExpression | null;
  removeExpression: (expressionId: string) => void;
  updateExpression: (expressionId: string, expression: string) => void;
  toggleExpression: (expressionId: string) => void;
  clearAllExpressions: () => void;
  evaluateAll: () => void;
}

export function useWatchExpressions(
  engine: DebuggerEngine | null,
  context: Record<string, unknown>
): UseWatchExpressionsReturn {
  const [expressions, setExpressions] = useState<WatchExpression[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, WatchEvaluation>>(new Map());

  // Sync expressions from engine
  const syncExpressions = useCallback(() => {
    const evaluator = engine?.getWatchEvaluator();
    if (evaluator) {
      setExpressions(evaluator.getAllExpressions());
    }
  }, [engine]);

  useEffect(() => {
    syncExpressions();
  }, [syncExpressions]);

  // Re-evaluate when context changes
  useEffect(() => {
    const evaluator = engine?.getWatchEvaluator();
    if (evaluator && Object.keys(context).length > 0) {
      const results = evaluator.evaluateAll(context);
      const newEvals = new Map<string, WatchEvaluation>();
      for (const result of results) {
        newEvals.set(result.expressionId, result);
      }
      setEvaluations(newEvals);
      syncExpressions();
    }
  }, [engine, context, syncExpressions]);

  const addExpression = useCallback(
    (expression: string, name?: string): WatchExpression | null => {
      const evaluator = engine?.getWatchEvaluator();
      if (!evaluator) return null;

      const expr = evaluator.addExpression(expression, name);
      syncExpressions();
      return expr;
    },
    [engine, syncExpressions]
  );

  const removeExpression = useCallback(
    (expressionId: string) => {
      const evaluator = engine?.getWatchEvaluator();
      if (evaluator) {
        evaluator.removeExpression(expressionId);
        syncExpressions();
      }
    },
    [engine, syncExpressions]
  );

  const updateExpression = useCallback(
    (expressionId: string, expression: string) => {
      const evaluator = engine?.getWatchEvaluator();
      if (evaluator) {
        evaluator.updateExpression(expressionId, { expression });
        syncExpressions();
      }
    },
    [engine, syncExpressions]
  );

  const toggleExpression = useCallback(
    (expressionId: string) => {
      const evaluator = engine?.getWatchEvaluator();
      if (evaluator) {
        evaluator.toggleExpression(expressionId);
        syncExpressions();
      }
    },
    [engine, syncExpressions]
  );

  const clearAllExpressions = useCallback(() => {
    const evaluator = engine?.getWatchEvaluator();
    if (evaluator) {
      evaluator.clearAllExpressions();
      syncExpressions();
      setEvaluations(new Map());
    }
  }, [engine, syncExpressions]);

  const evaluateAll = useCallback(() => {
    const evaluator = engine?.getWatchEvaluator();
    if (evaluator) {
      const results = evaluator.evaluateAll(context);
      const newEvals = new Map<string, WatchEvaluation>();
      for (const result of results) {
        newEvals.set(result.expressionId, result);
      }
      setEvaluations(newEvals);
      syncExpressions();
    }
  }, [engine, context, syncExpressions]);

  return {
    expressions,
    evaluations,
    addExpression,
    removeExpression,
    updateExpression,
    toggleExpression,
    clearAllExpressions,
    evaluateAll,
  };
}

// =============================================================================
// USE VARIABLE INSPECTOR HOOK
// =============================================================================

export interface UseVariableInspectorReturn {
  scopes: VariableScope[];
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  getExpandedChildren: (variable: Variable) => Variable[];
}

export function useVariableInspector(
  context: Record<string, unknown>
): UseVariableInspectorReturn {
  const [scopes, setScopes] = useState<VariableScope[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // Update scopes when context changes
  useEffect(() => {
    const newScopes = VariableInspector.createScopes(context);
    setScopes(newScopes);
  }, [context]);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>();

    const collectPaths = (variables: Variable[]) => {
      for (const v of variables) {
        if (v.expandable) {
          allPaths.add(v.path);
          const children = VariableInspector.expandVariable(v);
          collectPaths(children);
        }
      }
    };

    for (const scope of scopes) {
      collectPaths(scope.variables);
    }

    setExpandedPaths(allPaths);
  }, [scopes]);

  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const getExpandedChildren = useCallback(
    (variable: Variable): Variable[] => {
      if (!expandedPaths.has(variable.path)) return [];
      return VariableInspector.expandVariable(variable);
    },
    [expandedPaths]
  );

  return {
    scopes,
    expandedPaths,
    toggleExpand,
    expandAll,
    collapseAll,
    getExpandedChildren,
  };
}

// =============================================================================
// USE DEBUG KEYBOARD SHORTCUTS
// =============================================================================

export interface UseDebugKeyboardOptions {
  onContinue: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onRestart: () => void;
  onPause: () => void;
  enabled?: boolean;
}

export function useDebugKeyboard(options: UseDebugKeyboardOptions): void {
  const {
    onContinue,
    onStepOver,
    onStepInto,
    onStepOut,
    onRestart,
    onPause,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'F5':
          e.preventDefault();
          onContinue();
          break;
        case 'F6':
          e.preventDefault();
          onPause();
          break;
        case 'F10':
          e.preventDefault();
          onStepOver();
          break;
        case 'F11':
          e.preventDefault();
          if (e.shiftKey) {
            onStepOut();
          } else {
            onStepInto();
          }
          break;
        case 'F9':
          if (e.shiftKey && e.ctrlKey) {
            e.preventDefault();
            onRestart();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onContinue, onStepOver, onStepInto, onStepOut, onRestart, onPause]);
}
