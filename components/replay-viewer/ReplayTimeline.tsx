/**
 * Replay Timeline Component
 * Sprint S52: Replay Engine
 *
 * Visual timeline driven by replay events.
 * Integrates with S51 Timeline Viewer structure.
 */
'use client';

import React, { useMemo } from 'react';
import type { ReplayStep, ReplayEvent, ReplayTimeline as ReplayTimelineType } from '@/lib/journey-replay';
import { formatReplayTime, getEventIcon } from '@/lib/journey-replay';

// =============================================================================
// TYPES
// =============================================================================

export interface ReplayTimelineProps {
  timeline: ReplayTimelineType | null;
  currentTimeMs: number;
  currentStepIndex: number;
  selectedStepId: string | null;
  onStepClick: (stepId: string) => void;
  onStepHover: (stepId: string | null) => void;
  onTimeClick: (timeMs: number) => void;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReplayTimeline({
  timeline,
  currentTimeMs,
  currentStepIndex,
  selectedStepId,
  onStepClick,
  onStepHover,
  onTimeClick,
  className = '',
}: ReplayTimelineProps) {
  if (!timeline) {
    return (
      <div className={`replay-timeline replay-timeline-empty ${className}`}>
        <div className="empty-message">No replay data loaded</div>
      </div>
    );
  }

  const { steps, totalDurationMs } = timeline;

  // Calculate progress percentage
  const progressPercent = totalDurationMs > 0
    ? (currentTimeMs / totalDurationMs) * 100
    : 0;

  // Handle click on timeline background
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const timeMs = percent * totalDurationMs;
    onTimeClick(timeMs);
  };

  return (
    <div className={`replay-timeline ${className}`}>
      {/* Timeline Header */}
      <div className="timeline-header">
        <span className="timeline-title">Timeline</span>
        <span className="timeline-duration">{formatReplayTime(totalDurationMs)}</span>
      </div>

      {/* Timeline Track */}
      <div className="timeline-track" onClick={handleTimelineClick}>
        {/* Progress Indicator */}
        <div
          className="timeline-progress"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Playhead */}
        <div
          className="timeline-playhead"
          style={{ left: `${progressPercent}%` }}
        />

