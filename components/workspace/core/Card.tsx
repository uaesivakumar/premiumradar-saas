'use client';

/**
 * Card - S371: Pageless Core Surface
 *
 * Single card component with expand-on-demand behavior.
 *
 * WORKSPACE UX (LOCKED):
 * - Max 2 lines visible by default
 * - Click to expand
 * - Actions live ON the card
 * - Priority-ordered, not chronological
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Zap, Brain, Bell, FileText, Clock, Info } from 'lucide-react';
import type { Card as CardType, CardType as CardTypeEnum } from '@/lib/workspace/card-state';
import { getExpiryDisplayString } from '@/lib/workspace/ttl-engine';
import { CardActions } from './CardActions';

interface CardProps {
  card: CardType;
  onAction: (cardId: string, actionId: string) => void;
  isNBA?: boolean;
}

const cardTypeIcons: Record<CardTypeEnum, React.ComponentType<{ className?: string }>> = {
  nba: Zap,
  decision: Brain,
  signal: Bell,
  report: FileText,
  recall: Clock,
  system: Info,
};

const cardTypeColors: Record<CardTypeEnum, string> = {
  nba: 'border-yellow-500/50 bg-yellow-500/10',
  decision: 'border-purple-500/50 bg-purple-500/10',
  signal: 'border-blue-500/50 bg-blue-500/10',
  report: 'border-green-500/50 bg-green-500/10',
  recall: 'border-gray-500/50 bg-gray-500/10',
  system: 'border-gray-500/30 bg-gray-500/5',
};

const cardTypeLabels: Record<CardTypeEnum, string> = {
  nba: 'Next Best Action',
  decision: 'Decision',
  signal: 'Signal',
  report: 'Report',
  recall: 'Recall',
  system: 'System',
};

export function Card({ card, onAction, isNBA = false }: CardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = cardTypeIcons[card.type];
  const colorClass = cardTypeColors[card.type];
  const expiryDisplay = getExpiryDisplayString(card);

  const handleAction = (actionId: string) => {
    onAction(card.id, actionId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border ${colorClass} overflow-hidden ${
        isNBA ? 'ring-2 ring-yellow-400/30' : ''
      }`}
    >
      {/* Card Header */}
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Type Badge + Expiry */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60 uppercase tracking-wide">
              {cardTypeLabels[card.type]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {expiryDisplay && (
              <span className="text-xs text-gray-500">{expiryDisplay}</span>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </motion.div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-medium mb-1">{card.title}</h3>

        {/* Summary - Max 2 lines */}
        <p className={`text-gray-400 text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
          {card.summary}
        </p>

        {/* Entity Context */}
        {card.entityName && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
              {card.entityName}
            </span>
          </div>
        )}

        {/* Actions - Always visible */}
        <CardActions actions={card.actions} onAction={handleAction} />
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && Boolean(card.expandedContent) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/10">
              {/* Reasoning Points */}
              {card.reasoning && card.reasoning.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Reasoning
                  </p>
                  <ul className="space-y-1">
                    {card.reasoning.map((point, idx) => (
                      <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-gray-600 mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence */}
              {card.confidence !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white/60 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${card.confidence}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs text-white/60">{card.confidence}%</span>
                </div>
              )}

              {/* Tags */}
              {card.tags && card.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Card;
