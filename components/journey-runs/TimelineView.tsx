/**
 * Timeline View Component
 * Sprint S50: Journey Execution Viewer
 *
 * Vertical timeline of all steps with status icons and expandable details
 */
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { JourneyRunStep, JourneyRunTransition, JourneyRunError } from '@/lib/journey-runs';

interface TimelineViewProps {
  steps: JourneyRunStep[];
  transitions: JourneyRunTransition[];
  errors: JourneyRunError[];
  selectedStepId?: string;
  onStepSelect?: (stepId: string) => void;
}

export function TimelineView({
  steps,
  transitions,
  errors,
  selectedStepId,
  onStepSelect,
}: TimelineViewProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleExpand = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepErrors = (stepId: string) =>
    errors.filter((e) => e.stepId === stepId);

  const getOutgoingTransitions = (stepId: string) =>
    transitions.filter((t) => t.fromStepId === stepId);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Steps */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const stepErrors = getStepErrors(step.stepId);
          const outgoingTransitions = getOutgoingTransitions(step.stepId);
          const isExpanded = expandedSteps.has(step.stepId);
          const isSelected = selectedStepId === step.stepId;

          return (
            <div key={step.id} className="relative">
              {/* Step node */}
              <div
                className={cn(
                  'relative flex items-start gap-4 py-3 px-2 rounded-lg cursor-pointer transition-colors',
                  isSelected && 'bg-primary-50 border border-primary-200',
                  !isSelected && 'hover:bg-gray-50'
                )}
                onClick={() => onStepSelect?.(step.stepId)}
              >
                {/* Status icon */}
                <div className="relative z-10 flex-shrink-0">
                  <StepStatusIcon
                    status={step.status}
                    hasErrors={stepErrors.length > 0}
                    hasFallback={step.fallbackTriggered}
                    hasDecision={!!step.decision}
                  />
                </div>

                {/* Step content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {step.stepName || step.stepId}
                      </p>
                      <p className="text-xs text-gray-500">
                        {step.stepType && <span className="mr-2">{step.stepType}</span>}
                        {step.durationMs && (
                          <span className="text-gray-400">
                            {formatDuration(step.durationMs)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      {step.fallbackTriggered && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                          Fallback
                        </span>
                      )}
                      {step.decision && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                          Decision
                        </span>
                      )}
                      {stepErrors.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                          {stepErrors.length} error{stepErrors.length > 1 ? 's' : ''}
                        </span>
                      )}

                      {/* Expand button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(step.stepId);
                        }}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <svg
                          className={cn(
                            'w-4 h-4 text-gray-500 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {/* Decision info */}
                      {step.decision && (
                        <div className="p-2 bg-purple-50 rounded text-xs">
                          <p className="font-medium text-purple-700">Decision</p>
                          <p className="text-purple-600">
                            {JSON.stringify(step.decision)}
                          </p>
                          {step.decisionReason && (
                            <p className="mt-1 text-purple-500 italic">
                              {step.decisionReason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Fallback info */}
                      {step.fallbackTriggered && (
                        <div className="p-2 bg-yellow-50 rounded text-xs">
                          <p className="font-medium text-yellow-700">
                            Fallback Triggered
                          </p>
                          <p className="text-yellow-600">
                            Strategy: {step.fallbackStrategy || 'unknown'}
                          </p>
                          {step.fallbackStepId && (
                            <p className="text-yellow-500">
                              Fallback to: {step.fallbackStepId}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Retry info */}
                      {step.retryCount > 0 && (
                        <div className="p-2 bg-gray-50 rounded text-xs">
                          <p className="text-gray-600">
                            Retries: {step.retryCount}/{step.maxRetries}
                          </p>
                        </div>
                      )}

                      {/* Transitions */}
                      {outgoingTransitions.length > 0 && (
                        <div className="p-2 bg-blue-50 rounded text-xs">
                          <p className="font-medium text-blue-700">Transitions</p>
                          {outgoingTransitions.map((t) => (
                            <div
                              key={t.id}
                              className={cn(
                                'mt-1 flex items-center gap-2',
                                t.taken ? 'text-blue-600' : 'text-blue-400'
                              )}
                            >
                              <span>{t.conditionMet ? '✓' : '✗'}</span>
                              <span>→ {t.toStepId}</span>
                              {t.taken && (
                                <span className="text-xs bg-blue-200 px-1 rounded">
                                  taken
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector to next step */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-full w-0.5 h-0 bg-gray-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StepStatusIconProps {
  status: JourneyRunStep['status'];
  hasErrors?: boolean;
  hasFallback?: boolean;
  hasDecision?: boolean;
}

function StepStatusIcon({
  status,
  hasErrors,
  hasFallback,
  hasDecision,
}: StepStatusIconProps) {
  const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center';

  // Priority: error > fallback > decision > status
  if (hasErrors) {
    return (
      <div className={cn(baseClasses, 'bg-red-100')}>
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    );
  }

  if (hasFallback) {
    return (
      <div className={cn(baseClasses, 'bg-yellow-100')}>
        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    );
  }

  if (hasDecision) {
    return (
      <div className={cn(baseClasses, 'bg-purple-100')}>
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  const statusIcons = {
    pending: { bg: 'bg-gray-100', icon: 'text-gray-400', svg: '○' },
    queued: { bg: 'bg-gray-100', icon: 'text-gray-500', svg: '⋯' },
    running: { bg: 'bg-blue-100', icon: 'text-blue-600 animate-spin', svg: 'spinner' },
    completed: { bg: 'bg-green-100', icon: 'text-green-600', svg: '✓' },
    failed: { bg: 'bg-red-100', icon: 'text-red-600', svg: '✗' },
    skipped: { bg: 'bg-gray-100', icon: 'text-gray-400', svg: '—' },
    waiting: { bg: 'bg-yellow-100', icon: 'text-yellow-600', svg: '⏳' },
    timeout: { bg: 'bg-orange-100', icon: 'text-orange-600', svg: '⏱' },
  };

  const config = statusIcons[status];

  if (config.svg === 'spinner') {
    return (
      <div className={cn(baseClasses, config.bg)}>
        <svg className={cn('w-5 h-5', config.icon)} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, config.bg)}>
      <span className={cn('text-lg font-bold', config.icon)}>{config.svg}</span>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default TimelineView;
