'use client';

/**
 * LeftRailSection - S390: Static Sidebar Structure
 *
 * SIDEBAR INVARIANT (LOCKED):
 * - Sections ALWAYS render
 * - NO visibility prop - sections never hide
 * - Title always visible
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface LeftRailSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function LeftRailSection({
  title,
  children,
  defaultExpanded = true,
}: LeftRailSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-1">
      {/* Section Header - Always visible, clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1 text-xs text-white/40 uppercase tracking-wider hover:text-white/60 transition-colors"
      >
        <span>{title}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3" />
        </motion.div>
      </button>

      {/* Section Content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="space-y-0.5 pl-1">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export default LeftRailSection;
