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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col items-center justify-center text-center"
    >
      {/* Bold headline - like Gemini/Claude */}
      <h1 className="text-3xl md:text-4xl font-light text-white leading-tight max-w-xl">
        {message}
      </h1>

      {/* Subtext - muted but readable */}
      {followUp && (
        <p className="text-base text-gray-400 mt-4 leading-relaxed max-w-lg">
          {followUp}
        </p>
      )}

      {/* Action cards - grid like GPT/Gemini */}
      {actions && actions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-10 w-full max-w-lg">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction?.(action.id)}
              className={`
                px-4 py-4 text-sm text-left rounded-xl transition-all
                border border-white/10 hover:border-white/20
                hover:bg-white/5 group
                ${action.primary ? 'bg-white/5' : 'bg-transparent'}
              `}
            >
              <span className="text-gray-200 group-hover:text-white transition-colors">
                {action.label}
              </span>
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
 * Get time-based greeting
 */
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Build utterance for STATUS_ACKNOWLEDGMENT
 * When: Saved leads exist - WARM GREETING + GUIDE TO ACTION
 *
 * RULES:
 * - Greet warmly, like a colleague
 * - Imply capability and momentum
 * - Invite action without pressure
 */
export function buildStatusAcknowledgment(_savedCount: number): Omit<SystemUtteranceProps, 'onAction'> {
  const greeting = getTimeGreeting();
  return {
    type: 'status_acknowledgment',
    message: `${greeting}. Ready to pick up where you left off?`,
    followUp: 'I can prioritize your pipeline and walk you through the most urgent opportunities.',
    actions: [
      { id: 'prioritize', label: 'Review saved leads', primary: true },
      { id: 'discover', label: 'Find new opportunities' },
      { id: 'ask', label: 'Ask about a company' },
      { id: 'later', label: 'Just browsing' },
    ],
  };
}

/**
 * Build utterance for EMPTY_BUT_ACTIVE
 * When: No signals, no saved leads - WARM WELCOME + INVITE EXPLORATION
 */
export function buildEmptyButActive(subVertical: string, territory: string): Omit<SystemUtteranceProps, 'onAction'> {
  const greeting = getTimeGreeting();
  return {
    type: 'empty_but_active',
    message: `${greeting}. What would you like to focus on?`,
    followUp: `I'm monitoring ${subVertical} opportunities across ${territory}.`,
    actions: [
      { id: 'discover', label: 'Find new opportunities', primary: true },
      { id: 'ask', label: 'Ask about a company' },
      { id: 'trending', label: 'See market trends' },
      { id: 'explore', label: 'Explore by industry' },
    ],
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
      { id: 'discover', label: 'Find more leads' },
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
      { id: 'ask', label: 'Ask about a company' },
      { id: 'monitor', label: 'Monitor only' },
    ],
  };
}

export default SystemUtterance;
