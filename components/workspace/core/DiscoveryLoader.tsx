'use client';

/**
 * DiscoveryLoader - S380: Progressive Discovery Experience
 *
 * Shows rotating discovery states with animation.
 * Replaces static "Searching..." with progressive phases.
 *
 * WORKSPACE UX (LOCKED):
 * - Progressive states build anticipation
 * - Never static during active discovery
 * - Rotation every 4-6 seconds
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Target, Star, CheckCircle } from 'lucide-react';
import {
  useDiscoveryContextStore,
  DISCOVERY_LOADER_STATES,
  selectDiscoveryStatus,
  selectIsDiscoveryActive,
} from '@/lib/workspace/discovery-context';

interface DiscoveryLoaderProps {
  region?: string;
  subVertical?: string;
  primaryColor?: string;
}

// Icons for each phase
const PHASE_ICONS = [
  Search,    // Scanning registries
  Filter,    // Filtering employers
  Target,    // Estimating fit
  Star,      // Shortlisting
  CheckCircle, // Preparing
];

export function DiscoveryLoader({
  region = 'UAE',
  subVertical = 'Employee Banking',
  primaryColor = '#3B82F6',
}: DiscoveryLoaderProps) {
  const isActive = useDiscoveryContextStore(selectIsDiscoveryActive);
  const status = useDiscoveryContextStore(selectDiscoveryStatus);
  const advancePhase = useDiscoveryContextStore((s) => s.advancePhase);
  const progressPhase = useDiscoveryContextStore((s) => s.progressPhase);
  const elapsedTime = useDiscoveryContextStore((s) => s.elapsedTime);

  const [localPhase, setLocalPhase] = useState(0);

  // Auto-rotate phases every 4-6 seconds
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      setLocalPhase((prev) => (prev + 1) % DISCOVERY_LOADER_STATES.length);
      advancePhase();
    }, 5000); // 5 seconds per phase

    return () => clearInterval(intervalId);
  }, [isActive, advancePhase]);

  if (!isActive) {
    return null;
  }

  const currentState = DISCOVERY_LOADER_STATES[localPhase];
  const Icon = PHASE_ICONS[localPhase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[40vh] text-center"
    >
      {/* Animated Icon */}
      <motion.div
        className="mb-6 relative"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Pulsing background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />

        {/* Icon container */}
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center relative z-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}15)`,
            boxShadow: `0 0 60px ${primaryColor}20`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={localPhase}
              initial={{ opacity: 0, rotate: -20 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Status Text */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={currentState.text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-medium text-white mb-2"
        >
          {currentState.text}
        </motion.h2>
      </AnimatePresence>

      {/* Context */}
      <p className="text-gray-400 mb-4 max-w-md">
        Searching for {subVertical} opportunities in {region}
      </p>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-4">
        {DISCOVERY_LOADER_STATES.map((_, idx) => (
          <motion.div
            key={idx}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: idx <= localPhase ? primaryColor : `${primaryColor}40`,
            }}
            animate={{
              scale: idx === localPhase ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.5, repeat: idx === localPhase ? Infinity : 0 }}
          />
        ))}
      </div>

      {/* Elapsed time */}
      {elapsedTime && (
        <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-sm text-gray-500">
            Elapsed: {elapsedTime}
          </p>
        </div>
      )}

      {/* Reassurance tip */}
      <p className="text-xs text-gray-600 mt-4 max-w-sm">
        Early signals usually appear within a few minutes. Deeper validation may take longer.
      </p>
    </motion.div>
  );
}

export default DiscoveryLoader;
