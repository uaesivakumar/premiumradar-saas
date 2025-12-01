/**
 * Journey Replay Module
 * Sprint S52: Replay Engine
 *
 * Deterministic journey replay without LLM calls.
 */

// Types
export * from './types';

// Context
export {
  createContextSnapshotManager,
  computeContextDiff,
  applyContextDiff,
  reconstructContextAtStep,
  formatDiffForDisplay,
  getContextChangeSummary,
  type ContextSnapshotManager,
  type ContextTimelineEntry,
  type DiffDisplayEntry,
} from './replay-context';

// Timeline Builder
export {
  buildReplayTimeline,
  buildReplaySummary,
} from './replay-timeline-builder';

// Runner
export {
  ReplayRunner,
  createReplayRunner,
  runReplay,
} from './replay-runner';

// Hooks
export {
  useReplay,
  useReplayControls,
  useReplayTimeline,
  useReplayEvents,
  type UseReplayOptions,
  type UseReplayReturn,
  type UseReplayControlsOptions,
  type UseReplayControlsReturn,
  type UseReplayTimelineOptions,
  type UseReplayTimelineReturn,
  type UseReplayEventsOptions,
  type UseReplayEventsReturn,
} from './hooks';
