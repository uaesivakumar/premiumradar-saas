/**
 * Journey Run Details Page
 * Sprint S50: Journey Execution Viewer
 *
 * Full execution viewer with timeline, step details, and intelligence panel
 */
'use client';

import { use, useState, useMemo } from 'react';
import {
  RunHeader,
  TimelineView,
  StepDetailPanel,
  RunSidebar,
  IntelligencePanel,
} from '@/components/journey-runs';
import {
  useJourneyRuns,
  useJourneyRunDetails,
} from '@/lib/journey-runs';
import type { JourneyRunStep, JourneyRunAILog, JourneyRunContextSnapshot, JourneyRunError } from '@/lib/journey-runs';

interface PageProps {
  params: Promise<{ journeyId: string; runId: string }>;
}

export default function JourneyRunDetailPage({ params }: PageProps) {
  const { journeyId, runId } = use(params);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true); // Assume running initially

  // Fetch run details
  const { data: runData, isLoading: runLoading, error: runError } = useJourneyRunDetails(
    journeyId,
    runId,
    {
      // Auto-refresh every 5 seconds for running journeys
      refetchInterval: isRunning ? 5000 : undefined,
    }
  );

  // Update isRunning when data changes
  if (runData?.data?.run?.status && runData.data.run.status !== 'running' && isRunning) {
    setIsRunning(false);
  }

  // Fetch all runs for sidebar
  const { data: runsData, isLoading: runsLoading } = useJourneyRuns(journeyId, {
    limit: 20,
  });

  // Get step details
  const selectedStep = useMemo(() => {
    if (!selectedStepId || !runData?.data?.steps) return null;
    return runData.data.steps.find((s: JourneyRunStep) => s.stepId === selectedStepId) || null;
  }, [selectedStepId, runData?.data?.steps]);

  const selectedAILog = useMemo(() => {
    if (!selectedStepId || !runData?.data?.aiLogs) return undefined;
    return runData.data.aiLogs.find((l: JourneyRunAILog) => l.stepId === selectedStepId);
  }, [selectedStepId, runData?.data?.aiLogs]);

  const selectedContextSnapshot = useMemo(() => {
    if (!selectedStepId || !runData?.data?.contextSnapshots) return undefined;
    return runData.data.contextSnapshots.find((s: JourneyRunContextSnapshot) => s.stepId === selectedStepId);
  }, [selectedStepId, runData?.data?.contextSnapshots]);

  const selectedStepErrors = useMemo(() => {
    if (!selectedStepId || !runData?.data?.errors) return [];
    return runData.data.errors.filter((e: JourneyRunError) => e.stepId === selectedStepId);
  }, [selectedStepId, runData?.data?.errors]);

  if (runError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Error Loading Run</h2>
          <p className="mt-2 text-gray-600">{runError.message}</p>
        </div>
      </div>
    );
  }

  if (runLoading || !runData?.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading run details...</p>
        </div>
      </div>
    );
  }

  const { run, steps, errors, transitions, aiUsage } = runData.data;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0">
        <RunSidebar
          journeyId={journeyId}
          runs={runsData?.data?.runs || []}
          currentRunId={runId}
          isLoading={runsLoading}
        />
      </div>

      {/* Main content */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex-shrink-0">
          <RunHeader run={run} aiUsage={aiUsage} />
        </div>

        {/* Content area */}
        <div className="flex-grow flex overflow-hidden p-4 pt-0 gap-4">
          {/* Timeline */}
          <div className="w-1/3 flex-shrink-0 overflow-auto bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Execution Timeline</h3>
            <TimelineView
              steps={steps}
              transitions={transitions}
              errors={errors}
              selectedStepId={selectedStepId || undefined}
              onStepSelect={setSelectedStepId}
            />
          </div>

          {/* Step Details or Empty State */}
          <div className="flex-grow overflow-auto">
            {selectedStep ? (
              <StepDetailPanel
                step={selectedStep}
                aiLog={selectedAILog}
                contextSnapshot={selectedContextSnapshot}
                errors={selectedStepErrors}
                onClose={() => setSelectedStepId(null)}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-lg border border-gray-200">
                <div className="text-center text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="mt-4 text-sm">Select a step to view details</p>
                </div>
              </div>
            )}
          </div>

          {/* Intelligence Panel */}
          <div className="w-80 flex-shrink-0 overflow-auto">
            <IntelligencePanel journeyId={journeyId} />
          </div>
        </div>
      </div>
    </div>
  );
}
