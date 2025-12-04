'use client';

/**
 * ContextBadge - EB Journey Phase 3
 * Shows the user's current sales context: Banking → Employee Banking → Dubai
 *
 * Displays:
 * - Vertical + SubVertical + Regions
 * - Lock status indicator
 * - Click to open context details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Lock,
  MapPin,
  Briefcase,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useSalesContext } from '@/lib/intelligence/hooks/useSalesContext';
import { REGION_DISPLAY_NAMES } from '@/lib/intelligence/context/SalesContextProvider';

interface ContextBadgeProps {
  variant?: 'compact' | 'full';
  showDetails?: boolean;
  className?: string;
}

export function ContextBadge({
  variant = 'compact',
  showDetails = false,
  className = '',
}: ContextBadgeProps) {
  const {
    vertical,
    subVertical,
    regions,
    isLocked,
    verticalName,
    subVerticalName,
    regionsDisplay,
    contextBadge,
    hasValidRegions,
    isValidContext,
  } = useSalesContext();

  const [isExpanded, setIsExpanded] = useState(showDetails);

  // Color based on vertical
  const getVerticalColor = () => {
    switch (vertical) {
      case 'banking':
        return { primary: '#1e40af', secondary: '#3b82f6' };
      case 'insurance':
        return { primary: '#059669', secondary: '#10b981' };
      case 'real-estate':
        return { primary: '#0891b2', secondary: '#22d3ee' };
      case 'recruitment':
        return { primary: '#7c3aed', secondary: '#a78bfa' };
      case 'saas-sales':
        return { primary: '#4f46e5', secondary: '#818cf8' };
      default:
        return { primary: '#6b7280', secondary: '#9ca3af' };
    }
  };

  const colors = getVerticalColor();

  // Warning if context is invalid
  const hasWarning = !isValidContext || !hasValidRegions;

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-white/5 border border-white/10 hover:border-white/20
          transition-all text-sm
          ${className}
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
        <div
          className="w-5 h-5 rounded flex items-center justify-center"
          style={{ backgroundColor: `${colors.primary}30` }}
        >
          <Building2 className="w-3 h-3 text-white" />
        </div>

        {/* Label */}
        <span className="text-white font-medium">{subVerticalName}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-400">{regionsDisplay}</span>

        {/* Lock indicator */}
        {isLocked && (
          <Lock className="w-3 h-3 text-gray-500" />
        )}

        {/* Warning indicator */}
        {hasWarning && (
          <AlertCircle className="w-3 h-3 text-amber-400" />
        )}

        {/* Expand indicator */}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </motion.button>
    );
  }

  // Full variant
  return (
    <div className={`${className}`}>
      <motion.div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: `${colors.primary}10`,
          borderColor: `${colors.primary}30`,
        }}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">{contextBadge}</span>
              {isLocked && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">
                  <Lock className="w-3 h-3" />
                  Locked
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Your sales context - all intelligence is filtered by this
            </p>
          </div>

          {/* Expand indicator */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0 space-y-3">
                {/* Vertical */}
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">Vertical:</span>
                  <span className="text-sm text-white font-medium">{verticalName}</span>
                </div>

                {/* Sub-Vertical */}
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">Role:</span>
                  <span className="text-sm text-white font-medium">{subVerticalName}</span>
                </div>

                {/* Regions */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span className="text-sm text-gray-400">Territory:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {regions.map((region) => (
                      <span
                        key={region}
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${colors.primary}20`,
                          color: colors.secondary,
                        }}
                      >
                        {REGION_DISPLAY_NAMES[region] || region}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Warning */}
                {hasWarning && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-300">
                      {!hasValidRegions
                        ? 'No regions selected - some features may be limited'
                        : 'Context is incomplete'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/**
 * Minimal inline context badge for headers
 */
export function ContextBadgeInline({ className = '' }: { className?: string }) {
  const { subVerticalName, regionsDisplay, isLocked } = useSalesContext();

  return (
    <div className={`inline-flex items-center gap-2 text-sm ${className}`}>
      <span className="text-gray-400">{subVerticalName}</span>
      <span className="text-gray-600">•</span>
      <span className="text-gray-500">{regionsDisplay}</span>
      {isLocked && <Lock className="w-3 h-3 text-gray-600" />}
    </div>
  );
}

export default ContextBadge;
