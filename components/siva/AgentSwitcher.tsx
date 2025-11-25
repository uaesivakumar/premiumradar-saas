'use client';

/**
 * Agent Switcher - Sprint S28
 * Horizontal agent selection bar
 */

import { motion } from 'framer-motion';
import {
  Search,
  Trophy,
  Send,
  Database,
  Play,
  Sparkles,
} from 'lucide-react';
import { useSIVAStore, AgentType } from '@/lib/stores/siva-store';
import { AGENT_CONFIGS } from '@/lib/agents/registry';

const ICON_MAP: Record<string, typeof Search> = {
  Search,
  Trophy,
  Send,
  Database,
  Play,
};

interface AgentSwitcherProps {
  onAgentSelect?: (agent: AgentType) => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AgentSwitcher({
  onAgentSelect,
  showLabels = true,
  size = 'md',
}: AgentSwitcherProps) {
  const { activeAgent, setActiveAgent, state } = useSIVAStore();
  const isProcessing = state !== 'idle';

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs gap-1',
    md: 'h-10 px-3 text-sm gap-2',
    lg: 'h-12 px-4 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleSelect = (agentId: AgentType) => {
    if (isProcessing) return;
    setActiveAgent(agentId === activeAgent ? null : agentId);
    onAgentSelect?.(agentId);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-xl border border-white/5">
      {/* All/Auto option */}
      <motion.button
        onClick={() => {
          setActiveAgent(null);
          onAgentSelect?.(null as unknown as AgentType);
        }}
        disabled={isProcessing}
        className={`flex items-center rounded-lg transition-all ${sizeClasses[size]} ${
          activeAgent === null
            ? 'bg-white/10 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={{ scale: isProcessing ? 1 : 1.02 }}
        whileTap={{ scale: isProcessing ? 1 : 0.98 }}
      >
        <Sparkles className={iconSizes[size]} />
        {showLabels && <span>Auto</span>}
      </motion.button>

      <div className="w-px h-6 bg-white/10" />

      {/* Agent options */}
      {Object.values(AGENT_CONFIGS).map((config) => {
        const Icon = ICON_MAP[config.icon] || Search;
        const isActive = activeAgent === config.id;

        return (
          <motion.button
            key={config.id}
            onClick={() => handleSelect(config.id)}
            disabled={isProcessing}
            className={`flex items-center rounded-lg transition-all ${sizeClasses[size]} ${
              isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={
              isActive
                ? {
                    backgroundColor: `${config.color}20`,
                    color: config.color,
                  }
                : undefined
            }
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
            title={config.description}
          >
            <Icon className={iconSizes[size]} />
            {showLabels && <span>{config.name.replace(' Agent', '')}</span>}

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="agent-indicator"
                className="absolute inset-0 rounded-lg -z-10"
                style={{ backgroundColor: `${config.color}20` }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// Compact version for mobile/tight spaces
export function AgentSwitcherCompact({ onAgentSelect }: { onAgentSelect?: (agent: AgentType) => void }) {
  return <AgentSwitcher onAgentSelect={onAgentSelect} showLabels={false} size="sm" />;
}

// Agent Info Card (for tooltips/popovers)
export function AgentInfoCard({ agentId }: { agentId: AgentType }) {
  const config = AGENT_CONFIGS[agentId];
  const Icon = ICON_MAP[config.icon] || Search;

  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-white/10 max-w-xs">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <div>
          <h4 className="font-semibold text-white">{config.name}</h4>
          <p className="text-xs text-gray-500">{config.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-medium">Capabilities:</p>
        <div className="flex flex-wrap gap-1">
          {config.capabilities.map((cap) => (
            <span
              key={cap.id}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: `${config.color}10`,
                color: config.color,
              }}
            >
              {cap.name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-xs text-gray-500">
          Try: "{config.keywords.slice(0, 3).join('", "')}"...
        </p>
      </div>
    </div>
  );
}

export default AgentSwitcher;
