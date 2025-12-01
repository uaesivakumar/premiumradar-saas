/**
 * Timeline Viewer Types
 * Sprint S51: Timeline Viewer (Enhanced Journey Visualization)
 *
 * Types for zoomable timeline, filters, performance metrics, and exports.
 */
import { z } from 'zod';
import type { JourneyRunStep, JourneyRunError, JourneyRunAILog, JourneyRunTransition } from '@/lib/journey-runs';

// =============================================================================
// TIME SCALE
// =============================================================================

export const TimeScaleEnum = z.enum(['1s', '10s', '1m', '5m', '15m', '1h', 'auto']);
export type TimeScale = z.infer<typeof TimeScaleEnum>;

export const TIME_SCALE_MS: Record<TimeScale, number> = {
  '1s': 1000,
  '10s': 10000,
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '1h': 3600000,
  'auto': 0, // Calculated based on run duration
};

export const TIME_SCALE_LABELS: Record<TimeScale, string> = {
  '1s': '1 second',
  '10s': '10 seconds',
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  'auto': 'Auto',
};

// =============================================================================
// TIMELINE FILTERS
// =============================================================================

export const StepTypeFilterEnum = z.enum(['all', 'ai', 'action', 'decision', 'enrichment', 'checkpoint']);
export type StepTypeFilter = z.infer<typeof StepTypeFilterEnum>;

export const StepStatusFilterEnum = z.enum(['all', 'success', 'error', 'skipped', 'running', 'waiting']);
export type StepStatusFilter = z.infer<typeof StepStatusFilterEnum>;

export interface TimelineFilters {
  stepType: StepTypeFilter;
  stepStatus: StepStatusFilter;
  searchQuery: string;
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  showOnlyBottlenecks: boolean;
  showOnlyAI: boolean;
  showOnlyErrors: boolean;
}

export const DEFAULT_TIMELINE_FILTERS: TimelineFilters = {
  stepType: 'all',
  stepStatus: 'all',
  searchQuery: '',
  timeRange: { start: null, end: null },
  showOnlyBottlenecks: false,
  showOnlyAI: false,
  showOnlyErrors: false,
};

// =============================================================================
// PLAYBACK STATE
// =============================================================================

export interface PlaybackState {
  isPlaying: boolean;
  speed: number; // 1x, 2x, 4x, 0.5x
  currentTime: number; // ms from start
  loopEnabled: boolean;
}

export const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  speed: 1,
  currentTime: 0,
  loopEnabled: false,
};

// =============================================================================
// TIMELINE ITEM (Unified view of step with metadata)
// =============================================================================

export interface TimelineItem {
  id: string;
  stepId: string;
  stepName: string;
  stepType: string;
  status: JourneyRunStep['status'];

  // Timing
  startTime: number; // ms from run start
  endTime: number;   // ms from run start
  durationMs: number;

  // Position (for rendering)
  left: number;      // percentage 0-100
  width: number;     // percentage 0-100
  lane: number;      // for parallel branches

  // Flags
  isAI: boolean;
  isDecision: boolean;
  isCheckpoint: boolean;
  hasError: boolean;
  hasFallback: boolean;
  isBottleneck: boolean; // duration > 2x average

  // Related data
  aiLog?: JourneyRunAILog;
  errors: JourneyRunError[];
  transitions: JourneyRunTransition[];

  // Original step
  step: JourneyRunStep;
}

// =============================================================================
// PERFORMANCE METRICS
// =============================================================================

export interface StepPerformanceMetrics {
  stepId: string;
  stepName: string;
  stepType: string;
  durationMs: number;
  percentOfTotal: number;
  tokensUsed: number;
  costMicros: number;
  isBottleneck: boolean;
  bottleneckReason?: string;
}

export interface TimelinePerformanceMetrics {
  totalDurationMs: number;
  totalTokens: number;
  totalCostMicros: number;
  avgStepDurationMs: number;
  medianStepDurationMs: number;
  p95StepDurationMs: number;

  // Bottlenecks
  bottlenecks: StepPerformanceMetrics[];

  // By step type
  byStepType: Record<string, {
    count: number;
    totalDurationMs: number;
    avgDurationMs: number;
    totalTokens: number;
    totalCostMicros: number;
  }>;

  // Token distribution
  tokensByModel: Record<string, number>;
  costByModel: Record<string, number>;

