/**
 * Watch Panel Component
 * Sprint S53: Journey Debugger
 *
 * Displays and manages watch expressions.
 */
'use client';

import React, { useState } from 'react';
import type { WatchExpression, WatchEvaluation } from '@/lib/journey-debugger';
import { formatValue, getVariableType } from '@/lib/journey-debugger';

// =============================================================================
// TYPES
// =============================================================================

export interface WatchPanelProps {
  expressions: WatchExpression[];
  evaluations: Map<string, WatchEvaluation>;
  onAdd: (expression: string, name?: string) => void;
  onRemove: (expressionId: string) => void;
  onUpdate: (expressionId: string, expression: string) => void;
  onToggle: (expressionId: string) => void;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WatchPanel({
  expressions,
  evaluations,
  onAdd,
  onRemove,
  onUpdate,
  onToggle,
  className = '',
}: WatchPanelProps) {
  const [newExpression, setNewExpression] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (!newExpression.trim()) return;
    onAdd(newExpression.trim());
    setNewExpression('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  const startEdit = (expr: WatchExpression) => {
    setEditingId(expr.id);
    setEditValue(expr.expression);
  };

  const saveEdit = (expressionId: string) => {
    if (editValue.trim()) {
      onUpdate(expressionId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className={`watch-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <h3>Watch</h3>
      </div>

      {/* Add Expression */}
      <div className="add-expression">
        <input
          type="text"
          placeholder="Add expression..."
          value={newExpression}
          onChange={(e) => setNewExpression(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleAdd} disabled={!newExpression.trim()}>
          +
        </button>
      </div>

      {/* Expression List */}
      <div className="expression-list">
        {expressions.length === 0 ? (
          <div className="empty-state">
            No watch expressions
          </div>
        ) : (
          expressions.map((expr) => {
            const evaluation = evaluations.get(expr.id);
            const isEditing = editingId === expr.id;

            return (
              <div
                key={expr.id}
                className={`expression-item ${!expr.enabled ? 'disabled' : ''} ${evaluation?.error ? 'error' : ''}`}
              >
                <button
                  className="toggle-btn"
                  onClick={() => onToggle(expr.id)}
                  title={expr.enabled ? 'Disable' : 'Enable'}
                >
                  <span className={`checkbox ${expr.enabled ? 'checked' : ''}`} />
                </button>

                <div className="expression-content">
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(expr.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={() => saveEdit(expr.id)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span
                        className="expression-name"
                        onDoubleClick={() => startEdit(expr)}
                        title="Double-click to edit"
                      >
                        {expr.name || expr.expression}
                      </span>
                      {evaluation && (
                        <span className="expression-value">
                          {evaluation.error ? (
                            <span className="error-value">{evaluation.error}</span>
                          ) : (
                            <>
                              <span className="value-type">{evaluation.type}</span>
                              <span className="value-content">
                                {formatValue(evaluation.value, 50)}
                              </span>
                            </>
                          )}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <button
                  className="remove-btn"
                  onClick={() => onRemove(expr.id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .watch-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          overflow: hidden;
        }

        .panel-header {
          padding: 10px 12px;
          background: var(--bg-secondary, #f5f5f5);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .panel-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
        }

        .add-expression {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .add-expression input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
        }

        .add-expression button {
          width: 28px;
          padding: 0;
          border: none;
          background: var(--accent-color, #3b82f6);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .add-expression button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .expression-list {
          flex: 1;
          overflow-y: auto;
        }

        .empty-state {
          padding: 24px;
          text-align: center;
          color: var(--text-tertiary, #999);
          font-size: 12px;
        }

        .expression-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 12px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .expression-item:hover {
          background: var(--bg-hover, #f5f5f5);
        }

        .expression-item.disabled {
          opacity: 0.6;
        }

        .expression-item.error {
          background: var(--error-light, #fee2e2);
        }

        .toggle-btn {
          padding: 2px;
          border: none;
          background: none;
          cursor: pointer;
        }

        .checkbox {
          display: block;
          width: 14px;
          height: 14px;
          border: 2px solid var(--border-color, #d1d5db);
          border-radius: 3px;
        }

        .checkbox.checked {
          background: var(--accent-color, #3b82f6);
          border-color: var(--accent-color, #3b82f6);
        }

        .checkbox.checked::after {
          content: '✓';
          display: block;
          color: white;
          font-size: 10px;
          text-align: center;
          line-height: 10px;
        }

        .expression-content {
          flex: 1;
          min-width: 0;
        }

        .edit-input {
          width: 100%;
          padding: 2px 4px;
          border: 1px solid var(--accent-color, #3b82f6);
          border-radius: 2px;
          font-size: 12px;
          font-family: monospace;
        }

        .expression-name {
          display: block;
          font-size: 12px;
          font-family: monospace;
          color: var(--accent-color, #3b82f6);
          cursor: pointer;
        }

        .expression-value {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
          font-size: 11px;
        }

        .value-type {
          padding: 1px 4px;
          background: var(--bg-tertiary, #e5e7eb);
          border-radius: 2px;
          color: var(--text-secondary, #666);
          font-size: 10px;
        }

        .value-content {
          font-family: monospace;
          color: var(--text-primary, #333);
        }

        .error-value {
          color: var(--error, #dc2626);
          font-style: italic;
        }

        .remove-btn {
          padding: 2px 4px;
          border: none;
          background: none;
          color: var(--text-tertiary, #999);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .expression-item:hover .remove-btn {
          opacity: 1;
        }

        .remove-btn:hover {
          color: var(--error, #ef4444);
        }
      `}</style>
    </div>
  );
}

export default WatchPanel;
