'use client';

/**
 * LeftRailItem - S390: Static Sidebar Structure
 *
 * SIDEBAR INVARIANT (LOCKED):
 * - Items NEVER disappear
 * - Counts ALWAYS shown (even if 0)
 * - Greyed text for 0 counts is OK, hiding is NOT
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface LeftRailItemProps {
  icon?: LucideIcon;
  label: string;
  count?: number;
  isActive?: boolean;
  isZero?: boolean;  // S390: Style differently when count is 0
  onClick: () => void;
}

export function LeftRailItem({
  icon: Icon,
  label,
  count,
  isActive = false,
  isZero = false,
  onClick,
}: LeftRailItemProps) {
  // S390: Items with 0 count are greyed but NEVER hidden
  const isDisabledStyle = isZero && !isActive;

  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all text-sm ${
        isActive
          ? 'bg-white/10 text-white'
          : isDisabledStyle
          ? 'text-white/30 hover:text-white/50 hover:bg-white/5'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1 text-left">{label}</span>
      {/* S390: ALWAYS show count, even if 0 */}
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
            isActive
              ? 'bg-white/20 text-white'
              : count === 0
              ? 'text-white/30'
              : 'bg-white/10 text-white/70'
          }`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

export default LeftRailItem;
