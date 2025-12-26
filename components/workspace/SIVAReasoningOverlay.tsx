/**
 * SIVA Reasoning Overlay Component
 * Sprint S273: Action Output Panel
 * Feature F4: SIVA Reasoning Overlay
 *
 * Displays SIVA's explanation of why an action was recommended:
 * - SIVA explains (does NOT decide)
 * - Traceable reasoning chain
 * - Transparent logic
 *
 * Architecture: NBA decides, SIVA explains. SIVA does NOT decide.
 */

'use client';

import React from 'react';
import {
  Sparkles,
  X,
  ChevronRight,
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
  Clock,
  Users,
  CheckCircle2,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface ReasoningStep {
  id: string;
  type: 'signal' | 'blocker' | 'booster' | 'timing' | 'contact' | 'score';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-100, how much this influenced the decision
}

export interface SIVAReasoningData {
  summary: string;
  confidenceExplanation: string;
  steps: ReasoningStep[];
  alternativeActions?: string[];
  warnings?: string[];
  generatedAt: string;
}

interface SIVAReasoningOverlayProps {
  reasoning: SIVAReasoningData | null;
  isOpen: boolean;
  onClose: () => void;
  actionTitle?: string;
}

// =============================================================================
// Step Type Configuration
// =============================================================================

const STEP_TYPE_CONFIG: Record<string, { icon: typeof Target; color: string }> = {
  signal: { icon: TrendingUp, color: 'text-blue-600' },
  blocker: { icon: AlertTriangle, color: 'text-red-600' },
  booster: { icon: Zap, color: 'text-emerald-600' },
  timing: { icon: Clock, color: 'text-amber-600' },
  contact: { icon: Users, color: 'text-violet-600' },
  score: { icon: Target, color: 'text-cyan-600' },
};

// =============================================================================
// Component
// =============================================================================

export function SIVAReasoningOverlay({
  reasoning,
  isOpen,
  onClose,
  actionTitle,
}: SIVAReasoningOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900">SIVA Reasoning</h2>
              {actionTitle && (
                <p className="text-sm text-neutral-500">Why "{actionTitle}"</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!reasoning ? (
            <div className="text-center py-8 text-neutral-500">
              No reasoning available
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Summary</h3>
                <p className="text-neutral-900">{reasoning.summary}</p>
              </div>

              {/* Confidence Explanation */}
              <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-100">
                <h3 className="text-sm font-medium text-violet-700 mb-1">
                  Confidence Explanation
                </h3>
                <p className="text-sm text-violet-900">{reasoning.confidenceExplanation}</p>
              </div>

              {/* Reasoning Chain */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Reasoning Chain</h3>
                <div className="space-y-3">
                  {reasoning.steps.map((step, index) => (
                    <ReasoningStepRow key={step.id} step={step} index={index} />
                  ))}
                </div>
              </div>

              {/* Alternative Actions */}
              {reasoning.alternativeActions && reasoning.alternativeActions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-neutral-500 mb-2">
                    Alternative Actions Considered
                  </h3>
                  <ul className="space-y-1">
                    {reasoning.alternativeActions.map((alt, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                        <ChevronRight className="w-3 h-3 text-neutral-400" />
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {reasoning.warnings && reasoning.warnings.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h3 className="text-sm font-medium text-amber-700 mb-2">Considerations</h3>
                  <ul className="space-y-1">
                    {reasoning.warnings.map((warning, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>SIVA explains only. NBA decides.</span>
            </div>
            {reasoning && (
              <span>Generated: {formatTime(reasoning.generatedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Reasoning Step Row
// =============================================================================

function ReasoningStepRow({ step, index }: { step: ReasoningStep; index: number }) {
  const config = STEP_TYPE_CONFIG[step.type] || STEP_TYPE_CONFIG.score;
  const Icon = config.icon;

  const impactBg = step.impact === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                   step.impact === 'negative' ? 'bg-red-100 text-red-700' :
                   'bg-neutral-100 text-neutral-600';

  return (
    <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400 w-4">{index + 1}.</span>
        <div className={config.color}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-neutral-900">{step.title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${impactBg}`}>
            {step.impact}
          </span>
        </div>
        <p className="text-xs text-neutral-600">{step.description}</p>
        <div className="mt-1.5 flex items-center gap-1">
          <span className="text-[10px] text-neutral-400">Weight:</span>
          <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden max-w-[100px]">
            <div
              className={`h-full ${
                step.impact === 'positive' ? 'bg-emerald-500' :
                step.impact === 'negative' ? 'bg-red-500' :
                'bg-neutral-400'
              }`}
              style={{ width: `${step.weight}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500">{step.weight}%</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default SIVAReasoningOverlay;
