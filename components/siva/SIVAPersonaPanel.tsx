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
  Gavel,
} from 'lucide-react';
import { useSIVAStore, SIVAState, AgentType } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

const STATE_CONFIG: Record<SIVAState, { label: string; icon: typeof Brain; color: string }> = {
  idle: { label: 'Ready', icon: Sparkles, color: '#10B981' },
  listening: { label: 'Listening...', icon: Loader2, color: '#6366F1' },
  thinking: { label: 'Thinking...', icon: Brain, color: '#8B5CF6' },
  generating: { label: 'Generating...', icon: Sparkles, color: '#F59E0B' },
  complete: { label: 'Done', icon: CheckCircle, color: '#10B981' },
  error: { label: 'Error', icon: Loader2, color: '#EF4444' },
};

const AGENT_CONFIG: Record<AgentType, { label: string; icon: typeof Search; description: string }> = {
  discovery: { label: 'Discovery Agent', icon: Search, description: 'Finding companies' },
  ranking: { label: 'Ranking Agent', icon: Trophy, description: 'Scoring prospects' },
  outreach: { label: 'Outreach Agent', icon: Send, description: 'Crafting messages' },
  enrichment: { label: 'Enrichment Agent', icon: Database, description: 'Gathering data' },
  demo: { label: 'Demo Agent', icon: Play, description: 'Demonstrating' },
  'deal-evaluation': { label: 'Deal Evaluator', icon: Gavel, description: 'Evaluating deal' },
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
      {/* Compact SIVA Status Bar - minimal height for maximum content space */}
      <motion.div
        className="flex items-center justify-between px-4 py-2 bg-slate-900/50 backdrop-blur-sm border-b border-white/5"
        animate={{
          backgroundColor: isProcessing ? 'rgba(15, 23, 42, 0.8)' : 'rgba(15, 23, 42, 0.5)',
        }}
      >
        {/* Left: Compact SIVA Status */}
        <div className="flex items-center gap-3">
          {/* Compact Avatar/Orb */}
          <motion.div
            className="relative w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${industryConfig.primaryColor}40, ${industryConfig.secondaryColor}40)`,
              border: `1px solid ${industryConfig.primaryColor}30`,
            }}
            animate={{
              scale: isProcessing ? [1, 1.05, 1] : 1,
            }}
            transition={{
              repeat: isProcessing ? Infinity : 0,
              duration: 2,
            }}
          >
            <StateIcon
              className={`w-4 h-4 ${state === 'listening' ? 'animate-spin' : ''}`}
              style={{ color: stateConfig.color }}
            />
          </motion.div>

          {/* Status - Single line */}
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">SIVA</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${stateConfig.color}20`,
                color: stateConfig.color,
              }}
            >
              {stateConfig.label}
            </span>
            {/* Show active agent inline when processing */}
            {agentConfig && isProcessing && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                • {agentConfig.description}
              </span>
            )}
          </div>
        </div>

        {/* Right: Reasoning Toggle (only show when there are steps) */}
        {reasoningSteps.length > 0 && (
          <button
            onClick={toggleReasoningOverlay}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              showReasoningOverlay
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Reasoning</span>
            <span className="text-gray-500">{reasoningSteps.filter(s => s.status === 'complete').length}/{reasoningSteps.length}</span>
          </button>
        )}
      </motion.div>

      {/* Compact Reasoning Steps - horizontal scrollable chips */}
      <AnimatePresence>
        {showReasoningOverlay && reasoningSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-900/60 border-b border-white/5"
          >
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto">
              <Brain className="w-3 h-3 text-purple-400 flex-shrink-0" />
              {reasoningSteps.map((step) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap ${
                    step.status === 'complete'
                      ? 'bg-green-500/10 text-green-400'
                      : step.status === 'active'
                      ? 'bg-purple-500/10 text-purple-300'
                      : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : step.status === 'active' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="w-3 h-3 text-center">{step.step}</span>
                  )}
                  <span>{step.title}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SIVAPersonaPanel;
