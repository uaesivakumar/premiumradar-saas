/**
 * Debug Controls Component
 * Sprint S53: Journey Debugger
 *
 * Playback controls: Continue, Step Over, Step Into, Step Out, Restart, Stop
 */
'use client';

import React from 'react';
import type { DebugSessionStatus } from '@/lib/journey-debugger';

// =============================================================================
// TYPES
// =============================================================================

export interface DebugControlsProps {
  status: DebugSessionStatus | 'idle';
  onContinue: () => void;
  onPause: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onRestart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DebugControls({
  status,
  onContinue,
  onPause,
  onStepOver,
  onStepInto,
  onStepOut,
  onRestart,
  onStop,
  disabled = false,
  className = '',
}: DebugControlsProps) {
  const isRunning = status === 'running' || status === 'stepping';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle' || status === 'completed';
  const canStep = isPaused && !disabled;

  return (
    <div className={`debug-controls ${className}`}>
      <div className="control-group">
        {/* Continue / Pause */}
        {isRunning ? (
          <ControlButton
            icon="⏸"
            label="Pause"
            shortcut="F6"
            onClick={onPause}
            disabled={disabled}
          />
        ) : (
          <ControlButton
            icon="▶"
            label="Continue"
            shortcut="F5"
            onClick={onContinue}
            disabled={disabled || isIdle}
            primary
          />
        )}

        {/* Step Over */}
        <ControlButton
          icon="⤵"
          label="Step Over"
          shortcut="F10"
          onClick={onStepOver}
          disabled={!canStep}
        />

        {/* Step Into */}
        <ControlButton
          icon="↓"
          label="Step Into"
          shortcut="F11"
          onClick={onStepInto}
          disabled={!canStep}
        />

        {/* Step Out */}
        <ControlButton
          icon="↑"
          label="Step Out"
          shortcut="⇧F11"
          onClick={onStepOut}
          disabled={!canStep}
        />
      </div>

      <div className="control-divider" />

      <div className="control-group">
        {/* Restart */}
        <ControlButton
          icon="⟳"
          label="Restart"
          shortcut="⌃⇧F5"
          onClick={onRestart}
          disabled={disabled || isIdle}
        />

        {/* Stop */}
        <ControlButton
          icon="■"
          label="Stop"
          onClick={onStop}
          disabled={disabled || isIdle}
          danger
        />
      </div>

      {/* Status indicator */}
      <div className="status-indicator">
        <StatusBadge status={status} />
      </div>

      <style jsx>{`
        .debug-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-secondary, #f5f5f5);
          border-radius: 6px;
        }

        .control-group {
          display: flex;
          gap: 4px;
        }

        .control-divider {
          width: 1px;
          height: 24px;
          background: var(--border-color, #e0e0e0);
          margin: 0 4px;
        }

        .status-indicator {
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// CONTROL BUTTON
// =============================================================================

interface ControlButtonProps {
  icon: string;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}

function ControlButton({
  icon,
  label,
  shortcut,
  onClick,
  disabled = false,
  primary = false,
  danger = false,
}: ControlButtonProps) {
  return (
    <button
      className={`control-btn ${primary ? 'primary' : ''} ${danger ? 'danger' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <span className="btn-icon">{icon}</span>
      <span className="btn-label">{label}</span>

      <style jsx>{`
        .control-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border: 1px solid var(--border-color, #e0e0e0);
          background: var(--bg-primary, white);
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }

        .control-btn:hover:not(:disabled) {
          background: var(--bg-hover, #f0f0f0);
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .control-btn.primary {
          background: var(--accent-color, #3b82f6);
          border-color: var(--accent-color, #3b82f6);
          color: white;
        }

        .control-btn.primary:hover:not(:disabled) {
          background: var(--accent-dark, #2563eb);
        }

        .control-btn.danger {
          border-color: var(--error, #ef4444);
          color: var(--error, #ef4444);
        }

        .control-btn.danger:hover:not(:disabled) {
          background: var(--error-light, #fee2e2);
        }

        .btn-icon {
          font-size: 14px;
        }

        .btn-label {
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .btn-label {
            display: none;
          }
        }
      `}</style>
    </button>
  );
}

// =============================================================================
// STATUS BADGE
// =============================================================================

interface StatusBadgeProps {
  status: DebugSessionStatus | 'idle';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="status-dot" />
      <span className="status-text">{config.label}</span>

      <style jsx>{`
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-idle {
          background: var(--bg-tertiary, #e5e7eb);
          color: var(--text-secondary, #6b7280);
        }
        .status-idle .status-dot {
          background: var(--text-tertiary, #9ca3af);
        }

        .status-running {
          background: var(--success-light, #dcfce7);
          color: var(--success, #16a34a);
        }
        .status-running .status-dot {
          background: var(--success, #16a34a);
          animation: pulse 1s infinite;
        }

        .status-paused {
          background: var(--warning-light, #fef3c7);
          color: var(--warning-dark, #b45309);
        }
        .status-paused .status-dot {
          background: var(--warning, #f59e0b);
        }

        .status-stepping {
          background: var(--accent-light, #dbeafe);
          color: var(--accent-color, #3b82f6);
        }
        .status-stepping .status-dot {
          background: var(--accent-color, #3b82f6);
          animation: pulse 0.5s infinite;
        }

        .status-error {
          background: var(--error-light, #fee2e2);
          color: var(--error, #dc2626);
        }
        .status-error .status-dot {
          background: var(--error, #dc2626);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </span>
  );
}

function getStatusConfig(status: DebugSessionStatus | 'idle'): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'idle':
      return { label: 'Idle', className: 'status-idle' };
    case 'starting':
      return { label: 'Starting', className: 'status-stepping' };
    case 'running':
      return { label: 'Running', className: 'status-running' };
    case 'paused':
      return { label: 'Paused', className: 'status-paused' };
    case 'stepping':
      return { label: 'Stepping', className: 'status-stepping' };
    case 'completed':
      return { label: 'Completed', className: 'status-idle' };
    case 'error':
      return { label: 'Error', className: 'status-error' };
    default:
      return { label: 'Unknown', className: 'status-idle' };
  }
}

export default DebugControls;
