/**
 * Debug Panel Component
 * Sprint S53: Journey Debugger
 *
 * Main debug interface combining all debug components.
 */
'use client';

import React, { useState } from 'react';
import { DebugControls } from './DebugControls';
import { BreakpointList } from './BreakpointList';
import { WatchPanel } from './WatchPanel';
import { CallStack } from './CallStack';
import { VariableInspector } from './VariableInspector';
import {
  useDebugSession,
  useBreakpoints,
  useWatchExpressions,
  useVariableInspector,
  useDebugKeyboard,
} from '@/lib/journey-debugger';
import type { JourneyRunStep } from '@/lib/journey-runs';

// =============================================================================
// TYPES
// =============================================================================

export interface DebugPanelProps {
  journeyId: string;
  steps: JourneyRunStep[];
  initialContext?: Record<string, unknown>;
  onStepSelect?: (stepId: string, stepIndex: number) => void;
  className?: string;
}

type TabId = 'variables' | 'watch' | 'breakpoints' | 'callstack';

// =============================================================================
// COMPONENT
// =============================================================================

export function DebugPanel({
  journeyId,
  steps,
  initialContext = {},
  onStepSelect,
  className = '',
}: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('variables');
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  // Debug session hook
  const debug = useDebugSession({
    config: {
      pauseOnStart: true,
      pauseOnError: true,
    },
    onBreakpointHit: (hit) => {
      console.log('Breakpoint hit:', hit);
    },
  });

  // Breakpoints hook
  const breakpoints = useBreakpoints(debug.engine);

  // Watch expressions hook
  const watch = useWatchExpressions(debug.engine, debug.context);

  // Variable inspector hook
  const variables = useVariableInspector(debug.context);

  // Keyboard shortcuts
  useDebugKeyboard({
    onContinue: debug.continue,
    onPause: debug.pause,
    onStepOver: debug.stepOver,
    onStepInto: debug.stepInto,
    onStepOut: debug.stepOut,
    onRestart: debug.restart,
    enabled: debug.session !== null,
  });

  // Start/stop session
  const handleStart = () => {
    debug.startSession(journeyId, steps, initialContext);
  };

  const handleStop = () => {
    debug.stopSession();
  };

  // Handle frame selection
  const handleFrameSelect = (frameId: string) => {
    setSelectedFrameId(frameId);
    const frame = debug.callStack.find((f) => f.id === frameId);
    if (frame && onStepSelect) {
      onStepSelect(frame.stepId, frame.stepIndex);
    }
  };

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'variables', label: 'Variables' },
    { id: 'watch', label: 'Watch', count: watch.expressions.length },
    { id: 'breakpoints', label: 'Breakpoints', count: breakpoints.breakpoints.length },
    { id: 'callstack', label: 'Call Stack', count: debug.callStack.length },
  ];

  return (
    <div className={`debug-panel ${className}`}>
      {/* Header with session controls */}
      <div className="panel-header">
        {debug.session ? (
          <DebugControls
            status={debug.status}
            onContinue={debug.continue}
            onPause={debug.pause}
            onStepOver={debug.stepOver}
            onStepInto={debug.stepInto}
            onStepOut={debug.stepOut}
            onRestart={debug.restart}
            onStop={handleStop}
          />
        ) : (
          <div className="start-controls">
            <button className="start-btn" onClick={handleStart}>
              ▶ Start Debugging
            </button>
            <span className="step-count">{steps.length} steps</span>
          </div>
        )}
      </div>

      {/* Current step info */}
      {debug.session && debug.currentStepId && (
        <div className="current-step">
          <span className="step-label">Current Step:</span>
          <span className="step-index">#{debug.currentStepIndex}</span>
          <span className="step-id">{debug.currentStepId.substring(0, 12)}...</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'variables' && (
          <VariableInspector
            scopes={variables.scopes}
            expandedPaths={variables.expandedPaths}
            onToggleExpand={variables.toggleExpand}
            onExpandAll={variables.expandAll}
            onCollapseAll={variables.collapseAll}
            getChildren={variables.getExpandedChildren}
          />
        )}

        {activeTab === 'watch' && (
          <WatchPanel
            expressions={watch.expressions}
            evaluations={watch.evaluations}
            onAdd={watch.addExpression}
            onRemove={watch.removeExpression}
            onUpdate={watch.updateExpression}
            onToggle={watch.toggleExpression}
          />
        )}

        {activeTab === 'breakpoints' && (
          <BreakpointList
            breakpoints={breakpoints.breakpoints}
            onAdd={breakpoints.addBreakpoint}
            onRemove={breakpoints.removeBreakpoint}
            onToggle={breakpoints.toggleBreakpoint}
            selectedStepId={debug.currentStepId}
          />
        )}

        {activeTab === 'callstack' && (
          <CallStack
            frames={debug.callStack}
            selectedFrameId={selectedFrameId}
            onSelectFrame={handleFrameSelect}
          />
        )}
      </div>

      {/* Error display */}
      {debug.error && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          <span className="error-message">{debug.error}</span>
        </div>
      )}

      <style jsx>{`
        .debug-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          overflow: hidden;
        }

        .panel-header {
          padding: 12px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .start-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .start-btn {
          padding: 8px 16px;
          background: var(--success, #22c55e);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .start-btn:hover {
          background: var(--success-dark, #16a34a);
        }

        .step-count {
          font-size: 12px;
          color: var(--text-tertiary, #999);
        }

        .current-step {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--warning-light, #fef3c7);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          font-size: 12px;
        }

        .step-label {
          color: var(--text-secondary, #666);
        }

        .step-index {
          font-weight: 600;
          color: var(--warning-dark, #b45309);
        }

        .step-id {
          font-family: monospace;
          color: var(--text-tertiary, #999);
        }

        .tab-nav {
          display: flex;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .tab-btn {
          flex: 1;
          padding: 10px 12px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #666);
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
        }

        .tab-btn:hover {
          background: var(--bg-hover, #f5f5f5);
          color: var(--text-primary, #333);
        }

        .tab-btn.active {
          color: var(--accent-color, #3b82f6);
          border-bottom-color: var(--accent-color, #3b82f6);
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          margin-left: 6px;
          background: var(--bg-tertiary, #e5e7eb);
          border-radius: 9px;
          font-size: 10px;
        }

        .tab-btn.active .tab-count {
          background: var(--accent-light, #dbeafe);
          color: var(--accent-color, #3b82f6);
        }

        .tab-content {
          flex: 1;
          overflow: hidden;
        }

        .tab-content > :global(*) {
          height: 100%;
          border: none;
          border-radius: 0;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: var(--error-light, #fee2e2);
          border-top: 1px solid var(--error, #ef4444);
          font-size: 12px;
          color: var(--error-dark, #991b1b);
        }

        .error-icon {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default DebugPanel;
