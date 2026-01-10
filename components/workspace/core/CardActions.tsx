'use client';

/**
 * CardActions - S371: Pageless Core Surface
 *
 * Action buttons that live ON the card.
 * Actions trigger CardStore mutations.
 *
 * WORKSPACE UX (LOCKED):
 * - [Do Now] [Defer] for NBA cards
 * - [Why?] [Override] for decision cards
 * - [Save] [Ignore] for signal cards
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { CardAction } from '@/lib/workspace/card-state';

interface CardActionsProps {
  actions: CardAction[];
  onAction: (actionId: string) => void;
  compact?: boolean;
  cardStatus?: string;  // S390: Card status for filtering actions
}

// S390: Actions to hide based on current status
// Saved leads: hide Save (already saved) AND Skip/Ignore/Dismiss (can't skip a saved lead)
// Evaluating leads: hide Evaluate (already evaluating)
const hiddenActionsByStatus: Record<string, string[]> = {
  saved: ['save', 'skip', 'ignore', 'dismiss'],  // Hide Save and all Skip variants
  evaluating: ['evaluate'],
  dismissed: ['skip', 'ignore', 'dismiss', 'save', 'evaluate'],  // Hide all actions for skipped leads
};

export function CardActions({ actions, onAction, compact = false, cardStatus }: CardActionsProps) {
  if (!actions.length) return null;

  // S390: Filter out actions that don't make sense for current status
  const hiddenActions = cardStatus ? hiddenActionsByStatus[cardStatus] || [] : [];
  const visibleActions = actions.filter(action => !hiddenActions.includes(action.id));

  if (!visibleActions.length) return null;

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mt-3'}`}>
      {visibleActions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          onClick={() => onAction(action.id)}
          compact={compact}
        />
      ))}
    </div>
  );
}

interface ActionButtonProps {
  action: CardAction;
  onClick: () => void;
  compact?: boolean;
}

function ActionButton({ action, onClick, compact }: ActionButtonProps) {
  const baseStyles = compact
    ? 'px-2 py-1 text-xs rounded'
    : 'px-3 py-1.5 text-sm rounded-lg';

  const typeStyles = {
    primary:
      'bg-white text-slate-900 hover:bg-gray-100 font-medium',
    secondary:
      'bg-white/10 text-white hover:bg-white/20 border border-white/10',
    dismiss:
      'text-gray-400 hover:text-gray-300 hover:bg-white/5',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${baseStyles} ${typeStyles[action.type]} transition-all`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {action.label}
    </motion.button>
  );
}

export default CardActions;