  // Step metrics
  steps: StepPerformanceMetrics[];
}

// =============================================================================
// CONTEXT DIFF
// =============================================================================

export interface ContextDiffEntry {
  path: string;
  operation: 'added' | 'removed' | 'changed';
  oldValue?: unknown;
  newValue?: unknown;
}

export interface StepContextDiff {
  stepId: string;
  changes: ContextDiffEntry[];
  addedKeys: string[];
  removedKeys: string[];
  changedKeys: string[];
  totalChanges: number;
}

// =============================================================================
// EXPORT OPTIONS
// =============================================================================

export const ExportFormatEnum = z.enum(['json', 'pdf', 'png', 'csv']);
export type ExportFormat = z.infer<typeof ExportFormatEnum>;

export interface ExportOptions {
  format: ExportFormat;
  includeAILogs: boolean;
  includeContextSnapshots: boolean;
  includePerformanceMetrics: boolean;
  includeErrors: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  size: number;
  url?: string; // For downloadable exports
  error?: string;
}

// =============================================================================
// SHARE OPTIONS
// =============================================================================

export interface ShareOptions {
  expiresIn: '1h' | '24h' | '7d' | '30d' | 'never';
  includeFullDetails: boolean;
  password?: string;
  allowedEmails?: string[];
}

export interface ShareLink {
  id: string;
  url: string;
  expiresAt?: Date;
  createdAt: Date;
  accessCount: number;
}

// =============================================================================
// TIMELINE VIEW STATE
// =============================================================================

export interface TimelineViewState {
  scale: TimeScale;
  filters: TimelineFilters;
  playback: PlaybackState;
  selectedStepId: string | null;
  expandedStepIds: Set<string>;
  hoveredStepId: string | null;

  // Viewport
  viewportStart: number; // ms
  viewportEnd: number;   // ms
  zoomLevel: number;     // 1-10

  // Selection
  selectionRange: {
    start: number | null;
    end: number | null;
  };
}

export const DEFAULT_TIMELINE_VIEW_STATE: Omit<TimelineViewState, 'expandedStepIds'> & { expandedStepIds: string[] } = {
  scale: 'auto',
  filters: DEFAULT_TIMELINE_FILTERS,
  playback: DEFAULT_PLAYBACK_STATE,
  selectedStepId: null,
  expandedStepIds: [],
  hoveredStepId: null,
  viewportStart: 0,
  viewportEnd: 0,
  zoomLevel: 5,
  selectionRange: { start: null, end: null },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate auto time scale based on run duration
 */
export function calculateAutoTimeScale(durationMs: number): TimeScale {
  if (durationMs < 10000) return '1s';
  if (durationMs < 60000) return '10s';
  if (durationMs < 300000) return '1m';
  if (durationMs < 900000) return '5m';
  if (durationMs < 3600000) return '15m';
  return '1h';
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format cost in micros to dollars
 */
export function formatCost(micros: number): string {
  const dollars = micros / 1_000_000;
  if (dollars < 0.01) return `$${(dollars * 100).toFixed(2)}¢`;
  if (dollars < 1) return `$${dollars.toFixed(3)}`;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Format token count
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

/**
 * Check if a step is a bottleneck
 */
export function isBottleneck(stepDurationMs: number, avgDurationMs: number): boolean {
  return stepDurationMs > avgDurationMs * 2;
}

/**
 * Get step type category
 */
export function getStepTypeCategory(stepType: string | undefined): StepTypeFilter {
  if (!stepType) return 'action';
  const lowerType = stepType.toLowerCase();
  if (lowerType.includes('ai') || lowerType.includes('llm') || lowerType.includes('prompt')) return 'ai';
  if (lowerType.includes('decision') || lowerType.includes('branch')) return 'decision';
  if (lowerType.includes('enrich')) return 'enrichment';
  if (lowerType.includes('checkpoint') || lowerType.includes('approval')) return 'checkpoint';
  return 'action';
}

/**
 * Map step status to filter status
 */
export function mapStepStatusToFilter(status: JourneyRunStep['status']): StepStatusFilter {
  switch (status) {
    case 'completed': return 'success';
    case 'failed': return 'error';
    case 'timeout': return 'error';
    case 'skipped': return 'skipped';
    case 'running': return 'running';
    case 'waiting': return 'waiting';
    case 'pending': return 'waiting';
    case 'queued': return 'waiting';
    default: return 'success';
  }
}
