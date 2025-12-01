/**
 * Journey Replay Hooks
 * Sprint S52: Replay Engine
 *
 * React hooks for journey replay functionality.
 */
'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { JourneyRunDetails } from '@/lib/journey-runs';
import type {
  ReplayConfig,
  ReplayState,
  ReplayEvent,
  ReplayStep,
  ReplayTimeline,
  ReplaySummary,
  ReplaySpeed,
  ReplayCallbacks,
} from './types';
import { DEFAULT_REPLAY_CONFIG, getSpeedMultiplier } from './types';
import { ReplayRunner, createReplayRunner, runReplay } from './replay-runner';
import { buildReplaySummary } from './replay-timeline-builder';

// =============================================================================
// useReplay - Main replay hook
// =============================================================================

export interface UseReplayOptions {
  config?: Partial<ReplayConfig>;
  autoLoad?: boolean;
  callbacks?: ReplayCallbacks;
}

export interface UseReplayReturn {
  // State
  state: ReplayState;
  timeline: ReplayTimeline | null;
  summary: ReplaySummary | null;
  currentStep: ReplayStep | null;
  currentEvent: ReplayEvent | null;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Controls
  load: (details: JourneyRunDetails) => Promise<void>;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToStep: (stepIndex: number) => void;
  jumpToTime: (timeMs: number) => void;
  setSpeed: (speed: ReplaySpeed) => void;
  reset: () => void;
  dispose: () => void;

  // Status helpers
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  isReady: boolean;
}

