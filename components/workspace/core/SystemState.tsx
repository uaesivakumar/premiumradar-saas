'use client';

/**
 * SystemState - S371: Pageless Core Surface
 *
 * Displays calm silence states when no cards are present.
 * Trust-building, not apologetic.
 *
 * WORKSPACE UX (LOCKED):
 * - "No new signals today" - not apologetic
 * - Builds trust through calm confidence
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Coffee, Sparkles } from 'lucide-react';

type SilenceType = 'no-signals' | 'all-clear' | 'quiet-day';

interface SystemStateProps {
  type: SilenceType;
  primaryColor?: string;
}

const silenceMessages = {
  'no-signals': {
    icon: Moon,
    title: 'No new signals today',
    subtitle: "Your radar is active. We'll surface opportunities as they emerge.",
    tip: 'You can ask me about specific companies anytime.',
  },
  'all-clear': {
    icon: Coffee,
    title: 'All clear',
    subtitle: 'Nothing urgent requires your attention right now.',
    tip: 'Take a moment. The best opportunities will find you.',
  },
  'quiet-day': {
    icon: Sparkles,
    title: 'Quiet day',
    subtitle: "Markets are calm. We're watching for you.",
    tip: 'Use this time to follow up on saved leads.',
  },
};

export function SystemState({ type, primaryColor = '#3B82F6' }: SystemStateProps) {
  const message = silenceMessages[type];
  const Icon = message.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[50vh] text-center"
    >
      {/* Calm Icon */}
      <motion.div
        className="mb-6"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
            boxShadow: `0 0 60px ${primaryColor}10`,
          }}
        >
          <Icon className="w-10 h-10 text-white/60" />
        </div>
      </motion.div>

      {/* Title */}
      <h2 className="text-2xl font-medium text-white mb-2">{message.title}</h2>

      {/* Subtitle */}
      <p className="text-gray-400 mb-6 max-w-md">{message.subtitle}</p>

      {/* Tip */}
      <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm text-gray-500">{message.tip}</p>
      </div>
    </motion.div>
  );
}

export default SystemState;
