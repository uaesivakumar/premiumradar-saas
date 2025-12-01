/**
 * Journey Replay Page
 * Sprint S52: Replay Engine
 *
 * Full-page replay viewer with keyboard shortcuts.
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  useReplay,
  useReplayControls,
  useReplayTimeline,
  type ReplaySpeed,
} from '@/lib/journey-replay';
import {
  ReplayController,
  ReplayTimeline,
  ReplayStepDetail,
  ReplaySummary,
} from '@/components/replay-viewer';
import type { JourneyRunDetails } from '@/lib/journey-runs';

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function ReplayPage() {
  const router = useRouter();
  const { journeyId, runId } = router.query as { journeyId: string; runId: string };

  const [viewMode, setViewMode] = useState<'timeline' | 'detail' | 'split'>('split');
  const [showSummary, setShowSummary] = useState(false);

  // Main replay hook
  const replay = useReplay(runId || '', {
    config: {
      speed: '1x',
      includeMetrics: true,
      includeContextDiffs: true,
      includeAILogs: true,
    },
  });

  // Timeline state
  const timelineState = useReplayTimeline({
    timeline: replay.timeline,
    currentTimeMs: replay.state.currentTimeMs,
    currentStepIndex: replay.state.currentStepIndex,
  });

  // Keyboard controls
  const controls = useReplayControls({
    onPlay: replay.play,
    onPause: replay.pause,
    onStepForward: replay.stepForward,
    onStepBackward: replay.stepBackward,
    onSpeedChange: replay.setSpeed,
    onReset: replay.reset,
    enabled: true,
  });

  // Load replay data on mount
  useEffect(() => {
    if (!journeyId || !runId) return;

    async function loadReplayData() {
      try {
        const response = await fetch(
          `/api/journeys/${journeyId}/runs/${runId}/replay`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ includeMetrics: true }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load replay data');
        }

        const data = await response.json();

        // Convert to JourneyRunDetails format for loading
        // In production, this would come from the API
        const mockDetails: JourneyRunDetails = {
          run: {
            id: runId,
            journeyId,
            tenantId: 'tenant-123',
            status: 'success',
            startedAt: new Date(Date.now() - 60000),
            endedAt: new Date(),
            triggeredBy: 'user',
            totalSteps: data.timeline?.steps?.length || 0,
            completedSteps: data.timeline?.metrics?.completedSteps || 0,
            failedSteps: data.timeline?.metrics?.failedSteps || 0,
            skippedSteps: data.timeline?.metrics?.skippedSteps || 0,
            totalDurationMs: data.timeline?.totalDurationMs || 0,
            totalCostMicros: data.timeline?.metrics?.totalCostMicros || 0,
            totalTokens: data.timeline?.metrics?.totalTokens || 0,
            metadata: {},
            tags: [],
            createdAt: new Date(Date.now() - 60000),
            updatedAt: new Date(),
          },
          steps: data.timeline?.steps?.map((s: any) => s.originalStep) || [],
          aiLogs: data.timeline?.steps?.map((s: any) => s.aiLog).filter(Boolean) || [],
          contextSnapshots: [],
          errors: data.timeline?.steps?.flatMap((s: any) => s.errors) || [],
          checkpoints: [],
          transitions: data.timeline?.steps?.flatMap((s: any) => [...s.incomingTransitions, ...s.outgoingTransitions]) || [],
          osCalls: [],
        };

        await replay.load(mockDetails);
      } catch (error) {
        console.error('Failed to load replay:', error);
      }
    }

    loadReplayData();
  }, [journeyId, runId]);

  // Handle step click
  const handleStepClick = useCallback((stepId: string) => {
    const stepIndex = replay.timeline?.steps.findIndex(s => s.stepId === stepId);
    if (stepIndex !== undefined && stepIndex >= 0) {
      replay.jumpToStep(stepIndex);
    }
    timelineState.selectStep(stepId);
  }, [replay, timelineState]);

  // Handle time seek
  const handleTimeSeek = useCallback((timeMs: number) => {
    replay.jumpToTime(timeMs);
  }, [replay]);

  // Handle loop toggle
  const handleLoopToggle = useCallback(() => {
    replay.state.config.loopEnabled = !replay.state.config.loopEnabled;
  }, [replay]);

  if (!journeyId || !runId) {
    return (
      <div className="replay-page-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="replay-page">
      {/* Header */}
      <header className="replay-header">
        <div className="header-left">
          <button
            className="back-btn"
            onClick={() => router.back()}
            title="Go back"
          >
            ← Back
          </button>
          <h1>Journey Replay</h1>
          <span className="run-id">Run: {runId.substring(0, 8)}...</span>
        </div>

        <div className="header-right">
          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              className={viewMode === 'timeline' ? 'active' : ''}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </button>
            <button
              className={viewMode === 'split' ? 'active' : ''}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
            <button
              className={viewMode === 'detail' ? 'active' : ''}
              onClick={() => setViewMode('detail')}
            >
              Detail
            </button>
          </div>

          {/* Summary Toggle */}
          <button
            className={`summary-toggle ${showSummary ? 'active' : ''}`}
            onClick={() => setShowSummary(!showSummary)}
          >
            Summary
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="replay-main">
        {/* Summary Panel */}
        {showSummary && (
          <div className="summary-panel">
            <ReplaySummary
              summary={replay.summary}
              timeline={replay.timeline}
            />
          </div>
        )}

        {/* Content Area */}
        <div className={`replay-content view-${viewMode}`}>
          {/* Timeline Panel */}
          {(viewMode === 'timeline' || viewMode === 'split') && (
            <div className="timeline-panel">
              <ReplayTimeline
                timeline={replay.timeline}
                currentTimeMs={replay.state.currentTimeMs}
                currentStepIndex={replay.state.currentStepIndex}
                selectedStepId={timelineState.selectedStepId}
                onStepClick={handleStepClick}
                onStepHover={timelineState.hoverStep}
                onTimeClick={handleTimeSeek}
              />
            </div>
          )}

          {/* Detail Panel */}
          {(viewMode === 'detail' || viewMode === 'split') && (
            <div className="detail-panel">
              <ReplayStepDetail
                step={replay.currentStep}
                events={replay.currentStep?.events}
              />
            </div>
          )}
        </div>

        {/* Controller */}
        <div className="controller-panel">
          <ReplayController
            state={replay.state}
            onPlay={replay.play}
            onPause={replay.pause}
            onStepForward={replay.stepForward}
            onStepBackward={replay.stepBackward}
            onReset={replay.reset}
            onSpeedChange={replay.setSpeed}
            onLoopToggle={handleLoopToggle}
            onSeek={handleTimeSeek}
          />
        </div>
      </main>

      {/* Error Display */}
      {replay.error && (
        <div className="error-banner">
          <span>Error: {replay.error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Loading Overlay */}
      {replay.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading replay data...</p>
        </div>
      )}

      <style jsx>{`
        .replay-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-primary, #fafafa);
        }

        .replay-page-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }

        .replay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: var(--bg-primary, white);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
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

        .replay-header h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .run-id {
          font-size: 12px;
          color: var(--text-tertiary, #999);
          font-family: monospace;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .view-toggle {
          display: flex;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 4px;
          overflow: hidden;
        }

        .view-toggle button {
          padding: 6px 12px;
          border: none;
          background: transparent;
          font-size: 12px;
          cursor: pointer;
        }

        .view-toggle button:not(:last-child) {
          border-right: 1px solid var(--border-color, #e0e0e0);
        }

        .view-toggle button.active {
          background: var(--accent-color, #3b82f6);
          color: white;
        }

        .summary-toggle {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .summary-toggle.active {
          background: var(--accent-light, #dbeafe);
          border-color: var(--accent-color, #3b82f6);
        }

        .replay-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .summary-panel {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          overflow-y: auto;
          max-height: 40vh;
        }

        .replay-content {
          flex: 1;
          display: flex;
          overflow: hidden;
          padding: 16px 24px;
          gap: 16px;
        }

        .replay-content.view-timeline .timeline-panel {
          flex: 1;
        }

        .replay-content.view-detail .detail-panel {
          flex: 1;
        }

        .replay-content.view-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        .timeline-panel,
        .detail-panel {
          overflow-y: auto;
        }

        .controller-panel {
          padding: 16px 24px;
          border-top: 1px solid var(--border-color, #e0e0e0);
          background: var(--bg-primary, white);
        }

        .error-banner {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: var(--error-light, #fee2e2);
          border: 1px solid var(--error, #ef4444);
          border-radius: 8px;
          z-index: 100;
        }

        .error-banner button {
          padding: 4px 12px;
          border: 1px solid var(--error, #ef4444);
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.9);
          z-index: 200;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--bg-tertiary, #e0e0e0);
          border-top-color: var(--accent-color, #3b82f6);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-overlay p {
          margin-top: 16px;
          color: var(--text-secondary, #666);
        }
      `}</style>
    </div>
  );
}