export function useReplay(runId: string, options: UseReplayOptions = {}): UseReplayReturn {
  const { config: initialConfig, callbacks } = options;

  const [state, setState] = useState<ReplayState>({
    status: 'idle',
    runId,
    config: { ...DEFAULT_REPLAY_CONFIG, ...initialConfig },
    currentStepIndex: 0,
    currentEventIndex: 0,
    currentTimeMs: 0,
    totalSteps: 0,
    totalEvents: 0,
    totalDurationMs: 0,
    progress: 0,
  });

  const [timeline, setTimeline] = useState<ReplayTimeline | null>(null);
  const [summary, setSummary] = useState<ReplaySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runnerRef = useRef<ReplayRunner | null>(null);

  // Create runner with callbacks that update state
  const createRunner = useCallback(() => {
    if (runnerRef.current) {
      runnerRef.current.dispose();
    }

    const mergedCallbacks: ReplayCallbacks = {
      ...callbacks,
      onStart: () => {
        callbacks?.onStart?.();
      },
      onComplete: () => {
        setState(s => ({ ...s, status: 'completed' }));
        callbacks?.onComplete?.();
      },
      onPause: () => {
        setState(s => ({ ...s, status: 'paused' }));
        callbacks?.onPause?.();
      },
      onResume: () => {
        setState(s => ({ ...s, status: 'playing' }));
        callbacks?.onResume?.();
      },
      onError: (err) => {
        setError(err);
        setState(s => ({ ...s, status: 'error', error: err }));
        callbacks?.onError?.(err);
      },
      onProgress: (progress, currentStep, totalSteps) => {
        setState(s => ({
          ...s,
          progress,
          currentStepIndex: currentStep,
        }));
        callbacks?.onProgress?.(progress, currentStep, totalSteps);
      },
      onTimeUpdate: (currentTimeMs) => {
        setState(s => ({ ...s, currentTimeMs }));
        callbacks?.onTimeUpdate?.(currentTimeMs);
      },
      onStepStart: callbacks?.onStepStart,
      onStepEnd: callbacks?.onStepEnd,
      onStepError: callbacks?.onStepError,
      onEvent: callbacks?.onEvent,
      onDecision: callbacks?.onDecision,
      onFallback: callbacks?.onFallback,
      onContextChange: callbacks?.onContextChange,
    };

    runnerRef.current = createReplayRunner(runId, mergedCallbacks);
    return runnerRef.current;
  }, [runId, callbacks]);

  // Load function
  const load = useCallback(async (details: JourneyRunDetails) => {
    setIsLoading(true);
    setError(null);

    try {
      const runner = createRunner();
      await runner.load(details);

      const loadedTimeline = runner.getTimeline();
      if (loadedTimeline) {
        setTimeline(loadedTimeline);
        setSummary(buildReplaySummary(details, loadedTimeline));
      }

      setState(runner.getState());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load replay';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [createRunner]);

  // Control functions
  const play = useCallback(() => {
    runnerRef.current?.play();
    setState(s => ({ ...s, status: 'playing' }));
  }, []);

  const pause = useCallback(() => {
    runnerRef.current?.pause();
    setState(s => ({ ...s, status: 'paused' }));
  }, []);

  const togglePlayPause = useCallback(() => {
    runnerRef.current?.togglePlayPause();
  }, []);

  const stepForward = useCallback(() => {
    runnerRef.current?.stepForward();
    if (runnerRef.current) {
      setState(runnerRef.current.getState());
    }
  }, []);

  const stepBackward = useCallback(() => {
    runnerRef.current?.stepBackward();
    if (runnerRef.current) {
      setState(runnerRef.current.getState());
    }
  }, []);

  const jumpToStep = useCallback((stepIndex: number) => {
    runnerRef.current?.jumpToStep(stepIndex);
    if (runnerRef.current) {
      setState(runnerRef.current.getState());
    }
  }, []);

  const jumpToTime = useCallback((timeMs: number) => {
    runnerRef.current?.jumpToTime(timeMs);
    if (runnerRef.current) {
      setState(runnerRef.current.getState());
    }
  }, []);

  const setSpeed = useCallback((speed: ReplaySpeed) => {
    runnerRef.current?.setSpeed(speed);
    setState(s => ({ ...s, config: { ...s.config, speed } }));
  }, []);

  const reset = useCallback(() => {
    runnerRef.current?.reset();
    if (runnerRef.current) {
      setState(runnerRef.current.getState());
    }
  }, []);

  const dispose = useCallback(() => {
    runnerRef.current?.dispose();
    runnerRef.current = null;
  }, []);

  // Current step and event
  const currentStep = useMemo(() => {
    return timeline?.steps[state.currentStepIndex] ?? null;
  }, [timeline, state.currentStepIndex]);

  const currentEvent = useMemo(() => {
    return timeline?.events[state.currentEventIndex] ?? null;
  }, [timeline, state.currentEventIndex]);

  // Status helpers
  const isPlaying = state.status === 'playing';
  const isPaused = state.status === 'paused';
  const isCompleted = state.status === 'completed';
  const isReady = state.status === 'ready';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runnerRef.current?.dispose();
    };
  }, []);

  return {
    state,
    timeline,
    summary,
    currentStep,
    currentEvent,
    isLoading,
    error,
    load,
    play,
    pause,
    togglePlayPause,
    stepForward,
    stepBackward,
    jumpToStep,
    jumpToTime,
    setSpeed,
    reset,
    dispose,
    isPlaying,
    isPaused,
    isCompleted,
    isReady,
  };
}

// =============================================================================
// useReplayControls - Keyboard and UI controls
// =============================================================================

export interface UseReplayControlsOptions {
  onPlay?: () => void;
  onPause?: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onSpeedChange?: (speed: ReplaySpeed) => void;
  onReset?: () => void;
  enabled?: boolean;
}

export interface UseReplayControlsReturn {
  handleKeyDown: (event: KeyboardEvent) => void;
  speedOptions: ReplaySpeed[];
  currentSpeed: ReplaySpeed;
  setCurrentSpeed: (speed: ReplaySpeed) => void;
}

