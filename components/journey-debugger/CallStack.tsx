/**
 * Call Stack Component
 * Sprint S53: Journey Debugger
 *
 * Displays the execution call stack.
 */
'use client';

import React from 'react';
import type { CallStackFrame } from '@/lib/journey-debugger';

// =============================================================================
// TYPES
// =============================================================================

export interface CallStackProps {
  frames: CallStackFrame[];
  selectedFrameId?: string | null;
  onSelectFrame?: (frameId: string) => void;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CallStack({
  frames,
  selectedFrameId,
  onSelectFrame,
  className = '',
}: CallStackProps) {
  // Display frames in reverse order (most recent first)
  const displayFrames = [...frames].reverse();

  return (
    <div className={`call-stack ${className}`}>
      {/* Header */}
      <div className="stack-header">
        <h3>Call Stack</h3>
        <span className="frame-count">{frames.length} frames</span>
      </div>

      {/* Frame List */}
      <div className="frame-list">
        {displayFrames.length === 0 ? (
          <div className="empty-state">
            No frames
          </div>
        ) : (
          displayFrames.map((frame, index) => (
            <StackFrame
              key={frame.id}
              frame={frame}
              isSelected={frame.id === selectedFrameId}
              isCurrent={index === 0}
              onClick={() => onSelectFrame?.(frame.id)}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .call-stack {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          overflow: hidden;
        }

        .stack-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-secondary, #f5f5f5);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .stack-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
        }

        .frame-count {
          font-size: 11px;
          color: var(--text-tertiary, #999);
        }

        .frame-list {
          flex: 1;
          overflow-y: auto;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: var(--text-tertiary, #999);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// STACK FRAME
// =============================================================================

interface StackFrameProps {
  frame: CallStackFrame;
  isSelected: boolean;
  isCurrent: boolean;
  onClick?: () => void;
}

function StackFrame({
  frame,
  isSelected,
  isCurrent,
  onClick,
}: StackFrameProps) {
  const statusConfig = getStatusConfig(frame.status);

  return (
    <div
      className={`stack-frame ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
      onClick={onClick}
    >
      <div className="frame-indicator">
        {isCurrent && <span className="current-arrow">→</span>}
        <span className={`status-dot ${statusConfig.color}`} />
      </div>

      <div className="frame-content">
        <div className="frame-name">
          <span className="step-type">{frame.stepType}</span>
          <span className="step-name">{frame.stepName}</span>
        </div>
        <div className="frame-details">
          <span className="step-index">Step {frame.stepIndex}</span>
          <span className="frame-id">{frame.stepId.substring(0, 8)}...</span>
        </div>
      </div>

      <div className="frame-meta">
        <span className={`status-badge ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      <style jsx>{`
        .stack-frame {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          cursor: pointer;
          transition: background 0.15s;
        }

        .stack-frame:hover {
          background: var(--bg-hover, #f5f5f5);
        }

        .stack-frame.selected {
          background: var(--accent-light, #dbeafe);
        }

        .stack-frame.current {
          background: var(--warning-light, #fef3c7);
        }

        .stack-frame.selected.current {
          background: var(--accent-light, #dbeafe);
        }

        .frame-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 24px;
        }

        .current-arrow {
          color: var(--warning, #f59e0b);
          font-weight: bold;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.running {
          background: var(--accent-color, #3b82f6);
          animation: pulse 1s infinite;
        }

        .status-dot.completed {
          background: var(--success, #22c55e);
        }

        .status-dot.failed {
          background: var(--error, #ef4444);
        }

        .status-dot.skipped {
          background: var(--text-tertiary, #9ca3af);
        }

        .frame-content {
          flex: 1;
          min-width: 0;
        }

        .frame-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .step-type {
          padding: 1px 4px;
          background: var(--bg-tertiary, #e5e7eb);
          border-radius: 2px;
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-secondary, #666);
        }

        .step-name {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .frame-details {
          display: flex;
          gap: 8px;
          margin-top: 2px;
          font-size: 10px;
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }

        .frame-meta {
          flex-shrink: 0;
        }

        .status-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.running {
          background: var(--accent-light, #dbeafe);
          color: var(--accent-color, #3b82f6);
        }

        .status-badge.completed {
          background: var(--success-light, #dcfce7);
          color: var(--success, #16a34a);
        }

        .status-badge.failed {
          background: var(--error-light, #fee2e2);
          color: var(--error, #dc2626);
        }

        .status-badge.skipped {
          background: var(--bg-tertiary, #e5e7eb);
          color: var(--text-secondary, #6b7280);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function getStatusConfig(status: CallStackFrame['status']): {
  label: string;
  color: string;
} {
  switch (status) {
    case 'running':
      return { label: 'Running', color: 'running' };
    case 'completed':
      return { label: 'Done', color: 'completed' };
    case 'failed':
      return { label: 'Failed', color: 'failed' };
    case 'skipped':
      return { label: 'Skipped', color: 'skipped' };
    default:
      return { label: 'Unknown', color: 'skipped' };
  }
}

export default CallStack;
