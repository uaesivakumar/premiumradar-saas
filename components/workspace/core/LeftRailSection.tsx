'use client';

/**
 * LeftRailSection - S372: Dynamic Left Rail
 *
 * A collapsible section in the left rail.
 * Only renders if it has visible items.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeftRailSectionProps {
  title?: string;
  children: React.ReactNode;
  visible?: boolean;
}

export function LeftRailSection({
  title,
  children,
  visible = true,
}: LeftRailSectionProps) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-1"
      >
        {title && (
          <p className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
            {title}
          </p>
        )}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default LeftRailSection;
