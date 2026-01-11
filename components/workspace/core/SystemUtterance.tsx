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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="max-w-md mx-auto pt-8"
    >
      {/* System utterance - spoken sentence, not hero state */}
      <p className="text-base text-gray-300 leading-relaxed">
        {message}
      </p>

      {/* Follow-up - slightly muted */}
      {followUp && (
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {followUp}
        </p>
      )}

      {/* CTAs as responses */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className={`
                px-3 py-1.5 text-sm rounded-md transition-colors
                ${action.primary
                  ? 'bg-white/10 text-gray-200 hover:bg-white/15'
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              {action.label}
            </button>
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
 * Build utterance for STATUS_ACKNOWLEDGMENT
 * When: Saved leads exist - ASSERT PRIORITY, don't narrate emptiness
 *
 * RULE: Never say "nothing new" when work exists.
 * Lead with the recommendation.
 */
export function buildStatusAcknowledgment(savedCount: number): Omit<SystemUtteranceProps, 'onAction'> {
  return {
    type: 'status_acknowledgment',
    message: 'Your attention is better spent on existing opportunities right now.',
    followUp: `There ${savedCount === 1 ? 'is 1 saved company' : `are ${savedCount} saved companies`} that ${savedCount === 1 ? "hasn't" : "haven't"} been acted on yet.`,
    actions: [
      { id: 'prioritize', label: 'Prioritize them now', primary: true },
      { id: 'later', label: 'Review later' },
      { id: 'monitor', label: 'Keep monitoring' },
    ],
  };
}

/**
 * Build utterance for EMPTY_BUT_ACTIVE
 * When: No signals, no saved leads, discovery running or monitoring
 */
export function buildEmptyButActive(subVertical: string, territory: string): Omit<SystemUtteranceProps, 'onAction'> {
  return {
    type: 'empty_but_active',
    message: `I'm actively monitoring ${subVertical} in ${territory}.`,
    followUp: "You can ask about a company, or I'll notify you when something changes.",
    actions: [], // No CTAs - user can use the command palette
  };
}

/**
 * Build utterance for ACTION_PROMPT
 * When: NBA exists, clear high-priority action
 */
export function buildActionPrompt(): Omit<SystemUtteranceProps, 'onAction'> {
  return {
    type: 'action_prompt',
    message: 'One opportunity stands out right now.',
    followUp: 'Want to act on it, or see alternatives?',
    actions: [
      { id: 'act', label: 'Show me', primary: true },
      { id: 'alternatives', label: 'See alternatives' },
      { id: 'later', label: 'Later' },
    ],
  };
}

/**
 * Build utterance for DECISION_SUPPORT
 * When: Multiple viable options, no clear winner
 */
export function buildDecisionSupport(optionCount: number): Omit<SystemUtteranceProps, 'onAction'> {
  return {
    type: 'decision_support',
    message: `There are ${optionCount} directions you could take.`,
    followUp: 'What do you want to focus on?',
    actions: [
      { id: 'saved', label: 'Saved opportunities', primary: true },
      { id: 'new', label: 'New discovery' },
      { id: 'monitor', label: 'Monitor only' },
    ],
  };
}

export default SystemUtterance;
