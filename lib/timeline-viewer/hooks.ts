/**
 * Timeline Viewer Hooks
 * Sprint S51: Timeline Viewer
 *
 * React hooks for timeline state management, playback, and export.
 */
'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type {
  TimelineViewState,
  TimelineFilters,
  PlaybackState,
  TimeScale,
  TimelineItem,
  TimelinePerformanceMetrics,
  ExportFormat,
  ExportOptions,
  ExportResult,
} from './types';
import {
  DEFAULT_TIMELINE_FILTERS,
  DEFAULT_PLAYBACK_STATE,
  calculateAutoTimeScale,
} from './types';
import {
  createTimelineItems,
  filterTimelineItems,
  calculatePerformanceMetrics,
  exportToJSON,
  exportToCSV,
} from './utils';
import type {
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunError,
  JourneyRunTransition,
} from '@/lib/journey-runs';

// =============================================================================
// TIMELINE STATE HOOK
// =============================================================================

interface UseTimelineStateOptions {
  steps: JourneyRunStep[];
  aiLogs: JourneyRunAILog[];
  errors: JourneyRunError[];
  transitions: JourneyRunTransition[];
  runStartTime: Date;
  runDurationMs: number;
}

interface TimelineStateReturn {
  // Items
  items: TimelineItem[];
  filteredItems: TimelineItem[];
  metrics: TimelinePerformanceMetrics;

  // State
  scale: TimeScale;
  setScale: (scale: TimeScale) => void;
  filters: TimelineFilters;
  setFilters: (filters: TimelineFilters) => void;
  updateFilter: <K extends keyof TimelineFilters>(key: K, value: TimelineFilters[K]) => void;
  resetFilters: () => void;

  // Selection
  selectedStepId: string | null;
  setSelectedStepId: (id: string | null) => void;
  expandedStepIds: Set<string>;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Viewport
  viewportStart: number;
  viewportEnd: number;
  setViewport: (start: number, end: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomLevel: number;

  // Search
  searchResults: TimelineItem[];
  searchIndex: number;
  setSearchIndex: (index: number) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;
}

export function useTimelineState(options: UseTimelineStateOptions): TimelineStateReturn {
  const {
    steps,
    aiLogs,
    errors,
    transitions,
    runStartTime,
    runDurationMs,
  } = options;

  // Base state
  const [scale, setScale] = useState<TimeScale>('auto');
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_TIMELINE_FILTERS);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [expandedStepIds, setExpandedStepIds] = useState<Set<string>>(new Set());
  const [viewportStart, setViewportStart] = useState(0);
  const [viewportEnd, setViewportEnd] = useState(runDurationMs);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchIndex, setSearchIndex] = useState(0);

  // Create timeline items
  const items = useMemo(() => {
    return createTimelineItems(
      steps,
      aiLogs,
      errors,
      transitions,
      runStartTime,
      runDurationMs
    );
  }, [steps, aiLogs, errors, transitions, runStartTime, runDurationMs]);

  // Filter items
  const filteredItems = useMemo(() => {
    return filterTimelineItems(items, filters);
  }, [items, filters]);

  // Calculate metrics
  const metrics = useMemo(() => {
    return calculatePerformanceMetrics(items, aiLogs);
  }, [items, aiLogs]);

  // Search results
  const searchResults = useMemo(() => {
    if (!filters.searchQuery) return [];
    return filteredItems.filter(item => {
      const query = filters.searchQuery.toLowerCase();
      return (
        item.stepName.toLowerCase().includes(query) ||
        item.stepId.toLowerCase().includes(query) ||
        item.stepType.toLowerCase().includes(query)
      );
    });
  }, [filteredItems, filters.searchQuery]);

  // Update viewport when duration changes
  useEffect(() => {
    setViewportEnd(runDurationMs);
  }, [runDurationMs]);

  // Filter helpers
  const updateFilter = useCallback(<K extends keyof TimelineFilters>(
    key: K,
    value: TimelineFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_TIMELINE_FILTERS);
  }, []);

  // Expansion helpers
  const toggleExpanded = useCallback((id: string) => {
    setExpandedStepIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedStepIds(new Set(items.map(i => i.stepId)));
  }, [items]);

  const collapseAll = useCallback(() => {
    setExpandedStepIds(new Set());
  }, []);

  // Viewport helpers
  const setViewport = useCallback((start: number, end: number) => {
    setViewportStart(Math.max(0, start));
    setViewportEnd(Math.min(runDurationMs, end));
  }, [runDurationMs]);

  const zoomIn = useCallback(() => {
    const currentRange = viewportEnd - viewportStart;
    const newRange = currentRange * 0.7;
    const center = (viewportStart + viewportEnd) / 2;
    setViewport(center - newRange / 2, center + newRange / 2);
    setZoomLevel(prev => Math.min(prev + 1, 10));
  }, [viewportStart, viewportEnd, setViewport]);

  const zoomOut = useCallback(() => {
    const currentRange = viewportEnd - viewportStart;
    const newRange = Math.min(currentRange * 1.4, runDurationMs);
    const center = (viewportStart + viewportEnd) / 2;
    setViewport(center - newRange / 2, center + newRange / 2);
    setZoomLevel(prev => Math.max(prev - 1, 1));
  }, [viewportStart, viewportEnd, runDurationMs, setViewport]);

  const resetZoom = useCallback(() => {
    setViewportStart(0);
    setViewportEnd(runDurationMs);
    setZoomLevel(1);
  }, [runDurationMs]);

  // Search navigation
  const nextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const newIndex = (searchIndex + 1) % searchResults.length;
    setSearchIndex(newIndex);
    setSelectedStepId(searchResults[newIndex].stepId);
  }, [searchResults, searchIndex]);

  const prevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const newIndex = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(newIndex);
    setSelectedStepId(searchResults[newIndex].stepId);
  }, [searchResults, searchIndex]);

  return {
    items,
    filteredItems,
    metrics,
    scale,
    setScale,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    selectedStepId,
    setSelectedStepId,
    expandedStepIds,
    toggleExpanded,
    expandAll,
    collapseAll,
    viewportStart,
    viewportEnd,
    setViewport,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomLevel,
    searchResults,
    searchIndex,
    setSearchIndex,
    nextSearchResult,
    prevSearchResult,
  };
}

