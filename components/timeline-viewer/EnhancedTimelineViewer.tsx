/**
 * Enhanced Timeline Viewer
 * Sprint S51: Timeline Viewer
 *
 * Integrated timeline viewer combining all S51 components:
 * - Zoomable timeline
 * - Playback controls
 * - Step expansion
 * - Filters and search
 * - Performance metrics
 * - Export functionality
 */
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { ZoomableTimeline } from './ZoomableTimeline';
import { TimelineScrubber } from './TimelineScrubber';
import { StepExpansion } from './StepExpansion';
import { TimelineFilters } from './TimelineFilters';
import { PerformanceMetricsPanel } from './PerformanceMetrics';
import { ExportPanel } from './ExportPanel';
import {
  useTimelineState,
  useTimelinePlayback,
  useTimelineExport,
} from '@/lib/timeline-viewer';
import type {
  JourneyRunStep,
  JourneyRunAILog,
  JourneyRunError,
  JourneyRunTransition,
  JourneyRunContextSnapshot,
} from '@/lib/journey-runs';

interface EnhancedTimelineViewerProps {
  journeyId: string;
  runId: string;
  steps: JourneyRunStep[];
  aiLogs: JourneyRunAILog[];
  errors: JourneyRunError[];
  transitions: JourneyRunTransition[];
  contextSnapshots: JourneyRunContextSnapshot[];
  runStartTime: Date;
  runDurationMs: number;
  className?: string;
}

export function EnhancedTimelineViewer({
  journeyId,
  runId,
  steps,
  aiLogs,
  errors,
  transitions,
  contextSnapshots,
  runStartTime,
  runDurationMs,
  className,
}: EnhancedTimelineViewerProps) {
  // Initialize timeline state
  const timeline = useTimelineState({
    steps,
    aiLogs,
    errors,
    transitions,
    runStartTime,
    runDurationMs,
  });

  // Initialize playback
  const playback = useTimelinePlayback({
    durationMs: runDurationMs,
    onTimeChange: (time) => {
      // Find the step at current playback time and select it
      const stepAtTime = timeline.items.find(
        item => item.startTime <= time && item.endTime >= time
      );
      if (stepAtTime && stepAtTime.stepId !== timeline.selectedStepId) {
        timeline.setSelectedStepId(stepAtTime.stepId);
      }
    },
  });

  // Initialize export
  const exporter = useTimelineExport({
    items: timeline.filteredItems,
    metrics: timeline.metrics,
    journeyId,
    runId,
  });

  // Build context snapshot map by step
  const snapshotsByStep = useMemo(() => {
    const map = new Map<string, JourneyRunContextSnapshot>();
    contextSnapshots.forEach(s => map.set(s.stepId, s));
    return map;
  }, [contextSnapshots]);

  // Get previous snapshot for diff calculation
  const getPreviousSnapshot = (stepId: string): JourneyRunContextSnapshot | undefined => {
    const currentIndex = steps.findIndex(s => s.stepId === stepId);
    if (currentIndex <= 0) return undefined;
    const prevStepId = steps[currentIndex - 1]?.stepId;
    return prevStepId ? snapshotsByStep.get(prevStepId) : undefined;
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Enhanced Timeline Viewer
        </h2>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
            <button
              onClick={timeline.zoomOut}
              className="p-1.5 hover:bg-gray-200 rounded-l-lg transition-colors"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="px-2 text-xs text-gray-600">{timeline.zoomLevel}x</span>
            <button
              onClick={timeline.zoomIn}
              className="p-1.5 hover:bg-gray-200 transition-colors"
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={timeline.resetZoom}
              className="p-1.5 hover:bg-gray-200 rounded-r-lg transition-colors"
              title="Reset zoom"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          {/* Expand/collapse all */}
          <div className="flex items-center gap-1">
            <button
              onClick={timeline.expandAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Expand all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={timeline.collapseAll}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Collapse all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            </button>
          </div>

          {/* Export panel */}
          <ExportPanel
            onExport={exporter.exportTimeline}
            onDownloadJSON={exporter.downloadJSON}
            onDownloadCSV={exporter.downloadCSV}
            onCopyToClipboard={exporter.copyToClipboard}
            isExporting={exporter.isExporting}
            journeyId={journeyId}
            runId={runId}
          />
        </div>
      </div>

      {/* Filters */}
      <TimelineFilters
        filters={timeline.filters}
        onFilterChange={timeline.updateFilter}
        onReset={timeline.resetFilters}
        searchResults={timeline.searchResults}
        searchIndex={timeline.searchIndex}
        onNextResult={timeline.nextSearchResult}
        onPrevResult={timeline.prevSearchResult}
        totalItems={timeline.items.length}
        filteredCount={timeline.filteredItems.length}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left column: Timeline and scrubber */}
        <div className="col-span-2 space-y-4">
          {/* Zoomable timeline */}
          <ZoomableTimeline
            items={timeline.filteredItems}
            durationMs={runDurationMs}
            viewportStart={timeline.viewportStart}
            viewportEnd={timeline.viewportEnd}
            scale={timeline.scale}
            selectedStepId={timeline.selectedStepId}
            currentPlaybackTime={playback.currentTime}
            onStepSelect={timeline.setSelectedStepId}
            onViewportChange={timeline.setViewport}
            onScaleChange={timeline.setScale}
          />

          {/* Playback scrubber */}
          <TimelineScrubber
            currentTime={playback.currentTime}
            durationMs={runDurationMs}
            playbackState={playback.state}
            onPlay={playback.play}
            onPause={playback.pause}
            onStop={playback.stop}
            onSeek={playback.seek}
            onSpeedChange={playback.setSpeed}
            onToggleLoop={playback.toggleLoop}
          />

          {/* Step expansion list */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Step Details ({timeline.filteredItems.length} steps)
            </h3>
            <div className="space-y-2 max-h-96 overflow-auto">
              {timeline.filteredItems.map((item, index) => (
                <StepExpansion
                  key={item.id}
                  item={item}
                  previousSnapshot={getPreviousSnapshot(item.stepId)}
                  currentSnapshot={snapshotsByStep.get(item.stepId)}
                  isExpanded={timeline.expandedStepIds.has(item.stepId)}
                  onToggle={() => timeline.toggleExpanded(item.stepId)}
                  onSelect={() => timeline.setSelectedStepId(item.stepId)}
                  isSelected={timeline.selectedStepId === item.stepId}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Performance metrics */}
        <div className="space-y-4">
          <PerformanceMetricsPanel
            metrics={timeline.metrics}
            onStepSelect={timeline.setSelectedStepId}
            selectedStepId={timeline.selectedStepId}
          />
        </div>
      </div>
    </div>
  );
}

export default EnhancedTimelineViewer;
