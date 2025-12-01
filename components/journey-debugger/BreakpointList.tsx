/**
 * Breakpoint List Component
 * Sprint S53: Journey Debugger
 *
 * Displays and manages breakpoints.
 */
'use client';

import React, { useState } from 'react';
import type { Breakpoint, BreakpointType } from '@/lib/journey-debugger';

// =============================================================================
// TYPES
// =============================================================================

export interface BreakpointListProps {
  breakpoints: Breakpoint[];
  onAdd: (config: { type: BreakpointType; stepId?: string; condition?: string; logMessage?: string }) => void;
  onRemove: (breakpointId: string) => void;
  onToggle: (breakpointId: string) => void;
  onEdit?: (breakpointId: string, updates: Partial<Breakpoint>) => void;
  selectedStepId?: string | null;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BreakpointList({
  breakpoints,
  onAdd,
  onRemove,
  onToggle,
  onEdit,
  selectedStepId,
  className = '',
}: BreakpointListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBreakpoint, setNewBreakpoint] = useState({
    type: 'step' as BreakpointType,
    stepId: '',
    condition: '',
    logMessage: '',
  });

  const handleAdd = () => {
    if (newBreakpoint.type === 'step' && !newBreakpoint.stepId) return;
    if (newBreakpoint.type === 'conditional' && !newBreakpoint.condition) return;
    if (newBreakpoint.type === 'logpoint' && !newBreakpoint.logMessage) return;

    onAdd({
      type: newBreakpoint.type,
      stepId: newBreakpoint.stepId || selectedStepId || undefined,
      condition: newBreakpoint.condition || undefined,
      logMessage: newBreakpoint.logMessage || undefined,
    });

    setNewBreakpoint({ type: 'step', stepId: '', condition: '', logMessage: '' });
    setShowAddForm(false);
  };

  return (
    <div className={`breakpoint-list ${className}`}>
      {/* Header */}
      <div className="list-header">
        <h3>Breakpoints</h3>
        <button
          className="add-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          title="Add breakpoint"
        >
          {showAddForm ? '✕' : '+'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="add-form">
          <select
            value={newBreakpoint.type}
            onChange={(e) => setNewBreakpoint({ ...newBreakpoint, type: e.target.value as BreakpointType })}
          >
            <option value="step">Step Breakpoint</option>
            <option value="conditional">Conditional</option>
            <option value="logpoint">Logpoint</option>
            <option value="error">Error Breakpoint</option>
          </select>

          {(newBreakpoint.type === 'step' || newBreakpoint.type === 'conditional' || newBreakpoint.type === 'logpoint') && (
            <input
              type="text"
              placeholder="Step ID"
              value={newBreakpoint.stepId}
              onChange={(e) => setNewBreakpoint({ ...newBreakpoint, stepId: e.target.value })}
            />
          )}

          {newBreakpoint.type === 'conditional' && (
            <input
              type="text"
              placeholder="Condition (e.g., count > 5)"
              value={newBreakpoint.condition}
              onChange={(e) => setNewBreakpoint({ ...newBreakpoint, condition: e.target.value })}
            />
          )}

          {newBreakpoint.type === 'logpoint' && (
            <input
              type="text"
              placeholder="Log message (use {var} for interpolation)"
              value={newBreakpoint.logMessage}
              onChange={(e) => setNewBreakpoint({ ...newBreakpoint, logMessage: e.target.value })}
            />
          )}

          <button className="confirm-btn" onClick={handleAdd}>
            Add
          </button>
        </div>
      )}

