'use client';

/**
 * CardActions - S396: Status-Aware Action Buttons
 *
 * Action buttons that live ON the card.
 * Actions are DYNAMIC based on card status.
 *
 * STATUS-BASED ACTIONS:
 * - active:     [Enrich] [Save] [Skip] - Initial discovery actions
 * - saved:      [Enrich] [Skip]        - Can enrich a saved lead
 * - evaluating: [See Contacts] [Archive] - Already enriched, view results
 * - dismissed:  (no actions)           - Hidden from workspace
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { CardAction } from '@/lib/workspace/card-state';

interface CardActionsProps {
  actions: CardAction[];
  onAction: (actionId: string) => void;
  compact?: boolean;
  cardStatus?: string;  // S390: Card status for dynamic actions
  cardType?: string;    // S396: Card type for action logic
}

/**
 * S396: Status-specific actions for signal cards (companies)
 * Each status has its own set of appropriate actions.
 * EXPORTED for use in action handlers.
 */
export const statusActions: Record<string, CardAction[]> = {
  // Evaluating = Company has been enriched, user should see contacts
  evaluating: [
    { id: 'see-contacts', label: 'See Contacts', type: 'primary', handler: 'signal.viewContacts' },
    { id: 'archive', label: 'Archive', type: 'dismiss', handler: 'signal.dismiss' },
  ],
  // Saved = Company saved for later, can still enrich or skip
  saved: [
    { id: 'enrich', label: 'Enrich', type: 'primary', handler: 'signal.enrich' },
    { id: 'skip', label: 'Skip', type: 'dismiss', handler: 'signal.dismiss' },
  ],
  // Dismissed = No actions (card shouldn't be visible anyway)
  dismissed: [],
};

/**
 * Get the effective actions for a card based on type and status.
 * Used by both CardActions component and action handlers.
 */
export function getEffectiveActions(
  cardActions: CardAction[],
  cardType?: string,
  cardStatus?: string
): CardAction[] {
  // For signal cards, use status-specific actions
  if (cardType === 'signal' && cardStatus && statusActions[cardStatus]) {
    return statusActions[cardStatus];
  }
  // For other card types, use original actions
  return cardActions;
}

export function CardActions({ actions, onAction, compact = false, cardStatus, cardType }: CardActionsProps) {
  // S396: For signal cards, use status-specific actions
  const effectiveActions = React.useMemo(() => {
    // Only apply status-specific actions to signal cards
    if (cardType === 'signal' && cardStatus && statusActions[cardStatus]) {
      return statusActions[cardStatus];
    }
    // For other card types or active status, use original actions
    return actions;
  }, [actions, cardStatus, cardType]);

  if (!effectiveActions.length) return null;

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mt-3'}`}>
      {effectiveActions.map((action) => (
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

  // S396: Stop propagation to prevent card expand/collapse
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`${baseStyles} ${typeStyles[action.type]} transition-all`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {action.label}
    </motion.button>
  );
}

export default CardActions;
