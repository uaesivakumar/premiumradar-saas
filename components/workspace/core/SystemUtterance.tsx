'use client';

/**
 * SystemUtterance - S396: Conversational Workspace
 *
 * The workspace is a turn-based conversation between human judgment
 * and machine intelligence.
 *
 * RULES (LOCKED):
 * - ONE system message at a time
 * - System never speaks twice in a row
 * - CTAs are responses, not navigation
 * - Silence is a feature
 *
 * 6 UTTERANCE TYPES:
 * 1. ACTION_PROMPT - NBA exists, clear winner
 * 2. DECISION_SUPPORT - Multiple options, no clear winner
 * 3. STATUS_ACKNOWLEDGMENT - No new signals, saved leads exist
 * 4. EMPTY_BUT_ACTIVE - No signals, no saved, discovery running
 * 5. ANSWER_RESPONSE - User asked a question
 * 6. SILENCE - No message needed
 */

import React from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

export type UtteranceType =
  | 'action_prompt'
  | 'decision_support'
  | 'status_acknowledgment'
  | 'empty_but_active'
  | 'answer_response'
  | 'silence';

export interface UtteranceAction {
  id: string;
  label: string;
  primary?: boolean;
}

export interface SystemUtteranceProps {
  type: UtteranceType;
  message: string;
  followUp?: string;
  actions?: UtteranceAction[];
  onAction?: (actionId: string) => void;
  // Context for dynamic messages
  context?: {
    savedCount?: number;
    territory?: string;
    subVertical?: string;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SystemUtterance({
  type,
  message,
  followUp,
  actions,
  onAction,
}: SystemUtteranceProps) {
  // Silence = no render
  if (type === 'silence') {
    return null;
  }

  // Separate primary from secondary actions
  const primaryAction = actions?.find((a) => a.primary);
  const secondaryActions = actions?.filter((a) => !a.primary) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col items-center justify-center text-center"
    >
      {/* Bold headline */}
      <h1 className="text-3xl md:text-4xl font-light text-white leading-tight max-w-xl">
        {message}
      </h1>

      {/* System assertion - the recommendation */}
      {followUp && (
        <p className="text-base text-gray-300 mt-4 leading-relaxed max-w-lg">
          {followUp}
        </p>
      )}

      {/* Primary CTA - ONE only, prominent */}
      {primaryAction && (
        <button
          onClick={() => onAction?.(primaryAction.id)}
          className="mt-8 px-6 py-3 bg-white text-slate-950 font-medium rounded-lg
                     hover:bg-gray-100 transition-colors text-sm"
        >
          {primaryAction.label}
        </button>
      )}

      {/* Secondary actions - text links, low emphasis */}
      {secondaryActions.length > 0 && (
        <div className="mt-6 flex items-center gap-1 text-sm text-gray-500">
          {secondaryActions.map((action, index) => (
            <span key={action.id} className="flex items-center">
              <button
                onClick={() => onAction?.(action.id)}
                className="hover:text-gray-300 transition-colors"
              >
                {action.label}
              </button>
              {index < secondaryActions.length - 1 && (
                <span className="mx-2">·</span>
              )}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// UTTERANCE BUILDERS
// =============================================================================

/**
 * Get time-based greeting
 */
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Build utterance for STATUS_ACKNOWLEDGMENT (STATE A - Re-entry)
 * When: Saved leads exist - RECOMMENDATION FIRST
 *
 * RULES:
 * - System commits to a recommendation
 * - ONE primary CTA, secondary as text links
 * - No "just browsing" - destroys authority
 */
export function buildStatusAcknowledgment(savedCount: number): Omit<SystemUtteranceProps, 'onAction'> {
  const greeting = getTimeGreeting();
  const urgencyNote = savedCount > 3
    ? ', and one is time-sensitive'
    : '';
  return {
    type: 'status_acknowledgment',
    message: `${greeting}. Ready to pick up where you left off?`,
    followUp: `I recommend starting with your saved leads — ${savedCount} ${savedCount === 1 ? 'opportunity is' : 'opportunities are'} waiting${urgencyNote}.`,
    actions: [
      { id: 'prioritize', label: 'Start with saved leads', primary: true },
      { id: 'ask', label: 'Ask about a company' },
      { id: 'discover', label: 'Find new opportunities' },
    ],
  };
}

/**
 * Build utterance for EMPTY_BUT_ACTIVE (STATE E - True Empty)
 * When: No signals, no saved leads - READY TO FIND
 *
 * RULES:
 * - No decoration, just readiness
 * - ONE primary action
 */
export function buildEmptyButActive(_subVertical: string, _territory: string): Omit<SystemUtteranceProps, 'onAction'> {
  return {
    type: 'empty_but_active',
    message: "I'm ready to find opportunities for you.",
    actions: [
      { id: 'discover', label: 'Find new opportunities', primary: true },
      { id: 'ask', label: 'Ask about a company' },
    ],
  };
}

/**
 * Build utterance for ACTION_PROMPT (STATE B - Active Guidance)
 * When: NBA exists, clear high-priority action
 *
 * RULES:
 * - System commits to showing the best opportunity
 * - User only decides whether to proceed
 */
export function buildActionPrompt(): Omit<SystemUtteranceProps, 'onAction'> {
  return {
    type: 'action_prompt',
    message: "Let's start with the highest-priority opportunity.",
    actions: [
      { id: 'act', label: 'Show me', primary: true },
      { id: 'alternatives', label: 'See all opportunities' },
    ],
  };
}

/**
 * Build utterance for DECISION_SUPPORT (STATE D - No New Signals, Work Exists)
 * When: No new discovery signals, but saved/unactioned leads exist
 *
 * RULES:
 * - Never say "no new signals" or "monitoring"
 * - Assert that existing work deserves attention
 */
export function buildDecisionSupport(savedCount: number): Omit<SystemUtteranceProps, 'onAction'> {
  return {
    type: 'decision_support',
    message: 'Your attention is better spent on existing opportunities right now.',
    followUp: `There ${savedCount === 1 ? 'is 1 saved company' : `are ${savedCount} saved companies`} that ${savedCount === 1 ? "hasn't" : "haven't"} been acted on yet.`,
    actions: [
      { id: 'prioritize', label: 'Prioritize them now', primary: true },
      { id: 'ask', label: 'Ask about a company' },
    ],
  };
}

export default SystemUtterance;