      {/* Breakpoint Items */}
      <div className="breakpoint-items">
        {breakpoints.length === 0 ? (
          <div className="empty-state">
            <span>No breakpoints set</span>
            <span className="hint">Click + to add a breakpoint</span>
          </div>
        ) : (
          breakpoints.map((bp) => (
            <BreakpointItem
              key={bp.id}
              breakpoint={bp}
              onToggle={() => onToggle(bp.id)}
              onRemove={() => onRemove(bp.id)}
              isActive={bp.stepId === selectedStepId}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .breakpoint-list {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          overflow: hidden;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-secondary, #f5f5f5);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .list-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
        }

        .add-btn {
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          background: var(--accent-color, #3b82f6);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }

        .add-btn:hover {
          background: var(--accent-dark, #2563eb);
        }

        .add-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: var(--bg-tertiary, #f0f0f0);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .add-form select,
        .add-form input {
          padding: 6px 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          font-size: 12px;
        }

        .confirm-btn {
          padding: 6px 12px;
          background: var(--accent-color, #3b82f6);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .breakpoint-items {
          flex: 1;
          overflow-y: auto;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: var(--text-tertiary, #999);
          font-size: 12px;
        }

        .hint {
          margin-top: 4px;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// BREAKPOINT ITEM
// =============================================================================

interface BreakpointItemProps {
  breakpoint: Breakpoint;
  onToggle: () => void;
  onRemove: () => void;
  isActive?: boolean;
}

function BreakpointItem({
  breakpoint,
  onToggle,
  onRemove,
  isActive = false,
}: BreakpointItemProps) {
  const typeConfig = getTypeConfig(breakpoint.type);

  return (
    <div className={`breakpoint-item ${isActive ? 'active' : ''} ${!breakpoint.enabled ? 'disabled' : ''}`}>
      <button
        className="toggle-btn"
        onClick={onToggle}
        title={breakpoint.enabled ? 'Disable breakpoint' : 'Enable breakpoint'}
      >
        <span className={`breakpoint-dot ${typeConfig.color}`} />
      </button>

      <div className="breakpoint-info">
        <div className="breakpoint-type">
          <span className="type-icon">{typeConfig.icon}</span>
          <span className="type-label">{typeConfig.label}</span>
        </div>

        {breakpoint.stepId && (
          <div className="breakpoint-location">
            Step: {breakpoint.stepId.substring(0, 8)}...
          </div>
        )}

        {breakpoint.condition && (
          <div className="breakpoint-condition">
            if: {breakpoint.condition}
          </div>
        )}

        {breakpoint.logMessage && (
          <div className="breakpoint-log">
            log: {breakpoint.logMessage}
          </div>
        )}

        {breakpoint.hitCount > 0 && (
          <div className="hit-count">
            Hits: {breakpoint.hitCount}
          </div>
        )}
      </div>

      <button
        className="remove-btn"
        onClick={onRemove}
        title="Remove breakpoint"
      >
        ✕
      </button>

      <style jsx>{`
        .breakpoint-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          transition: background 0.15s;
        }

        .breakpoint-item:hover {
          background: var(--bg-hover, #f5f5f5);
        }

        .breakpoint-item.active {
          background: var(--accent-light, #dbeafe);
        }

        .breakpoint-item.disabled {
          opacity: 0.6;
        }

        .toggle-btn {
          padding: 4px;
          border: none;
          background: none;
          cursor: pointer;
        }

        .breakpoint-dot {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid;
        }

        .breakpoint-dot.red {
          background: var(--error, #ef4444);
          border-color: var(--error-dark, #dc2626);
        }

        .breakpoint-dot.yellow {
          background: var(--warning, #f59e0b);
          border-color: var(--warning-dark, #d97706);
        }

        .breakpoint-dot.blue {
          background: var(--accent-color, #3b82f6);
          border-color: var(--accent-dark, #2563eb);
        }

        .breakpoint-info {
          flex: 1;
          min-width: 0;
        }

        .breakpoint-type {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .type-icon {
          font-size: 11px;
        }

        .breakpoint-location,
        .breakpoint-condition,
        .breakpoint-log {
          font-size: 11px;
          color: var(--text-secondary, #666);
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hit-count {
          font-size: 10px;
          color: var(--text-tertiary, #999);
        }

        .remove-btn {
          padding: 4px;
          border: none;
          background: none;
          color: var(--text-tertiary, #999);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .breakpoint-item:hover .remove-btn {
          opacity: 1;
        }

        .remove-btn:hover {
          color: var(--error, #ef4444);
        }
      `}</style>
    </div>
  );
}

function getTypeConfig(type: BreakpointType): {
  icon: string;
  label: string;
  color: string;
} {
  switch (type) {
    case 'step':
      return { icon: '●', label: 'Step', color: 'red' };
    case 'conditional':
      return { icon: '?', label: 'Conditional', color: 'yellow' };
    case 'logpoint':
      return { icon: '◇', label: 'Logpoint', color: 'blue' };
    case 'error':
      return { icon: '!', label: 'Error', color: 'red' };
    case 'context_change':
      return { icon: '≠', label: 'Context Change', color: 'yellow' };
    default:
      return { icon: '●', label: 'Unknown', color: 'red' };
  }
}

export default BreakpointList;
