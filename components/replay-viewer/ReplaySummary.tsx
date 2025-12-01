/**
 * Replay Summary Component
 * Sprint S52: Replay Engine
 *
 * Shows total duration, branching, fallback count, and metrics.
 */
'use client';

import React from 'react';
import type { ReplaySummary as ReplaySummaryType, ReplayTimeline } from '@/lib/journey-replay';
import { formatReplayTime } from '@/lib/journey-replay';

// =============================================================================
// TYPES
// =============================================================================

export interface ReplaySummaryProps {
  summary: ReplaySummaryType | null;
  timeline?: ReplayTimeline | null;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReplaySummary({
  summary,
  timeline,
  className = '',
}: ReplaySummaryProps) {
  if (!summary) {
    return (
      <div className={`replay-summary replay-summary-empty ${className}`}>
        <div className="empty-message">No replay data</div>
      </div>
    );
  }

  const statusClass = summary.status === 'success' ? 'success' :
                      summary.status === 'failed' ? 'failed' :
                      summary.status === 'cancelled' ? 'cancelled' : 'running';

  const completionRate = summary.totalSteps > 0
    ? Math.round((summary.completedSteps / summary.totalSteps) * 100)
    : 0;

  return (
    <div className={`replay-summary ${className}`}>
      {/* Header */}
      <div className="summary-header">
        <div className="summary-title">
          <h3>Journey Replay Summary</h3>
          <span className={`status-badge status-${statusClass}`}>
            {summary.status}
          </span>
        </div>
        <div className="summary-duration">
          {formatReplayTime(summary.totalDurationMs)}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="summary-grid">
        {/* Steps */}
        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">📋</span>
            <span className="card-title">Steps</span>
          </div>
          <div className="card-content">
            <div className="progress-ring">
              <CircularProgress
                value={completionRate}
                size={60}
                strokeWidth={6}
              />
              <span className="progress-label">{completionRate}%</span>
            </div>
            <div className="step-stats">
              <div className="stat">
                <span className="stat-value success">{summary.completedSteps}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value error">{summary.failedSteps}</span>
                <span className="stat-label">Failed</span>
              </div>
              <div className="stat">
                <span className="stat-value warning">{summary.skippedSteps}</span>
                <span className="stat-label">Skipped</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Usage */}
        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">🤖</span>
            <span className="card-title">AI Usage</span>
          </div>
          <div className="card-content ai-content">
            <div className="metric-row">
              <span className="metric-label">Calls</span>
              <span className="metric-value">{summary.aiCalls}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Tokens</span>
              <span className="metric-value">{formatTokens(summary.totalTokens)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Cost</span>
              <span className="metric-value">${(summary.totalCostMicros / 1000000).toFixed(4)}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Models</span>
              <span className="metric-value">{summary.modelsUsed.length}</span>
            </div>
          </div>
          {summary.modelsUsed.length > 0 && (
            <div className="models-list">
              {summary.modelsUsed.map((model) => (
                <span key={model} className="model-tag">{model}</span>
              ))}
            </div>
          )}
        </div>

        {/* Decisions & Branching */}
        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">🔀</span>
            <span className="card-title">Decisions</span>
          </div>
          <div className="card-content">
            <div className="metric-row">
              <span className="metric-label">Decision Points</span>
              <span className="metric-value">{summary.decisionPoints}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Branches Taken</span>
              <span className="metric-value">{summary.branchesTaken}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Retries</span>
              <span className="metric-value">{summary.retryCount}</span>
            </div>
          </div>
        </div>

        {/* Fallbacks & Errors */}
        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">⚠️</span>
            <span className="card-title">Recovery</span>
          </div>
          <div className="card-content">
            <div className="metric-row">
              <span className="metric-label">Fallbacks</span>
              <span className="metric-value">
                {summary.fallbacksTriggered}
                {summary.fallbacksSucceeded > 0 && (
                  <span className="metric-sub"> ({summary.fallbacksSucceeded} succeeded)</span>
                )}
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Errors</span>
              <span className="metric-value">
                {summary.errorCount}
                {summary.recoveredErrors > 0 && (
                  <span className="metric-sub success"> ({summary.recoveredErrors} recovered)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Checkpoints */}
        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">✔️</span>
            <span className="card-title">Checkpoints</span>
          </div>
          <div className="card-content">
            <div className="metric-row">
              <span className="metric-label">Required</span>
              <span className="metric-value">{summary.checkpointsRequired}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Approved</span>
              <span className="metric-value success">{summary.checkpointsApproved}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Rejected</span>
              <span className="metric-value error">{summary.checkpointsRejected}</span>
            </div>
          </div>
        </div>

        {/* OS Intelligence */}
        <div className="summary-card">
          <div className="card-header">
            <span className="card-icon">📡</span>
            <span className="card-title">OS Calls</span>
          </div>
          <div className="card-content">
            <div className="metric-row">
              <span className="metric-label">Total</span>
              <span className="metric-value">{summary.osCalls}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Succeeded</span>
              <span className="metric-value success">{summary.osCallsSucceeded}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Failed</span>
              <span className="metric-value error">{summary.osCalls - summary.osCallsSucceeded}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline metrics */}
      {timeline && (
        <div className="timeline-metrics">
          <div className="timeline-metric">
            <span className="timeline-metric-label">Total Events</span>
            <span className="timeline-metric-value">{timeline.events.length}</span>
          </div>
          <div className="timeline-metric">
            <span className="timeline-metric-label">Avg Step Duration</span>
            <span className="timeline-metric-value">
              {formatReplayTime(timeline.metrics.avgStepDurationMs)}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .replay-summary {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: var(--bg-secondary, #f5f5f5);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .replay-summary-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .empty-message {
          color: var(--text-tertiary, #999);
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .summary-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .summary-title h3 {
          margin: 0;
          font-size: 16px;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-success {
          background: var(--success-light, #dcfce7);
          color: var(--success, #16a34a);
        }

        .status-failed {
          background: var(--error-light, #fee2e2);
          color: var(--error, #dc2626);
        }

        .status-cancelled {
          background: var(--warning-light, #fef3c7);
          color: var(--warning, #d97706);
        }

        .status-running {
          background: var(--accent-light, #dbeafe);
          color: var(--accent-color, #3b82f6);
        }

        .summary-duration {
          font-size: 24px;
          font-weight: 600;
          font-family: monospace;
          color: var(--accent-color, #3b82f6);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .summary-card {
          background: var(--bg-primary, white);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .card-icon {
          font-size: 16px;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #666);
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ai-content {
          gap: 6px;
        }

        .progress-ring {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 8px;
        }

        .progress-label {
          position: absolute;
          font-size: 12px;
          font-weight: 600;
        }

        .step-stats {
          display: flex;
          justify-content: space-around;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 600;
        }

        .stat-value.success { color: var(--success, #22c55e); }
        .stat-value.error { color: var(--error, #ef4444); }
        .stat-value.warning { color: var(--warning, #f59e0b); }

        .stat-label {
          font-size: 10px;
          color: var(--text-tertiary, #999);
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-label {
          font-size: 12px;
          color: var(--text-secondary, #666);
        }

        .metric-value {
          font-size: 13px;
          font-weight: 500;
          font-family: monospace;
        }

        .metric-value.success { color: var(--success, #22c55e); }
        .metric-value.error { color: var(--error, #ef4444); }

        .metric-sub {
          font-size: 11px;
          font-weight: normal;
          color: var(--text-tertiary, #999);
        }

        .metric-sub.success { color: var(--success, #22c55e); }

        .models-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .model-tag {
          font-size: 10px;
          padding: 2px 6px;
          background: var(--bg-tertiary, #e0e0e0);
          border-radius: 3px;
          font-family: monospace;
        }

        .timeline-metrics {
          display: flex;
          justify-content: center;
          gap: 24px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .timeline-metric {
          text-align: center;
        }

        .timeline-metric-label {
          display: block;
          font-size: 11px;
          color: var(--text-tertiary, #999);
        }

        .timeline-metric-value {
          font-size: 14px;
          font-weight: 500;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// CIRCULAR PROGRESS
// =============================================================================

function CircularProgress({
  value,
  size,
  strokeWidth,
}: {
  value: number;
  size: number;
  strokeWidth: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#22c55e"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

export default ReplaySummary;
