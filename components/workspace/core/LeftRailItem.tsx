'use client';

/**
 * LeftRailItem - S372: Dynamic Left Rail
 *
 * Individual item in a left rail section.
 * Clicking filters the main surface (no navigation).
 */

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface LeftRailItemProps {
  icon: LucideIcon;
  label: string;
  count?: number | null;
  isActive?: boolean;
  onClick: () => void;
}

export function LeftRailItem({
  icon: Icon,
  label,
  count,
  isActive = false,
  onClick,
}: LeftRailItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left text-sm">{label}</span>
      {count !== null && count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-medium">
          {count}
        </span>
      )}
    </motion.button>
  );
}

export default LeftRailItem;
