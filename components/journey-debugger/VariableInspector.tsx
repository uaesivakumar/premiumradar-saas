/**
 * Variable Inspector Component
 * Sprint S53: Journey Debugger
 *
 * Displays context variables in a tree view.
 */
'use client';

import React from 'react';
import type { Variable, VariableScope } from '@/lib/journey-debugger';
import { formatValue, getVariableType, isExpandable } from '@/lib/journey-debugger';

// =============================================================================
// TYPES
// =============================================================================

export interface VariableInspectorProps {
  scopes: VariableScope[];
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  getChildren: (variable: Variable) => Variable[];
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function VariableInspector({
  scopes,
  expandedPaths,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  getChildren,
  className = '',
}: VariableInspectorProps) {
  return (
    <div className={`variable-inspector ${className}`}>
      {/* Header */}
      <div className="inspector-header">
        <h3>Variables</h3>
        <div className="header-actions">
          {onExpandAll && (
            <button onClick={onExpandAll} title="Expand All">
              ↓
            </button>
          )}
          {onCollapseAll && (
            <button onClick={onCollapseAll} title="Collapse All">
              ↑
            </button>
          )}
        </div>
      </div>

      {/* Scopes */}
      <div className="scope-list">
        {scopes.length === 0 ? (
          <div className="empty-state">
            No variables
          </div>
        ) : (
          scopes.map((scope) => (
            <ScopeSection
              key={scope.name}
              scope={scope}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              getChildren={getChildren}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .variable-inspector {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          overflow: hidden;
        }

        .inspector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-secondary, #f5f5f5);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .inspector-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }

        .header-actions button {
          width: 22px;
          height: 22px;
          padding: 0;
          border: 1px solid var(--border-color, #e0e0e0);
          background: var(--bg-primary, white);
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        }

        .header-actions button:hover {
          background: var(--bg-hover, #f0f0f0);
        }

        .scope-list {
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
// SCOPE SECTION
// =============================================================================

interface ScopeSectionProps {
  scope: VariableScope;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  getChildren: (variable: Variable) => Variable[];
}

function ScopeSection({
  scope,
  expandedPaths,
  onToggleExpand,
  getChildren,
}: ScopeSectionProps) {
  const scopePath = scope.name.toLowerCase();
  const isExpanded = expandedPaths.has(scopePath);

  return (
    <div className="scope-section">
      <div
        className="scope-header"
        onClick={() => onToggleExpand(scopePath)}
      >
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="scope-name">{scope.name}</span>
        <span className="var-count">({scope.variables.length})</span>
      </div>

      {isExpanded && (
        <div className="scope-variables">
          {scope.variables.map((variable) => (
            <VariableRow
              key={variable.path}
              variable={variable}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              getChildren={getChildren}
              depth={0}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .scope-section {
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .scope-header {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background: var(--bg-tertiary, #f0f0f0);
          cursor: pointer;
          user-select: none;
        }

        .scope-header:hover {
          background: var(--bg-hover, #e5e5e5);
        }

        .expand-icon {
          font-size: 8px;
          color: var(--text-tertiary, #999);
        }

        .scope-name {
          font-size: 12px;
          font-weight: 600;
        }

        .var-count {
          font-size: 11px;
          color: var(--text-tertiary, #999);
        }

        .scope-variables {
          padding: 4px 0;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// VARIABLE ROW
// =============================================================================

interface VariableRowProps {
  variable: Variable;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  getChildren: (variable: Variable) => Variable[];
  depth: number;
}

function VariableRow({
  variable,
  expandedPaths,
  onToggleExpand,
  getChildren,
  depth,
}: VariableRowProps) {
  const isExpanded = expandedPaths.has(variable.path);
  const children = isExpanded ? getChildren(variable) : [];
  const typeColor = getTypeColor(variable.type);

  return (
    <div className="variable-row-container">
      <div
        className="variable-row"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {variable.expandable ? (
          <button
            className="expand-btn"
            onClick={() => onToggleExpand(variable.path)}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="expand-placeholder" />
        )}

        <span className="var-name">{variable.name}</span>
        <span className="var-colon">:</span>
        <span className={`var-type ${typeColor}`}>{variable.type}</span>
        <span className="var-value">{formatValue(variable.value, 100)}</span>
      </div>

      {isExpanded && children.length > 0 && (
        <div className="children">
          {children.map((child) => (
            <VariableRow
              key={child.path}
              variable={child}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              getChildren={getChildren}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .variable-row-container {
          font-family: monospace;
          font-size: 12px;
        }

        .variable-row {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 12px;
          padding-right: 8px;
        }

        .variable-row:hover {
          background: var(--bg-hover, #f5f5f5);
        }

        .expand-btn {
          width: 16px;
          height: 16px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 8px;
          color: var(--text-tertiary, #999);
        }

        .expand-btn:hover {
          color: var(--text-primary, #333);
        }

        .expand-placeholder {
          width: 16px;
        }

        .var-name {
          color: var(--accent-color, #3b82f6);
        }

        .var-colon {
          color: var(--text-tertiary, #999);
        }

        .var-type {
          font-size: 10px;
          padding: 0 4px;
          border-radius: 2px;
          margin-right: 4px;
        }

        .var-type.string { background: #fef3c7; color: #92400e; }
        .var-type.number { background: #dbeafe; color: #1e40af; }
        .var-type.boolean { background: #dcfce7; color: #166534; }
        .var-type.object { background: #f3e8ff; color: #6b21a8; }
        .var-type.array { background: #fce7f3; color: #9d174d; }
        .var-type.null { background: #e5e7eb; color: #6b7280; }
        .var-type.undefined { background: #e5e7eb; color: #6b7280; }
        .var-type.date { background: #e0e7ff; color: #3730a3; }
        .var-type.function { background: #fee2e2; color: #991b1b; }

        .var-value {
          color: var(--text-secondary, #666);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .children {
          border-left: 1px dashed var(--border-color, #e0e0e0);
          margin-left: 20px;
        }
      `}</style>
    </div>
  );
}

function getTypeColor(type: Variable['type']): string {
  return type;
}

export default VariableInspector;
