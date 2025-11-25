'use client';

/**
 * Reasoning Overlay - Sprint S29
 * Visual chain-of-thought display (masked/abstracted)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  CheckCircle,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  Network,
  Workflow,
  Sparkles,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { useSIVAStore, ReasoningStep } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface ReasoningOverlayProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function ReasoningOverlay({ isOpen, onClose }: ReasoningOverlayProps) {
  const { reasoningSteps, state, activeAgent } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const [viewMode, setViewMode] = useState<'timeline' | 'graph'>('timeline');

  const completedSteps = reasoningSteps.filter((s) => s.status === 'complete').length;
  const progress = reasoningSteps.length > 0 ? (completedSteps / reasoningSteps.length) * 100 : 0;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-x-4 top-20 bottom-4 md:inset-x-auto md:left-auto md:right-4 md:w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-40 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${industryConfig.primaryColor}20` }}
          >
            <Brain className="w-5 h-5" style={{ color: industryConfig.primaryColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Reasoning Trace</h3>
            <p className="text-xs text-gray-500">
              {state === 'idle' ? 'Ready' : `${state}...`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <Workflow className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'graph'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <Network className="w-4 h-4" />
            </button>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 border-b border-white/5">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${industryConfig.primaryColor}, ${industryConfig.secondaryColor})`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'timeline' ? (
          <TimelineView steps={reasoningSteps} industryConfig={industryConfig} />
        ) : (
          <GraphView steps={reasoningSteps} industryConfig={industryConfig} />
        )}

        {/* Empty State */}
        {reasoningSteps.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-400 mb-2">No reasoning trace yet</p>
            <p className="text-xs text-gray-500">
              Ask SIVA something to see the reasoning process
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-slate-900/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <GitBranch className="w-3 h-3" />
            <span>{activeAgent ? `${activeAgent} agent` : 'Auto-routing'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>{completedSteps}/{reasoningSteps.length} steps</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Timeline View
function TimelineView({
  steps,
  industryConfig,
}: {
  steps: ReasoningStep[];
  industryConfig: { primaryColor: string; secondaryColor: string };
}) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-white/10" />

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-12"
          >
            {/* Step indicator */}
            <div
              className={`absolute left-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                step.status === 'complete'
                  ? 'bg-green-500/20'
                  : step.status === 'active'
                  ? 'bg-purple-500/20'
                  : 'bg-white/5'
              }`}
            >
              {step.status === 'complete' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : step.status === 'active' ? (
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              ) : (
                <span className="text-sm font-bold text-gray-500">{step.step}</span>
              )}
            </div>

            {/* Step content */}
            <div
              className={`p-3 rounded-xl border ${
                step.status === 'complete'
                  ? 'bg-green-500/5 border-green-500/20'
                  : step.status === 'active'
                  ? 'bg-purple-500/5 border-purple-500/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4
                  className={`font-medium ${
                    step.status === 'complete'
                      ? 'text-green-300'
                      : step.status === 'active'
                      ? 'text-purple-300'
                      : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </h4>
                {step.duration && (
                  <span className="text-xs text-gray-500">{step.duration}ms</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>

              {/* Active step animation */}
              {step.status === 'active' && (
                <motion.div
                  className="mt-2 flex items-center gap-1"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <span className="w-1 h-1 rounded-full bg-purple-400" />
                  <span className="w-1 h-1 rounded-full bg-purple-400" />
                  <span className="w-1 h-1 rounded-full bg-purple-400" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Graph View (Visual flow)
function GraphView({
  steps,
  industryConfig,
}: {
  steps: ReasoningStep[];
  industryConfig: { primaryColor: string; secondaryColor: string };
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="w-full"
        >
          {/* Node */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              step.status === 'complete'
                ? 'bg-green-500/10 border-green-500/30'
                : step.status === 'active'
                ? 'bg-purple-500/10 border-purple-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                step.status === 'complete'
                  ? 'bg-green-500'
                  : step.status === 'active'
                  ? 'bg-purple-500'
                  : 'bg-gray-600'
              }`}
            >
              {step.status === 'complete' ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : step.status === 'active' ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <span className="text-xs font-bold text-white">{step.step}</span>
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  step.status === 'complete'
                    ? 'text-green-300'
                    : step.status === 'active'
                    ? 'text-purple-300'
                    : 'text-gray-400'
                }`}
              >
                {step.title}
              </p>
            </div>
            {step.duration && (
              <span className="text-xs text-gray-500">{step.duration}ms</span>
            )}
          </div>

          {/* Connector */}
          {index < steps.length - 1 && (
            <div className="flex justify-center py-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 16 }}
                className="w-0.5 bg-white/20"
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Floating Reasoning Button
export function ReasoningToggle() {
  const { showReasoningOverlay, toggleReasoningOverlay, reasoningSteps, state } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const isActive = state !== 'idle';
  const hasSteps = reasoningSteps.length > 0;

  return (
    <motion.button
      onClick={toggleReasoningOverlay}
      className={`fixed bottom-24 right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg transition-all ${
        showReasoningOverlay
          ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
          : 'bg-slate-800/80 backdrop-blur-sm border-white/10 text-gray-400 hover:text-white'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={
        isActive
          ? {
              boxShadow: [
                `0 0 10px ${industryConfig.primaryColor}20`,
                `0 0 20px ${industryConfig.primaryColor}40`,
                `0 0 10px ${industryConfig.primaryColor}20`,
              ],
            }
          : {}
      }
      transition={isActive ? { repeat: Infinity, duration: 2 } : {}}
    >
      <Eye className="w-4 h-4" />
      <span className="text-sm">Reasoning</span>
      {hasSteps && (
        <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-xs">
          {reasoningSteps.filter((s) => s.status === 'complete').length}/{reasoningSteps.length}
        </span>
      )}
    </motion.button>
  );
}

export default ReasoningOverlay;