        {/* Step Blocks */}
        {steps.map((step, index) => {
          const left = totalDurationMs > 0
            ? (step.startTime / totalDurationMs) * 100
            : 0;
          const width = totalDurationMs > 0
            ? ((step.endTime - step.startTime) / totalDurationMs) * 100
            : 0;

          const isCurrent = index === currentStepIndex;
          const isSelected = step.stepId === selectedStepId;
          const isPast = step.endTime < currentTimeMs;
          const isFuture = step.startTime > currentTimeMs;

          return (
            <div
              key={step.id}
              className={`timeline-step
                timeline-step-${step.status}
                ${isCurrent ? 'timeline-step-current' : ''}
                ${isSelected ? 'timeline-step-selected' : ''}
                ${isPast ? 'timeline-step-past' : ''}
                ${isFuture ? 'timeline-step-future' : ''}
              `}
              style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onStepClick(step.stepId);
              }}
              onMouseEnter={() => onStepHover(step.stepId)}
              onMouseLeave={() => onStepHover(null)}
              title={`${step.stepName} (${formatReplayTime(step.durationMs)})`}
            >
              <span className="step-label">{step.stepName}</span>
            </div>
          );
        })}
      </div>

      {/* Time Markers */}
      <div className="timeline-markers">
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="timeline-marker"
            style={{ left: `${percent}%` }}
          >
            <span className="marker-time">
              {formatReplayTime((percent / 100) * totalDurationMs)}
            </span>
          </div>
        ))}
      </div>

      {/* Step List */}
      <div className="timeline-steps-list">
        {steps.map((step, index) => (
          <ReplayStepRow
            key={step.id}
            step={step}
            index={index}
            isCurrent={index === currentStepIndex}
            isSelected={step.stepId === selectedStepId}
            onClick={() => onStepClick(step.stepId)}
            onHover={(hovering) => onStepHover(hovering ? step.stepId : null)}
          />
        ))}
      </div>

      <style jsx>{`
        .replay-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--bg-secondary, #f5f5f5);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .replay-timeline-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .empty-message {
          color: var(--text-tertiary, #999);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timeline-title {
          font-weight: 600;
          font-size: 14px;
        }

        .timeline-duration {
          font-size: 12px;
          color: var(--text-secondary, #666);
          font-family: monospace;
        }

        .timeline-track {
          position: relative;
          height: 60px;
          background: var(--bg-tertiary, #e0e0e0);
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
        }

        .timeline-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--accent-light, #dbeafe);
          transition: width 0.1s ease;
        }

        .timeline-playhead {
          position: absolute;
          top: 0;
          width: 2px;
          height: 100%;
          background: var(--accent-color, #3b82f6);
          transform: translateX(-50%);
          z-index: 10;
        }

        .timeline-playhead::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--accent-color, #3b82f6);
        }

        .timeline-step {
          position: absolute;
          height: 36px;
          top: 12px;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #ccc);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          overflow: hidden;
          z-index: 1;
        }

        .timeline-step:hover {
          z-index: 5;
          transform: scaleY(1.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .timeline-step-completed {
          background: var(--success-light, #dcfce7);
          border-color: var(--success, #22c55e);
        }

        .timeline-step-failed {
          background: var(--error-light, #fee2e2);
          border-color: var(--error, #ef4444);
        }

        .timeline-step-skipped {
          background: var(--warning-light, #fef3c7);
          border-color: var(--warning, #f59e0b);
        }

        .timeline-step-current {
          border-width: 2px;
          border-color: var(--accent-color, #3b82f6);
          z-index: 3;
        }

        .timeline-step-selected {
          background: var(--accent-light, #dbeafe);
          border-color: var(--accent-color, #3b82f6);
          z-index: 4;
        }

        .timeline-step-past {
          opacity: 0.7;
        }

        .timeline-step-future {
          opacity: 0.5;
        }

        .step-label {
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .timeline-markers {
          position: relative;
          height: 20px;
        }

        .timeline-marker {
          position: absolute;
          transform: translateX(-50%);
        }

        .marker-time {
          font-size: 10px;
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }

        .timeline-steps-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// STEP ROW COMPONENT
// =============================================================================

interface ReplayStepRowProps {
  step: ReplayStep;
  index: number;
  isCurrent: boolean;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}

function ReplayStepRow({
  step,
  index,
  isCurrent,
  isSelected,
  onClick,
  onHover,
}: ReplayStepRowProps) {
  const statusIcon = step.status === 'completed' ? '✓' :
                     step.status === 'failed' ? '✗' :
                     step.status === 'skipped' ? '⏭' :
                     step.status === 'running' ? '▶' : '○';

  const statusColor = step.status === 'completed' ? '#22c55e' :
                      step.status === 'failed' ? '#ef4444' :
                      step.status === 'skipped' ? '#f59e0b' :
                      '#6b7280';

  return (
    <div
      className={`step-row ${isCurrent ? 'step-row-current' : ''} ${isSelected ? 'step-row-selected' : ''}`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <span className="step-index">{index + 1}</span>
      <span className="step-status" style={{ color: statusColor }}>{statusIcon}</span>
      <span className="step-name">{step.stepName}</span>
      <span className="step-type">{step.stepType}</span>
      <span className="step-duration">{formatReplayTime(step.durationMs)}</span>
      {step.tokens && <span className="step-tokens">{step.tokens} tok</span>}

      <style jsx>{`
        .step-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: var(--bg-primary, white);
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .step-row:hover {
          background: var(--bg-hover, #f0f0f0);
        }

        .step-row-current {
          border-color: var(--accent-color, #3b82f6);
          background: var(--accent-light, #dbeafe);
        }

        .step-row-selected {
          border-color: var(--accent-color, #3b82f6);
        }

        .step-index {
          width: 24px;
          text-align: center;
          font-size: 12px;
          color: var(--text-tertiary, #999);
        }

        .step-status {
          width: 20px;
          text-align: center;
          font-size: 14px;
        }

        .step-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
        }

        .step-type {
          font-size: 11px;
          color: var(--text-tertiary, #999);
          padding: 2px 6px;
          background: var(--bg-tertiary, #e0e0e0);
          border-radius: 3px;
        }

        .step-duration {
          font-size: 12px;
          font-family: monospace;
          color: var(--text-secondary, #666);
        }

        .step-tokens {
          font-size: 11px;
          color: var(--text-tertiary, #999);
        }
      `}</style>
    </div>
  );
}

export default ReplayTimeline;
