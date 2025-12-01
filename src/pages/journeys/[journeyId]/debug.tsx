/**
 * Journey Debug Page
 * Sprint S53: Journey Debugger
 *
 * Full-page debug IDE with step visualization and debug panel.
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  DebugPanel,
  DebugControls,
  BreakpointList,
  WatchPanel,
  CallStack,
  VariableInspector,
} from '@/components/journey-debugger';
import {
  useDebugSession,
  useBreakpoints,
  useWatchExpressions,
  useVariableInspector,
  useDebugKeyboard,
} from '@/lib/journey-debugger';
import type { JourneyRunStep } from '@/lib/journey-runs';

// =============================================================================
// MOCK DATA (for development)
// =============================================================================

const MOCK_STEPS: JourneyRunStep[] = [
  {
    id: 'step-run-1',
    runId: 'run-123',
    stepId: 'step-1',
    stepType: 'ai_call',
    stepName: 'Analyze Company',
    status: 'completed',
    executionOrder: 0,
    startedAt: new Date(),
    completedAt: new Date(),
    durationMs: 1500,
    inputData: { company: 'Acme Corp' },
    outputData: { industry: 'Technology', size: 'Enterprise' },
    retryCount: 0,
    maxRetries: 3,
    fallbackTriggered: false,
    metadata: {},
    createdAt: new Date(),
  },
  {
    id: 'step-run-2',
    runId: 'run-123',
    stepId: 'step-2',
    stepType: 'condition',
    stepName: 'Check Industry',
    status: 'completed',
    executionOrder: 1,
    startedAt: new Date(),
    completedAt: new Date(),
    durationMs: 50,
    inputData: { industry: 'Technology' },
    outputData: { match: true },
    retryCount: 0,
    maxRetries: 3,
    fallbackTriggered: false,
    metadata: {},
    createdAt: new Date(),
  },
  {
    id: 'step-run-3',
    runId: 'run-123',
    stepId: 'step-3',
    stepType: 'ai_call',
    stepName: 'Generate Outreach',
    status: 'pending',
    executionOrder: 2,
    startedAt: new Date(),
    durationMs: 0,
    inputData: { company: 'Acme Corp', industry: 'Technology' },
    retryCount: 0,
    maxRetries: 3,
    fallbackTriggered: false,
    metadata: {},
    createdAt: new Date(),
  },
  {
    id: 'step-run-4',
    runId: 'run-123',
    stepId: 'step-4',
    stepType: 'action',
    stepName: 'Send Email',
    status: 'pending',
    executionOrder: 3,
    startedAt: new Date(),
    durationMs: 0,
    inputData: {},
    retryCount: 0,
    maxRetries: 3,
    fallbackTriggered: false,
    metadata: {},
    createdAt: new Date(),
  },
];

const MOCK_CONTEXT = {
  company: {
    name: 'Acme Corporation',
    industry: 'Technology',
    size: 'Enterprise',
    revenue: 50000000,
  },
  contact: {
    name: 'John Smith',
    title: 'VP of Sales',
    email: 'john.smith@acme.com',
  },
  signals: [
    { type: 'hiring', score: 0.85 },
    { type: 'expansion', score: 0.72 },
  ],
  score: 87,
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function DebugPage() {
  const router = useRouter();
  const { journeyId } = router.query as { journeyId: string };

  const [steps, setSteps] = useState<JourneyRunStep[]>(MOCK_STEPS);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  // Debug session
  const debug = useDebugSession({
    config: { pauseOnStart: true, pauseOnError: true },
  });

  // Breakpoints
  const breakpoints = useBreakpoints(debug.engine);

  // Watch expressions
  const watch = useWatchExpressions(debug.engine, debug.context);

  // Variables
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

  // Handle step click
  const handleStepClick = useCallback((stepIndex: number) => {
    setSelectedStepIndex(stepIndex);
    if (debug.session && debug.isPaused) {
      debug.jumpToStep(stepIndex);
    }
  }, [debug]);

  // Handle breakpoint toggle on step
  const handleToggleBreakpoint = useCallback((stepId: string, stepIndex: number) => {
    const existing = breakpoints.breakpoints.find(bp => bp.stepId === stepId);
    if (existing) {
      breakpoints.removeBreakpoint(existing.id);
    } else {
      breakpoints.addStepBreakpoint(stepId, stepIndex);
    }
  }, [breakpoints]);

  // Start debugging
  const handleStartDebug = () => {
    debug.startSession(journeyId || 'journey-456', steps, MOCK_CONTEXT);
  };

  if (!journeyId) {
    return (
      <div className="debug-page-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`debug-page layout-${layout}`}>
      {/* Header */}
      <header className="debug-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => router.back()}
            title="Go back"
          >
            ← Back
          </button>
          <h1>Journey Debugger</h1>
          <span className="journey-id">ID: {journeyId.substring(0, 8)}...</span>
        </div>

        <div className="header-center">
          {debug.session ? (
            <DebugControls
              status={debug.status}
              onContinue={debug.continue}
              onPause={debug.pause}
              onStepOver={debug.stepOver}
              onStepInto={debug.stepInto}
              onStepOut={debug.stepOut}
              onRestart={debug.restart}
              onStop={debug.stopSession}
            />
          ) : (
            <button className="start-debug-btn" onClick={handleStartDebug}>
              ▶ Start Debug Session
            </button>
          )}
        </div>

        <div className="header-right">
          <button
            className={`layout-btn ${layout === 'horizontal' ? 'active' : ''}`}
            onClick={() => setLayout('horizontal')}
            title="Horizontal layout"
          >
            ⬜⬜
          </button>
          <button
            className={`layout-btn ${layout === 'vertical' ? 'active' : ''}`}
            onClick={() => setLayout('vertical')}
            title="Vertical layout"
          >
            ⬛
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="debug-main">
        {/* Step List Panel */}
        <div className="steps-panel">
          <div className="panel-title">Steps ({steps.length})</div>
          <div className="steps-list">
            {steps.map((step, index) => {
              const isCurrentStep = debug.currentStepIndex === index;
              const hasBreakpoint = breakpoints.breakpoints.some(bp => bp.stepId === step.id);
              const isSelected = selectedStepIndex === index;

              return (
                <div
                  key={step.id}
                  className={`step-item ${isCurrentStep ? 'current' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleStepClick(index)}
                >
                  <div
                    className={`breakpoint-gutter ${hasBreakpoint ? 'has-breakpoint' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBreakpoint(step.id, index);
                    }}
                  >
                    {hasBreakpoint && <span className="bp-dot">●</span>}
                  </div>

                  {isCurrentStep && <span className="current-indicator">→</span>}

                  <div className="step-info">
                    <div className="step-header">
                      <span className="step-index">#{index}</span>
                      <span className={`step-type ${step.stepType}`}>{step.stepType}</span>
                      <span className="step-name">{step.stepName}</span>
                    </div>
                    <div className="step-meta">
                      <span className={`step-status status-${step.status}`}>
                        {step.status}
                      </span>
                      {step.durationMs && step.durationMs > 0 && (
                        <span className="step-duration">{step.durationMs}ms</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Debug Panel */}
        <div className="debug-sidebar">
          <div className="sidebar-tabs">
            <SidebarTab
              label="Variables"
              active={true}
            >
              <VariableInspector
                scopes={variables.scopes}
                expandedPaths={variables.expandedPaths}
                onToggleExpand={variables.toggleExpand}
                onExpandAll={variables.expandAll}
                onCollapseAll={variables.collapseAll}
                getChildren={variables.getExpandedChildren}
              />
            </SidebarTab>

            <SidebarTab label="Watch">
              <WatchPanel
                expressions={watch.expressions}
                evaluations={watch.evaluations}
                onAdd={watch.addExpression}
                onRemove={watch.removeExpression}
                onUpdate={watch.updateExpression}
                onToggle={watch.toggleExpression}
              />
            </SidebarTab>

            <SidebarTab label="Breakpoints">
              <BreakpointList
                breakpoints={breakpoints.breakpoints}
                onAdd={breakpoints.addBreakpoint}
                onRemove={breakpoints.removeBreakpoint}
                onToggle={breakpoints.toggleBreakpoint}
                selectedStepId={debug.currentStepId}
              />
            </SidebarTab>

            <SidebarTab label="Call Stack">
              <CallStack
                frames={debug.callStack}
                selectedFrameId={null}
                onSelectFrame={() => {}}
              />
            </SidebarTab>
          </div>
        </div>
      </main>

      {/* Keyboard Shortcuts Help */}
      <footer className="debug-footer">
        <div className="shortcuts">
          <span><kbd>F5</kbd> Continue</span>
          <span><kbd>F6</kbd> Pause</span>
          <span><kbd>F10</kbd> Step Over</span>
          <span><kbd>F11</kbd> Step Into</span>
          <span><kbd>⇧F11</kbd> Step Out</span>
        </div>
      </footer>

      <style jsx>{`
        .debug-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-primary, #fafafa);
        }

        .debug-page-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }

        .debug-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: var(--bg-primary, white);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .header-left,
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }

        .back-btn:hover {
          background: var(--bg-hover, #f0f0f0);
        }

        .debug-header h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .journey-id {
          font-size: 12px;
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }

        .start-debug-btn {
          padding: 8px 16px;
          background: var(--success, #22c55e);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }

        .start-debug-btn:hover {
          background: var(--success-dark, #16a34a);
        }

        .layout-btn {
          padding: 6px 10px;
          border: 1px solid var(--border-color, #e0e0e0);
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .layout-btn.active {
          background: var(--accent-light, #dbeafe);
          border-color: var(--accent-color, #3b82f6);
        }

        .debug-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .layout-horizontal .debug-main {
          flex-direction: row;
        }

        .layout-vertical .debug-main {
          flex-direction: column;
        }

        .steps-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border-color, #e0e0e0);
          background: var(--bg-primary, white);
        }

        .layout-vertical .steps-panel {
          border-right: none;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          max-height: 50%;
        }

        .panel-title {
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          background: var(--bg-secondary, #f5f5f5);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .steps-list {
          flex: 1;
          overflow-y: auto;
        }

        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          cursor: pointer;
          transition: background 0.15s;
        }

        .step-item:hover {
          background: var(--bg-hover, #f5f5f5);
        }

        .step-item.current {
          background: var(--warning-light, #fef3c7);
        }

        .step-item.selected {
          background: var(--accent-light, #dbeafe);
        }

        .breakpoint-gutter {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 2px;
        }

        .breakpoint-gutter:hover {
          background: var(--error-light, #fee2e2);
        }

        .bp-dot {
          color: var(--error, #ef4444);
          font-size: 12px;
        }

        .current-indicator {
          color: var(--warning, #f59e0b);
          font-weight: bold;
          font-size: 14px;
        }

        .step-info {
          flex: 1;
          min-width: 0;
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-index {
          font-size: 11px;
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }

        .step-type {
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
          text-transform: uppercase;
          background: var(--bg-tertiary, #e5e7eb);
          color: var(--text-secondary, #666);
        }

        .step-type.ai_call {
          background: var(--accent-light, #dbeafe);
          color: var(--accent-color, #3b82f6);
        }

        .step-type.condition {
          background: var(--warning-light, #fef3c7);
          color: var(--warning-dark, #b45309);
        }

        .step-type.action {
          background: var(--success-light, #dcfce7);
          color: var(--success, #16a34a);
        }

        .step-name {
          font-size: 13px;
          font-weight: 500;
        }

        .step-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          font-size: 11px;
        }

        .step-status {
          padding: 1px 4px;
          border-radius: 2px;
        }

        .status-completed {
          background: var(--success-light, #dcfce7);
          color: var(--success, #16a34a);
        }

        .status-pending {
          background: var(--bg-tertiary, #e5e7eb);
          color: var(--text-secondary, #666);
        }

        .status-running {
          background: var(--accent-light, #dbeafe);
          color: var(--accent-color, #3b82f6);
        }

        .status-failed {
          background: var(--error-light, #fee2e2);
          color: var(--error, #dc2626);
        }

        .step-duration {
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }

        .debug-sidebar {
          width: 400px;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary, white);
        }

        .layout-vertical .debug-sidebar {
          width: 100%;
          flex: 1;
        }

        .sidebar-tabs {
          flex: 1;
          overflow: hidden;
        }

        .debug-footer {
          padding: 8px 24px;
          background: var(--bg-secondary, #f5f5f5);
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .shortcuts {
          display: flex;
          justify-content: center;
          gap: 24px;
          font-size: 11px;
          color: var(--text-tertiary, #999);
        }

        .shortcuts kbd {
          padding: 2px 6px;
          background: var(--bg-primary, white);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 3px;
          font-family: monospace;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// SIDEBAR TAB (simple collapsible)
// =============================================================================

function SidebarTab({
  label,
  active,
  children,
}: {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(active ?? false);

  return (
    <div className="sidebar-tab">
      <button
        className="tab-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="expand-icon">{isOpen ? '▼' : '▶'}</span>
        <span className="tab-label">{label}</span>
      </button>

      {isOpen && (
        <div className="tab-content">
          {children}
        </div>
      )}

      <style jsx>{`
        .sidebar-tab {
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .tab-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: var(--bg-secondary, #f5f5f5);
          cursor: pointer;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }

        .tab-header:hover {
          background: var(--bg-hover, #e5e5e5);
        }

        .expand-icon {
          font-size: 8px;
          color: var(--text-tertiary, #999);
        }

        .tab-content {
          max-height: 300px;
          overflow-y: auto;
        }

        .tab-content > :global(*) {
          border: none;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}
