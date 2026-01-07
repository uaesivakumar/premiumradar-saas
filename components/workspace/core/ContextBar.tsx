'use client';

/**
 * ContextBar - S371: Pageless Core Surface
 *
 * Top bar showing workspace context and system state.
 * Always visible, provides orientation.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Moon } from 'lucide-react';

export type SystemStateType = 'live' | 'waiting' | 'no-signals';

interface ContextBarProps {
  workspaceName: string;
  subVertical: string;
  region: string;
  systemState: SystemStateType;
}

export function ContextBar({
  workspaceName,
  subVertical,
  region,
  systemState,
}: ContextBarProps) {
  return (
    <div className="flex-shrink-0 px-4 md:px-8 lg:px-16 py-3 border-b border-white/5">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left: Context */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white font-medium">{workspaceName}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">{subVertical}</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">{region}</span>
        </div>

        {/* Right: System State */}
        <SystemStateIndicator state={systemState} />
      </div>
    </div>
  );
}

function SystemStateIndicator({ state }: { state: SystemStateType }) {
  const stateConfig = {
    live: {
      icon: Zap,
      label: 'Live',
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
      pulse: true,
    },
    waiting: {
      icon: Clock,
      label: 'Waiting',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      pulse: false,
    },
    'no-signals': {
      icon: Moon,
      label: 'Quiet',
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/20',
      pulse: false,
    },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor}`}>
      <motion.div
        animate={config.pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </motion.div>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

export default ContextBar;