export function useReplayControls(
  options: UseReplayControlsOptions = {}
): UseReplayControlsReturn {
  const {
    onPlay,
    onPause,
    onStepForward,
    onStepBackward,
    onSpeedChange,
    onReset,
    enabled = true,
  } = options;

  const [currentSpeed, setCurrentSpeed] = useState<ReplaySpeed>('1x');
  const [isPlaying, setIsPlaying] = useState(false);

  const speedOptions: ReplaySpeed[] = ['0.25x', '0.5x', '1x', '2x', '4x', 'instant'];

  const cycleSpeed = useCallback((direction: 'up' | 'down') => {
    const currentIndex = speedOptions.indexOf(currentSpeed);
    let newIndex: number;

    if (direction === 'up') {
      newIndex = Math.min(currentIndex + 1, speedOptions.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    const newSpeed = speedOptions[newIndex];
    setCurrentSpeed(newSpeed);
    onSpeedChange?.(newSpeed);
  }, [currentSpeed, speedOptions, onSpeedChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        if (isPlaying) {
          onPause?.();
          setIsPlaying(false);
        } else {
          onPlay?.();
          setIsPlaying(true);
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (event.shiftKey) {
          // Skip forward 10 steps
          for (let i = 0; i < 10; i++) onStepForward?.();
        } else {
          onStepForward?.();
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (event.shiftKey) {
          // Skip backward 10 steps
          for (let i = 0; i < 10; i++) onStepBackward?.();
        } else {
          onStepBackward?.();
        }
        break;

      case 'Equal': // +
      case 'NumpadAdd':
        event.preventDefault();
        cycleSpeed('up');
        break;

      case 'Minus': // -
      case 'NumpadSubtract':
        event.preventDefault();
        cycleSpeed('down');
        break;

      case 'KeyR':
        if (event.metaKey || event.ctrlKey) {
          // Let browser handle refresh
          return;
        }
        event.preventDefault();
        onReset?.();
        break;

      case 'Home':
        event.preventDefault();
        onReset?.();
        break;
    }
  }, [enabled, isPlaying, onPlay, onPause, onStepForward, onStepBackward, cycleSpeed, onReset]);

  // Attach keyboard listener
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  const handleSetSpeed = useCallback((speed: ReplaySpeed) => {
    setCurrentSpeed(speed);
    onSpeedChange?.(speed);
  }, [onSpeedChange]);

  return {
    handleKeyDown,
    speedOptions,
    currentSpeed,
    setCurrentSpeed: handleSetSpeed,
  };
}

// =============================================================================
// useReplayTimeline - Timeline visualization state
// =============================================================================

export interface UseReplayTimelineOptions {
  timeline: ReplayTimeline | null;
  currentTimeMs: number;
  currentStepIndex: number;
}

export interface UseReplayTimelineReturn {
  // Viewport
  viewportStart: number;
  viewportEnd: number;
  zoomLevel: number;

  // Selection
  selectedStepId: string | null;
  hoveredStepId: string | null;

  // Actions
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  panTo: (timeMs: number) => void;
  selectStep: (stepId: string | null) => void;
  hoverStep: (stepId: string | null) => void;

  // Computed
  visibleSteps: ReplayStep[];
  visibleEvents: ReplayEvent[];
  timeMarkers: number[];
}

export function useReplayTimeline(options: UseReplayTimelineOptions): UseReplayTimelineReturn {
  const { timeline, currentTimeMs, currentStepIndex } = options;

  const [zoomLevel, setZoomLevel] = useState(5); // 1-10
  const [viewportStart, setViewportStart] = useState(0);
  const [viewportEnd, setViewportEnd] = useState(0);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);

  // Initialize viewport when timeline loads
  useEffect(() => {
    if (timeline) {
      setViewportEnd(timeline.totalDurationMs);
    }
  }, [timeline]);

  // Auto-scroll to follow current position
  useEffect(() => {
    if (!timeline) return;

    const viewportDuration = viewportEnd - viewportStart;
    const margin = viewportDuration * 0.1;

    // If current time is near the edge, pan the viewport
    if (currentTimeMs > viewportEnd - margin) {
      const newStart = currentTimeMs - viewportDuration * 0.5;
      setViewportStart(Math.max(0, newStart));
      setViewportEnd(newStart + viewportDuration);
    } else if (currentTimeMs < viewportStart + margin) {
      const newStart = currentTimeMs - viewportDuration * 0.5;
      setViewportStart(Math.max(0, newStart));
      setViewportEnd(newStart + viewportDuration);
    }
  }, [currentTimeMs, viewportStart, viewportEnd, timeline]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 1, 10));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 1, 1));
  }, []);

  const panTo = useCallback((timeMs: number) => {
    if (!timeline) return;

    const viewportDuration = viewportEnd - viewportStart;
    const newStart = Math.max(0, timeMs - viewportDuration / 2);
    const newEnd = Math.min(timeline.totalDurationMs, newStart + viewportDuration);

    setViewportStart(newStart);
    setViewportEnd(newEnd);
  }, [timeline, viewportStart, viewportEnd]);

  const selectStep = useCallback((stepId: string | null) => {
    setSelectedStepId(stepId);
  }, []);

  const hoverStep = useCallback((stepId: string | null) => {
    setHoveredStepId(stepId);
  }, []);

  // Computed values
  const visibleSteps = useMemo(() => {
    if (!timeline) return [];

    return timeline.steps.filter(step =>
      (step.startTime >= viewportStart && step.startTime <= viewportEnd) ||
      (step.endTime >= viewportStart && step.endTime <= viewportEnd) ||
      (step.startTime <= viewportStart && step.endTime >= viewportEnd)
    );
  }, [timeline, viewportStart, viewportEnd]);

  const visibleEvents = useMemo(() => {
    if (!timeline) return [];

    return timeline.events.filter(event =>
      event.timestamp >= viewportStart && event.timestamp <= viewportEnd
    );
  }, [timeline, viewportStart, viewportEnd]);

  const timeMarkers = useMemo(() => {
    const viewportDuration = viewportEnd - viewportStart;
    const markerCount = Math.max(5, Math.min(20, Math.floor(viewportDuration / 1000)));
    const interval = viewportDuration / markerCount;

    const markers: number[] = [];
    for (let i = 0; i <= markerCount; i++) {
      markers.push(viewportStart + i * interval);
    }
    return markers;
  }, [viewportStart, viewportEnd]);

  return {
    viewportStart,
    viewportEnd,
    zoomLevel,
    selectedStepId,
    hoveredStepId,
    setZoomLevel,
    zoomIn,
    zoomOut,
    panTo,
    selectStep,
    hoverStep,
    visibleSteps,
    visibleEvents,
    timeMarkers,
  };
}

// =============================================================================
// useReplayEvents - Event filtering and grouping
// =============================================================================

export interface UseReplayEventsOptions {
  events: ReplayEvent[];
  filterTypes?: string[];
  groupByStep?: boolean;
}

export interface UseReplayEventsReturn {
  filteredEvents: ReplayEvent[];
  eventsByStep: Map<string, ReplayEvent[]>;
  eventCounts: Record<string, number>;
}

export function useReplayEvents(options: UseReplayEventsOptions): UseReplayEventsReturn {
  const { events, filterTypes, groupByStep = false } = options;

  const filteredEvents = useMemo(() => {
    if (!filterTypes || filterTypes.length === 0) {
      return events;
    }
    return events.filter(e => filterTypes.includes(e.type));
  }, [events, filterTypes]);

  const eventsByStep = useMemo(() => {
    const map = new Map<string, ReplayEvent[]>();

    for (const event of filteredEvents) {
      if (event.stepId) {
        const existing = map.get(event.stepId) || [];
        existing.push(event);
        map.set(event.stepId, existing);
      }
    }

    return map;
  }, [filteredEvents]);

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const event of events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }

    return counts;
  }, [events]);

  return {
    filteredEvents,
    eventsByStep,
    eventCounts,
  };
}
