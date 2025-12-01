/**
 * Zoomable Timeline Component
 * Sprint S51: Timeline Viewer
 *
 * Interactive timeline with zoom, pan, and time scale controls.
 */
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import type { TimelineItem, TimeScale } from '@/lib/timeline-viewer';
import { TIME_SCALE_LABELS, calculateTimeMarkers, formatDuration } from '@/lib/timeline-viewer';

interface ZoomableTimelineProps {
  items: TimelineItem[];
  durationMs: number;
  viewportStart: number;
  viewportEnd: number;
  scale: TimeScale;
  selectedStepId?: string | null;
  currentPlaybackTime?: number;
  onStepSelect?: (stepId: string) => void;
  onViewportChange?: (start: number, end: number) => void;
  onScaleChange?: (scale: TimeScale) => void;
}

export function ZoomableTimeline({
  items,
  durationMs,
  viewportStart,
  viewportEnd,
  scale,
  selectedStepId,
  currentPlaybackTime,
  onStepSelect,
  onViewportChange,
  onScaleChange,
}: ZoomableTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, viewportStart: 0 });
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const viewportDuration = viewportEnd - viewportStart;

  // Calculate time markers
  const markers = calculateTimeMarkers(durationMs, scale, viewportStart, viewportEnd);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mousePercent = mouseX / rect.width;
    const mouseTime = viewportStart + viewportDuration * mousePercent;

    const zoomFactor = e.deltaY > 0 ? 1.2 : 0.8;
    const newDuration = Math.max(1000, Math.min(durationMs, viewportDuration * zoomFactor));

    const newStart = mouseTime - newDuration * mousePercent;
    const newEnd = mouseTime + newDuration * (1 - mousePercent);

    onViewportChange?.(
      Math.max(0, newStart),
      Math.min(durationMs, newEnd)
    );
  }, [viewportStart, viewportDuration, durationMs, onViewportChange]);

  // Handle drag pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, viewportStart });
  }, [viewportStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaTime = (deltaX / rect.width) * viewportDuration;

    const newStart = dragStart.viewportStart - deltaTime;
    const newEnd = newStart + viewportDuration;

    if (newStart >= 0 && newEnd <= durationMs) {
      onViewportChange?.(newStart, newEnd);
    }
  }, [isDragging, dragStart, viewportDuration, durationMs, onViewportChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle step position calculation within viewport
  const getStepPosition = (item: TimelineItem) => {
    const startPercent = ((item.startTime - viewportStart) / viewportDuration) * 100;
    const widthPercent = (item.durationMs / viewportDuration) * 100;

    return {
      left: `${Math.max(0, startPercent)}%`,
      width: `${Math.max(0.5, Math.min(100 - startPercent, widthPercent))}%`,
      visible: item.endTime > viewportStart && item.startTime < viewportEnd,
    };
  };

  // Get step color based on status and type
  const getStepColor = (item: TimelineItem) => {
    if (item.hasError) return 'bg-red-400 hover:bg-red-500';
    if (item.hasFallback) return 'bg-yellow-400 hover:bg-yellow-500';
    if (item.isAI) return 'bg-purple-400 hover:bg-purple-500';
    if (item.isDecision) return 'bg-blue-400 hover:bg-blue-500';
    if (item.isCheckpoint) return 'bg-orange-400 hover:bg-orange-500';
    if (item.status === 'running') return 'bg-blue-400 animate-pulse';
    if (item.status === 'completed') return 'bg-green-400 hover:bg-green-500';
    if (item.status === 'skipped') return 'bg-gray-300 hover:bg-gray-400';
    return 'bg-gray-400 hover:bg-gray-500';
  };

  // Calculate playback position
  const playbackPosition = currentPlaybackTime !== undefined
    ? ((currentPlaybackTime - viewportStart) / viewportDuration) * 100
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Scale selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-700">Timeline</div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Scale:</label>
          <select
            value={scale}
            onChange={(e) => onScaleChange?.(e.target.value as TimeScale)}
            className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {Object.entries(TIME_SCALE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">
            {formatDuration(viewportDuration)}
          </span>
        </div>
      </div>

      {/* Timeline container */}
      <div
        ref={containerRef}
        className={cn(
          'relative h-48 bg-gray-50 rounded border border-gray-200 overflow-hidden',
          isDragging && 'cursor-grabbing',
          !isDragging && 'cursor-grab'
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Time markers */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gray-100 border-b border-gray-200">
          {markers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${marker.position}%` }}
            >
              <span className="text-[10px] text-gray-500 whitespace-nowrap px-1">
                {marker.label}
              </span>
              <div className="w-px h-2 bg-gray-300" />
            </div>
          ))}
        </div>

        {/* Lanes for parallel steps */}
        <div className="absolute top-6 left-0 right-0 bottom-0">
          {/* Group items by lane */}
          {Array.from(new Set(items.map(i => i.lane))).map(lane => (
            <div
              key={lane}
              className="relative h-10 border-b border-gray-100"
              style={{ top: `${lane * 40}px` }}
            >
              {items
                .filter(item => item.lane === lane)
                .map(item => {
                  const pos = getStepPosition(item);
                  if (!pos.visible) return null;

                  const isSelected = selectedStepId === item.stepId;
                  const isHovered = hoveredStep === item.stepId;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'absolute h-8 rounded transition-all cursor-pointer',
                        getStepColor(item),
                        isSelected && 'ring-2 ring-primary-500 ring-offset-1',
                        isHovered && !isSelected && 'ring-1 ring-gray-400',
                        item.isBottleneck && 'ring-2 ring-orange-500'
                      )}
                      style={{
                        left: pos.left,
                        width: pos.width,
                        top: '4px',
                        minWidth: '4px',
                      }}
                      onClick={() => onStepSelect?.(item.stepId)}
                      onMouseEnter={() => setHoveredStep(item.stepId)}
                      onMouseLeave={() => setHoveredStep(null)}
                      title={`${item.stepName} (${formatDuration(item.durationMs)})`}
                    >
                      {/* Step label (shown if wide enough) */}
                      <div className="h-full flex items-center px-1 overflow-hidden">
                        <span className="text-[10px] text-white font-medium truncate">
                          {item.stepName}
                        </span>
                      </div>

                      {/* Bottleneck indicator */}
                      {item.isBottleneck && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white">!</span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Playback position indicator */}
        {playbackPosition !== null && playbackPosition >= 0 && playbackPosition <= 100 && (
          <div
            className="absolute top-6 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: `${playbackPosition}%` }}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredStep && (
          <StepTooltip
            item={items.find(i => i.stepId === hoveredStep)!}
            containerRef={containerRef}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-400" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-purple-400" />
          <span>AI</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-400" />
          <span>Decision</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span>Error</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-400" />
          <span>Fallback</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded ring-2 ring-orange-500 bg-gray-200" />
          <span>Bottleneck</span>
        </div>
      </div>
    </div>
  );
}

// Tooltip component
function StepTooltip({
  item,
  containerRef,
}: {
  item: TimelineItem;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!containerRef.current) return null;

  return (
    <div className="absolute top-1 right-1 bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-20">
      <div className="font-medium">{item.stepName}</div>
      <div className="text-gray-300">{item.stepType}</div>
      <div className="text-gray-300">Duration: {formatDuration(item.durationMs)}</div>
      {item.isBottleneck && (
        <div className="text-orange-300">Bottleneck detected</div>
      )}
      {item.hasError && (
        <div className="text-red-300">{item.errors.length} error(s)</div>
      )}
    </div>
  );
}

export default ZoomableTimeline;
