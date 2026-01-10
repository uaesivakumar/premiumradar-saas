'use client';

/**
 * CommandHints - S373: Command Palette (Non-Chat)
 *
 * Smart suggestions that update based on context.
 * Not static - adapts to user's state.
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useCardStore } from '@/lib/stores/card-store';
import { useLeftRailStore } from '@/lib/stores/left-rail-store';
import { getSmartHints } from '@/lib/workspace/command-resolver';

interface CommandHintsProps {
  visible?: boolean;
}

export function CommandHints({ visible = true }: CommandHintsProps) {
  const cards = useCardStore((state) => state.getActiveCards());
  const nba = useCardStore((state) => state.getNBA());
  const { counts } = useLeftRailStore();

  const hints = useMemo(() => {
    return getSmartHints({
      hasCards: cards.length > 0,
      hasNBA: nba !== null,
      savedLeadsCount: counts.leads.saved,
    });
  }, [cards.length, nba, counts.leads.saved]);

  if (!visible || hints.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="flex items-center justify-center gap-2 text-sm text-gray-500"
      >
        <Lightbulb className="w-3 h-3" />
        <span>{hints[0]}</span>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandHints;
