'use client';

/**
 * CardContainer - S371: Pageless Core Surface
 * S374: NBA → Card Wiring (action handler integration)
 *
 * Container for displaying cards in priority order.
 * NBA card always first (if exists).
 *
 * WORKSPACE UX (LOCKED):
 * - Priority-ordered, not chronological
 * - NBA always on top
 * - Cards are the only visible artifacts
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType } from '@/lib/workspace/card-state';
import { useCardStore } from '@/lib/stores/card-store';
import { Card } from './Card';

interface CardContainerProps {
  cards: CardType[];
  nba: CardType | null;
  /**
   * S374: External action handler for wired actions
   * If provided, actions are dispatched through this handler
   */
  onAction?: (cardId: string, actionId: string) => Promise<void> | void;
}

export function CardContainer({ cards, nba, onAction }: CardContainerProps) {
  const { actOnCard, dismissCard } = useCardStore();

  const handleAction = useCallback(
    async (cardId: string, actionId: string) => {
      console.log('[CardContainer] Action:', cardId, actionId);

      // Handle dismiss actions locally
      if (actionId === 'dismiss' || actionId === 'ignore') {
        dismissCard(cardId);
        return;
      }

      // S374: If external handler provided, use it for wired actions
      if (onAction) {
        await onAction(cardId, actionId);
        return;
      }

      // Fallback: Mark card as acted (legacy behavior)
      actOnCard(cardId, actionId);
    },
    [actOnCard, dismissCard, onAction]
  );

  // Separate NBA from other cards (it should already be first from sorting, but be explicit)
  const otherCards = nba ? cards.filter((c) => c.id !== nba.id) : cards;

  return (
    <div className="space-y-4">
      {/* NBA Card - Always First (if exists) */}
      <AnimatePresence mode="popLayout">
        {nba && (
          <motion.div
            key={nba.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card card={nba} onAction={handleAction} isNBA />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other Cards - Priority Ordered */}
      <AnimatePresence mode="popLayout">
        {otherCards.map((card) => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card card={card} onAction={handleAction} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state handled by parent (WorkspaceSurface) */}
    </div>
  );
}

export default CardContainer;
