/**
 * Replay Controller Component
 * Sprint S52: Replay Engine
 *
 * Play/Pause/Step/Loop/Speed controls for journey replay.
 */
'use client';

import React from 'react';
import type { ReplaySpeed, ReplayState } from '@/lib/journey-replay';
import { formatReplayTime, REPLAY_SPEED_MULTIPLIERS } from '@/lib/journey-replay';

// =============================================================================
// TYPES
// =============================================================================

export interface ReplayControllerProps {
  state: ReplayState;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onLoopToggle?: () => void;
  onSeek?: (timeMs: number) => void;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReplayController({
  state,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSpeedChange,
  onLoopToggle,
  onSeek,
  className = '',
}: ReplayControllerProps) {
  const isPlaying = state.status === 'playing';
  const isPaused = state.status === 'paused' || state.status === 'ready';
  const isCompleted = state.status === 'completed';

  const speedOptions: ReplaySpeed[] = ['0.25x', '0.5x', '1x', '2x', '4x', 'instant'];

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const timeMs = (percent / 100) * state.totalDurationMs;
    onSeek?.(timeMs);
  };

  return (
    <div className={`replay-controller ${className}`}>
      {/* Progress Bar */}
      <div className="replay-progress">
        <input
          type="range"
          min="0"
          max="100"
          value={state.progress}
          onChange={handleSeek}
          className="replay-scrubber"
          aria-label="Replay progress"
        />
        <div className="replay-time-display">
          <span className="current-time">{formatReplayTime(state.currentTimeMs)}</span>
          <span className="time-separator">/</span>
          <span className="total-time">{formatReplayTime(state.totalDurationMs)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="replay-main-controls">
        {/* Step Back */}
        <button
          onClick={onStepBackward}
          disabled={state.currentEventIndex <= 0}
          className="replay-btn replay-btn-step"
          title="Step backward (←)"
          aria-label="Step backward"
        >
          <StepBackIcon />
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="replay-btn replay-btn-play"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Step Forward */}
        <button
          onClick={onStepForward}
          disabled={state.currentEventIndex >= state.totalEvents}
          className="replay-btn replay-btn-step"
          title="Step forward (→)"
          aria-label="Step forward"
        >
          <StepForwardIcon />
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="replay-btn replay-btn-reset"
          title="Reset (Home)"
          aria-label="Reset"
        >
          <ResetIcon />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="replay-secondary-controls">
        {/* Speed Selector */}
        <div className="replay-speed-control">
          <label htmlFor="replay-speed" className="replay-speed-label">
            Speed:
          </label>
          <select
            id="replay-speed"
            value={state.config.speed}
            onChange={(e) => onSpeedChange(e.target.value as ReplaySpeed)}
            className="replay-speed-select"
          >
            {speedOptions.map((speed) => (
              <option key={speed} value={speed}>
                {speed === 'instant' ? 'Instant' : speed}
              </option>
            ))}
          </select>
        </div>

        {/* Loop Toggle */}
        {onLoopToggle && (
          <button
            onClick={onLoopToggle}
            className={`replay-btn replay-btn-loop ${state.config.loopEnabled ? 'active' : ''}`}
            title="Toggle loop"
            aria-label="Toggle loop"
            aria-pressed={state.config.loopEnabled}
          >
            <LoopIcon />
          </button>
        )}

        {/* Status Indicator */}
        <div className="replay-status">
          <span className={`status-dot status-${state.status}`} />
          <span className="status-text">
            {state.status === 'playing' && 'Playing'}
            {state.status === 'paused' && 'Paused'}
            {state.status === 'ready' && 'Ready'}
            {state.status === 'completed' && 'Completed'}
            {state.status === 'loading' && 'Loading...'}
            {state.status === 'error' && 'Error'}
          </span>
        </div>
      </div>

      {/* Step Counter */}
      <div className="replay-step-counter">
        <span>
          Step {state.currentStepIndex + 1} of {state.totalSteps}
        </span>
        <span className="event-counter">
          ({state.currentEventIndex} / {state.totalEvents} events)
        </span>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="replay-shortcuts-hint">
        <kbd>Space</kbd> Play/Pause
        <kbd>←</kbd><kbd>→</kbd> Step
        <kbd>+</kbd><kbd>-</kbd> Speed
      </div>

      <style jsx>{`
        .replay-controller {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--bg-secondary, #f5f5f5);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .replay-progress {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .replay-scrubber {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          background: var(--bg-tertiary, #e0e0e0);
          border-radius: 4px;
          cursor: pointer;
        }

        .replay-scrubber::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--accent-color, #3b82f6);
          border-radius: 50%;
          cursor: pointer;
        }

        .replay-time-display {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary, #666);
          font-family: monospace;
        }

        .replay-main-controls {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .replay-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .replay-btn:hover:not(:disabled) {
          background: var(--bg-hover, #f0f0f0);
          border-color: var(--accent-color, #3b82f6);
        }

        .replay-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .replay-btn-play {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--accent-color, #3b82f6);
          border-color: var(--accent-color, #3b82f6);
          color: white;
        }

        .replay-btn-play:hover:not(:disabled) {
          background: var(--accent-hover, #2563eb);
        }

        .replay-btn-step {
          width: 40px;
          height: 40px;
        }

        .replay-btn-reset {
          width: 36px;
          height: 36px;
        }

        .replay-btn-loop.active {
          background: var(--accent-light, #dbeafe);
          border-color: var(--accent-color, #3b82f6);
          color: var(--accent-color, #3b82f6);
        }

        .replay-secondary-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .replay-speed-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .replay-speed-label {
          font-size: 12px;
          color: var(--text-secondary, #666);
        }

        .replay-speed-select {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          background: white;
          font-size: 12px;
        }

        .replay-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-playing { background: #22c55e; }
        .status-paused { background: #f59e0b; }
        .status-ready { background: #3b82f6; }
        .status-completed { background: #8b5cf6; }
        .status-loading { background: #6b7280; animation: pulse 1s infinite; }
        .status-error { background: #ef4444; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .replay-step-counter {
          text-align: center;
          font-size: 13px;
          color: var(--text-secondary, #666);
        }

        .event-counter {
          font-size: 11px;
          color: var(--text-tertiary, #999);
          margin-left: 8px;
        }

        .replay-shortcuts-hint {
          display: flex;
          justify-content: center;
          gap: 12px;
          font-size: 11px;
          color: var(--text-tertiary, #999);
        }

        .replay-shortcuts-hint kbd {
          padding: 2px 6px;
          background: var(--bg-tertiary, #e0e0e0);
          border-radius: 3px;
          font-family: monospace;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function StepBackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
    </svg>
  );
}

function StepForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    </svg>
  );
}

function LoopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
    </svg>
  );
}

export default ReplayController;