// =============================================================================
// PLAYBACK HOOK
// =============================================================================

interface UseTimelinePlaybackOptions {
  durationMs: number;
  onTimeChange?: (time: number) => void;
}

interface PlaybackReturn {
  state: PlaybackState;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  toggleLoop: () => void;
  currentTime: number;
  progress: number;
}

export function useTimelinePlayback(options: UseTimelinePlaybackOptions): PlaybackReturn {
  const { durationMs, onTimeChange } = options;

  const [state, setState] = useState<PlaybackState>(DEFAULT_PLAYBACK_STATE);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    if (!state.isPlaying) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) * state.speed;
      lastTimeRef.current = timestamp;

      setState(prev => {
        let newTime = prev.currentTime + delta;

        if (newTime >= durationMs) {
          if (prev.loopEnabled) {
            newTime = 0;
          } else {
            return { ...prev, isPlaying: false, currentTime: durationMs };
          }
        }

        return { ...prev, currentTime: newTime };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state.isPlaying, state.speed, state.loopEnabled, durationMs]);

  // Notify on time change
  useEffect(() => {
    onTimeChange?.(state.currentTime);
  }, [state.currentTime, onTimeChange]);

  const play = useCallback(() => {
    lastTimeRef.current = 0;
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stop = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, []);

  const seek = useCallback((time: number) => {
    setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, durationMs)) }));
  }, [durationMs]);

  const setSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, speed }));
  }, []);

  const toggleLoop = useCallback(() => {
    setState(prev => ({ ...prev, loopEnabled: !prev.loopEnabled }));
  }, []);

  const progress = durationMs > 0 ? (state.currentTime / durationMs) * 100 : 0;

  return {
    state,
    play,
    pause,
    stop,
    seek,
    setSpeed,
    toggleLoop,
    currentTime: state.currentTime,
    progress,
  };
}

// =============================================================================
// EXPORT HOOK
// =============================================================================

interface UseTimelineExportOptions {
  items: TimelineItem[];
  metrics: TimelinePerformanceMetrics;
  journeyId: string;
  runId: string;
}

interface ExportReturn {
  isExporting: boolean;
  exportTimeline: (options: ExportOptions) => Promise<ExportResult>;
  downloadJSON: () => void;
  downloadCSV: () => void;
  copyToClipboard: () => Promise<boolean>;
}

export function useTimelineExport(options: UseTimelineExportOptions): ExportReturn {
  const { items, metrics, journeyId, runId } = options;
  const [isExporting, setIsExporting] = useState(false);

  const exportTimeline = useCallback(async (exportOptions: ExportOptions): Promise<ExportResult> => {
    setIsExporting(true);

    try {
      const filename = `timeline-${journeyId}-${runId}-${Date.now()}`;
      let content: string;
      let mimeType: string;
      let extension: string;

      switch (exportOptions.format) {
        case 'json':
          content = exportToJSON(items, metrics, {
            includeAILogs: exportOptions.includeAILogs,
            includeErrors: exportOptions.includeErrors,
          });
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'csv':
          content = exportToCSV(items);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'pdf':
        case 'png':
          // These would require server-side rendering or canvas
          // For now, return a stub
          return {
            success: false,
            format: exportOptions.format,
            filename: `${filename}.${exportOptions.format}`,
            size: 0,
            error: `${exportOptions.format.toUpperCase()} export not yet implemented`,
          };
        default:
          throw new Error(`Unsupported format: ${exportOptions.format}`);
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      return {
        success: true,
        format: exportOptions.format,
        filename: `${filename}.${extension}`,
        size: blob.size,
        url,
      };
    } catch (error) {
      return {
        success: false,
        format: exportOptions.format,
        filename: '',
        size: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    } finally {
      setIsExporting(false);
    }
  }, [items, metrics, journeyId, runId]);

  const downloadJSON = useCallback(() => {
    const content = exportToJSON(items, metrics, { includeAILogs: true, includeErrors: true });
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${journeyId}-${runId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [items, metrics, journeyId, runId]);

  const downloadCSV = useCallback(() => {
    const content = exportToCSV(items);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${journeyId}-${runId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [items, journeyId, runId]);

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      const content = exportToJSON(items, metrics, { includeAILogs: false, includeErrors: true });
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return false;
    }
  }, [items, metrics]);

  return {
    isExporting,
    exportTimeline,
    downloadJSON,
    downloadCSV,
    copyToClipboard,
  };
}
