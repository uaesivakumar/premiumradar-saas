'use client';

/**
 * SIVA Persona Panel - Sprint S26
 * Shows SIVA's current state (thinking, generating, reasoning)
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Loader2,
  CheckCircle,
  Search,
  Trophy,
  Send,
  Database,
  Play,
  Eye,
} from 'lucide-react';
import { useSIVAStore, SIVAState, AgentType } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

const STATE_CONFIG: Record<SIVAState, { label: string; icon: typeof Brain; color: string }> = {
  idle: { label: 'Ready', icon: Sparkles, color: '#10B981' },
  listening: { label: 'Listening...', icon: Loader2, color: '#6366F1' },
  thinking: { label: 'Thinking...', icon: Brain, color: '#8B5CF6' },
  generating: { label: 'Generating...', icon: Sparkles, color: '#F59E0B' },
  complete: { label: 'Done', icon: CheckCircle, color: '#10B981' },
};

const AGENT_CONFIG: Record<AgentType, { label: string; icon: typeof Search; description: string }> = {
  discovery: { label: 'Discovery Agent', icon: Search, description: 'Finding companies' },
  ranking: { label: 'Ranking Agent', icon: Trophy, description: 'Scoring prospects' },
  outreach: { label: 'Outreach Agent', icon: Send, description: 'Crafting messages' },
  enrichment: { label: 'Enrichment Agent', icon: Database, description: 'Gathering data' },
  demo: { label: 'Demo Agent', icon: Play, description: 'Demonstrating' },
};

export function SIVAPersonaPanel() {
  const { state, activeAgent, reasoningSteps, showReasoningOverlay, toggleReasoningOverlay } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const stateConfig = STATE_CONFIG[state];
  const StateIcon = stateConfig.icon;
  const agentConfig = activeAgent ? AGENT_CONFIG[activeAgent] : null;
  const AgentIcon = agentConfig?.icon;

  const isProcessing = state !== 'idle';
  const activeStep = reasoningSteps.find((s) => s.status === 'active');

  return (
    <div className="relative">
      {/* Main Persona Bar */}
      <motion.div
        className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm border-b border-white/5"
        animate={{
          backgroundColor: isProcessing ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.5)',
        }}
      >
        {/* Left: SIVA Status */}
        <div className="flex items-center gap-4">
          {/* Avatar/Orb */}
          <motion.div
            className="relative w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${industryConfig.primaryColor}40, ${industryConfig.secondaryColor}40)`,
              border: `1px solid ${industryConfig.primaryColor}30`,
            }}
            animate={{
              scale: isProcessing ? [1, 1.05, 1] : 1,
              boxShadow: isProcessing
                ? [`0 0 20px ${industryConfig.primaryColor}30`, `0 0 40px ${industryConfig.primaryColor}50`, `0 0 20px ${industryConfig.primaryColor}30`]
                : `0 0 10px ${industryConfig.primaryColor}20`,
            }}
            transition={{
              repeat: isProcessing ? Infinity : 0,
              duration: 2,
            }}
          >
            <motion.div
              animate={{ rotate: isProcessing ? 360 : 0 }}
              transition={{ repeat: isProcessing ? Infinity : 0, duration: 3, ease: 'linear' }}
            >
              <StateIcon
                className={`w-6 h-6 ${state === 'listening' ? 'animate-spin' : ''}`}
                style={{ color: stateConfig.color }}
              />
            </motion.div>

            {/* Pulse ring */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ border: `2px solid ${industryConfig.primaryColor}` }}
                />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status Text */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">SIVA</span>
              <motion.span
                key={state}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${stateConfig.color}20`,
                  color: stateConfig.color,
                }}
              >
                {stateConfig.label}
              </motion.span>
            </div>

            {/* Active Agent */}
            <AnimatePresence mode="wait">
              {agentConfig && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-center gap-2 mt-1"
                >
                  {AgentIcon && <AgentIcon className="w-3 h-3 text-gray-400" />}
                  <span className="text-xs text-gray-400">{agentConfig.label}</span>
                  <span className="text-xs text-gray-500">-</span>
                  <span className="text-xs text-gray-500">{agentConfig.description}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center: Reasoning Step (when processing) */}
        <AnimatePresence mode="wait">
          {activeStep && (
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-400">{activeStep.step}</span>
                </div>
                <span className="text-sm text-gray-300">{activeStep.title}</span>
              </div>
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Reasoning Toggle */}
          <button
            onClick={toggleReasoningOverlay}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              showReasoningOverlay
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Reasoning</span>
          </button>
        </div>
      </motion.div>

      {/* Reasoning Overlay */}
      <AnimatePresence>
        {showReasoningOverlay && reasoningSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-900/80 backdrop-blur-sm border-b border-white/5"
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Reasoning Trace</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {reasoningSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                      step.status === 'complete'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : step.status === 'active'
                        ? 'bg-purple-500/10 border border-purple-500/20'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === 'complete'
                          ? 'bg-green-500 text-white'
                          : step.status === 'active'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {step.status === 'complete' ? <CheckCircle className="w-3 h-3" /> : step.step}
                    </div>
                    <span
                      className={`text-xs ${
                        step.status === 'complete'
                          ? 'text-green-400'
                          : step.status === 'active'
                          ? 'text-purple-300'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.status === 'active' && (
                      <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SIVAPersonaPanel;
