/**
 * Replay Step Detail Component
 * Sprint S52: Replay Engine
 *
 * Shows AI prompt/response, context diff, and metrics for a step.
 */
'use client';

import React, { useState } from 'react';
import type { ReplayStep, ReplayEvent } from '@/lib/journey-replay';
import type { ContextDiffEntry } from '@/lib/timeline-viewer';
import { formatReplayTime, getEventIcon, getContextChangeSummary } from '@/lib/journey-replay';

// =============================================================================
// TYPES
// =============================================================================

export interface ReplayStepDetailProps {
  step: ReplayStep | null;
  events?: ReplayEvent[];
  className?: string;
}

type TabId = 'overview' | 'ai' | 'context' | 'events' | 'errors';

// =============================================================================
// COMPONENT
// =============================================================================

export function ReplayStepDetail({
  step,
  events = [],
  className = '',
}: ReplayStepDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (!step) {
    return (
      <div className={`replay-step-detail replay-step-detail-empty ${className}`}>
        <div className="empty-message">Select a step to view details</div>
      </div>
    );
  }

  const stepEvents = events.length > 0 ? events : step.events;
  const hasAI = !!step.aiLog;
  const hasContext = step.contextDiff && step.contextDiff.length > 0;
  const hasErrors = step.errors.length > 0;

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai', label: 'AI', count: hasAI ? 1 : undefined },
    { id: 'context', label: 'Context', count: step.contextDiff?.length },
    { id: 'events', label: 'Events', count: stepEvents.length },
    { id: 'errors', label: 'Errors', count: step.errors.length || undefined },
  ];

  return (
    <div className={`replay-step-detail ${className}`}>
      {/* Header */}
      <div className="step-detail-header">
        <div className="step-info">
          <span className={`step-status step-status-${step.status}`}>
            {step.status}
          </span>
          <h3 className="step-name">{step.stepName}</h3>
          <span className="step-type">{step.stepType}</span>
        </div>
        <div className="step-timing">
          <span className="duration">{formatReplayTime(step.durationMs)}</span>
          {step.tokens && <span className="tokens">{step.tokens} tokens</span>}
          {step.costMicros && (
            <span className="cost">${(step.costMicros / 1000000).toFixed(4)}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="step-detail-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="step-detail-content">
        {activeTab === 'overview' && <OverviewTab step={step} />}
        {activeTab === 'ai' && <AITab step={step} />}
        {activeTab === 'context' && <ContextTab step={step} />}
        {activeTab === 'events' && <EventsTab events={stepEvents} />}
        {activeTab === 'errors' && <ErrorsTab errors={step.errors} />}
      </div>

      <style jsx>{`
        .replay-step-detail {
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary, #f5f5f5);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          overflow: hidden;
        }

        .replay-step-detail-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .empty-message {
          color: var(--text-tertiary, #999);
        }

        .step-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background: var(--bg-primary, white);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .step-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-status {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .step-status-completed {
          background: var(--success-light, #dcfce7);
          color: var(--success, #16a34a);
        }

        .step-status-failed {
          background: var(--error-light, #fee2e2);
          color: var(--error, #dc2626);
        }

        .step-status-skipped {
          background: var(--warning-light, #fef3c7);
          color: var(--warning, #d97706);
        }

        .step-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .step-type {
          font-size: 12px;
          color: var(--text-tertiary, #999);
          padding: 2px 6px;
          background: var(--bg-tertiary, #e0e0e0);
          border-radius: 3px;
        }

        .step-timing {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-secondary, #666);
        }

        .duration {
          font-family: monospace;
          font-weight: 500;
        }

        .tokens, .cost {
          color: var(--text-tertiary, #999);
        }

        .step-detail-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          background: var(--bg-tertiary, #e8e8e8);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .tab-btn {
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tab-btn:hover {
          background: var(--bg-hover, rgba(0, 0, 0, 0.05));
        }

        .tab-btn.active {
          background: var(--bg-primary, white);
          font-weight: 500;
        }

        .tab-count {
          font-size: 11px;
          padding: 1px 5px;
          background: var(--accent-light, #dbeafe);
          color: var(--accent-color, #3b82f6);
          border-radius: 10px;
        }

        .step-detail-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// TAB COMPONENTS
// =============================================================================

function OverviewTab({ step }: { step: ReplayStep }) {
  return (
    <div className="tab-overview">
      <div className="overview-section">
        <h4>Input</h4>
        <pre className="code-block">
          {JSON.stringify(step.originalStep.inputData, null, 2) || 'No input data'}
        </pre>
      </div>

      <div className="overview-section">
        <h4>Output</h4>
        <pre className="code-block">
          {JSON.stringify(step.originalStep.outputData, null, 2) || 'No output data'}
        </pre>
      </div>

      {step.originalStep.decision && (
        <div className="overview-section">
          <h4>Decision</h4>
          <pre className="code-block">
            {JSON.stringify(step.originalStep.decision, null, 2)}
          </pre>
          {step.originalStep.decisionReason && (
            <p className="decision-reason">{step.originalStep.decisionReason}</p>
          )}
        </div>
      )}

      {step.fallbackTriggered && (
        <div className="overview-section fallback-section">
          <h4>Fallback Triggered</h4>
          <p>Strategy: {step.fallbackStrategy}</p>
        </div>
      )}

      <style jsx>{`
        .tab-overview {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .overview-section h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-secondary, #666);
        }

        .code-block {
          background: var(--bg-primary, white);
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          overflow-x: auto;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .decision-reason {
          margin-top: 8px;
          font-size: 13px;
          color: var(--text-secondary, #666);
          font-style: italic;
        }

        .fallback-section {
          background: var(--warning-light, #fef3c7);
          padding: 12px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

function AITab({ step }: { step: ReplayStep }) {
  const aiLog = step.aiLog;

  if (!aiLog) {
    return (
      <div className="tab-empty">
        <p>No AI execution for this step</p>
      </div>
    );
  }

  return (
    <div className="tab-ai">
      <div className="ai-section">
        <h4>Model</h4>
        <p className="model-info">{aiLog.modelId || 'Unknown'}</p>
      </div>

      {aiLog.systemPrompt && (
        <div className="ai-section">
          <h4>System Prompt</h4>
          <pre className="prompt-block">{aiLog.systemPrompt}</pre>
        </div>
      )}

      {aiLog.userPrompt && (
        <div className="ai-section">
          <h4>User Prompt</h4>
          <pre className="prompt-block">{aiLog.userPrompt}</pre>
        </div>
      )}

      {aiLog.response && (
        <div className="ai-section">
          <h4>Response</h4>
          <pre className="response-block">{aiLog.response}</pre>
        </div>
      )}

      {aiLog.selectedOutcome && (
        <div className="ai-section decision-section">
          <h4>AI Decision</h4>
          <div className="decision-info">
            <span className="outcome">{aiLog.selectedOutcome}</span>
            {aiLog.confidence && (
              <span className="confidence">
                {Math.round(aiLog.confidence * 100)}% confidence
              </span>
            )}
          </div>
          {aiLog.reasoning && (
            <p className="reasoning">{aiLog.reasoning}</p>
          )}
        </div>
      )}

      <div className="ai-metrics">
        <div className="metric">
          <span className="metric-label">Input Tokens</span>
          <span className="metric-value">{aiLog.inputTokens || 0}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Output Tokens</span>
          <span className="metric-value">{aiLog.outputTokens || 0}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Latency</span>
          <span className="metric-value">{aiLog.latencyMs || 0}ms</span>
        </div>
        <div className="metric">
          <span className="metric-label">Cost</span>
          <span className="metric-value">${((aiLog.costMicros || 0) / 1000000).toFixed(4)}</span>
        </div>
      </div>

      <style jsx>{`
        .tab-ai {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tab-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          color: var(--text-tertiary, #999);
        }

        .ai-section h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-secondary, #666);
        }

        .model-info {
          font-family: monospace;
          color: var(--accent-color, #3b82f6);
        }

        .prompt-block, .response-block {
          background: var(--bg-primary, white);
          padding: 12px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          overflow-x: auto;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 200px;
          overflow-y: auto;
        }

        .response-block {
          background: var(--success-light, #dcfce7);
        }

        .decision-section {
          background: var(--accent-light, #dbeafe);
          padding: 12px;
          border-radius: 4px;
        }

        .decision-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .outcome {
          font-weight: 600;
          font-size: 14px;
        }

        .confidence {
          font-size: 12px;
          color: var(--text-secondary, #666);
        }

        .reasoning {
          margin-top: 8px;
          font-size: 13px;
          color: var(--text-secondary, #666);
        }

        .ai-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .metric {
          background: var(--bg-primary, white);
          padding: 12px;
          border-radius: 4px;
          text-align: center;
        }

        .metric-label {
          display: block;
          font-size: 11px;
          color: var(--text-tertiary, #999);
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 14px;
          font-weight: 500;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

function ContextTab({ step }: { step: ReplayStep }) {
  const diff = step.contextDiff;

  if (!diff || diff.length === 0) {
    return (
      <div className="tab-empty">
        <p>No context changes for this step</p>
      </div>
    );
  }

  const summary = getContextChangeSummary(diff);

  return (
    <div className="tab-context">
      <div className="context-summary">
        <span className="summary-label">Changes:</span>
        <span className="summary-value">{summary.summary}</span>
      </div>

      <div className="diff-list">
        {diff.map((entry, index) => (
          <div key={index} className={`diff-entry diff-${entry.operation}`}>
            <span className="diff-operation">
              {entry.operation === 'added' ? '+' : entry.operation === 'removed' ? '-' : '~'}
            </span>
            <span className="diff-path">{entry.path}</span>
            {entry.operation !== 'added' && entry.oldValue !== undefined && (
              <span className="diff-old">{formatValue(entry.oldValue)}</span>
            )}
            {entry.operation !== 'removed' && entry.newValue !== undefined && (
              <span className="diff-new">{formatValue(entry.newValue)}</span>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .tab-context {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tab-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          color: var(--text-tertiary, #999);
        }

        .context-summary {
          display: flex;
          gap: 8px;
          font-size: 13px;
        }

        .summary-label {
          color: var(--text-secondary, #666);
        }

        .summary-value {
          font-family: monospace;
        }

        .diff-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .diff-entry {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-primary, white);
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
        }

        .diff-added {
          background: var(--success-light, #dcfce7);
        }

        .diff-removed {
          background: var(--error-light, #fee2e2);
        }

        .diff-changed {
          background: var(--warning-light, #fef3c7);
        }

        .diff-operation {
          width: 16px;
          font-weight: bold;
        }

        .diff-added .diff-operation { color: var(--success, #16a34a); }
        .diff-removed .diff-operation { color: var(--error, #dc2626); }
        .diff-changed .diff-operation { color: var(--warning, #d97706); }

        .diff-path {
          flex: 1;
          font-weight: 500;
        }

        .diff-old {
          color: var(--error, #dc2626);
          text-decoration: line-through;
        }

        .diff-new {
          color: var(--success, #16a34a);
        }
      `}</style>
    </div>
  );
}

function EventsTab({ events }: { events: ReplayEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="tab-empty">
        <p>No events for this step</p>
      </div>
    );
  }

  return (
    <div className="tab-events">
      {events.map((event) => (
        <div key={event.id} className="event-entry">
          <span className="event-icon">{getEventIcon(event.type)}</span>
          <span className="event-type">{event.type}</span>
          <span className="event-time">{formatReplayTime(event.timestamp)}</span>
        </div>
      ))}

      <style jsx>{`
        .tab-events {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tab-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          color: var(--text-tertiary, #999);
        }

        .event-entry {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-primary, white);
          border-radius: 4px;
        }

        .event-icon {
          font-size: 14px;
        }

        .event-type {
          flex: 1;
          font-size: 12px;
          font-family: monospace;
        }

        .event-time {
          font-size: 11px;
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

function ErrorsTab({ errors }: { errors: ReplayStep['errors'] }) {
  if (errors.length === 0) {
    return (
      <div className="tab-empty">
        <p>No errors for this step</p>
      </div>
    );
  }

  return (
    <div className="tab-errors">
      {errors.map((error) => (
        <div key={error.id} className={`error-entry ${error.recovered ? 'recovered' : ''}`}>
          <div className="error-header">
            <span className="error-code">{error.errorCode}</span>
            {error.recovered && <span className="error-recovered">Recovered</span>}
          </div>
          <p className="error-message">{error.message}</p>
          {error.stacktrace && (
            <pre className="error-stack">{error.stacktrace}</pre>
          )}
        </div>
      ))}

      <style jsx>{`
        .tab-errors {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tab-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          color: var(--text-tertiary, #999);
        }

        .error-entry {
          padding: 12px;
          background: var(--error-light, #fee2e2);
          border-radius: 4px;
          border-left: 3px solid var(--error, #ef4444);
        }

        .error-entry.recovered {
          background: var(--warning-light, #fef3c7);
          border-left-color: var(--warning, #f59e0b);
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .error-code {
          font-weight: 600;
          font-size: 12px;
          font-family: monospace;
        }

        .error-recovered {
          font-size: 11px;
          padding: 2px 6px;
          background: var(--success-light, #dcfce7);
          color: var(--success, #16a34a);
          border-radius: 3px;
        }

        .error-message {
          margin: 0;
          font-size: 13px;
        }

        .error-stack {
          margin-top: 8px;
          font-size: 10px;
          font-family: monospace;
          background: rgba(0, 0, 0, 0.05);
          padding: 8px;
          border-radius: 3px;
          overflow-x: auto;
          max-height: 100px;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 50);
  return String(value);
}

export default ReplayStepDetail;
