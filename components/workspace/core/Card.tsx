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
import { ChevronDown, ChevronUp, Zap, Brain, Bell, FileText, Clock, Info, Search } from 'lucide-react';
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
  context: Search,  // S381: Query context card
};

const cardTypeColors: Record<CardTypeEnum, string> = {
  nba: 'border-yellow-500/50 bg-yellow-500/10',
  decision: 'border-purple-500/50 bg-purple-500/10',
  signal: 'border-blue-500/50 bg-blue-500/10',
  report: 'border-green-500/50 bg-green-500/10',
  recall: 'border-gray-500/50 bg-gray-500/10',
  system: 'border-gray-500/30 bg-gray-500/5',
  context: 'border-cyan-500/50 bg-cyan-500/10',  // S381: Query context card - cyan
};

// S390: Status-based styling overrides
const statusColors: Record<string, string> = {
  saved: 'border-emerald-500/50 bg-emerald-500/10',
  evaluating: 'border-amber-500/50 bg-amber-500/10',
};

const statusBadges: Record<string, { label: string; color: string }> = {
  saved: { label: 'Saved', color: 'bg-emerald-500/20 text-emerald-400' },
  evaluating: { label: 'Evaluating', color: 'bg-amber-500/20 text-amber-400' },
};

// S390: Signal type chip colors and labels
const signalTypeConfig: Record<string, { label: string; color: string }> = {
  'hiring-expansion': { label: 'Hiring', color: 'bg-green-500/20 text-green-400' },
  'headcount-jump': { label: 'Growth', color: 'bg-blue-500/20 text-blue-400' },
  'office-opening': { label: 'New Office', color: 'bg-purple-500/20 text-purple-400' },
  'market-entry': { label: 'Market Entry', color: 'bg-cyan-500/20 text-cyan-400' },
  'funding-round': { label: 'Funding', color: 'bg-yellow-500/20 text-yellow-400' },
  'project-award': { label: 'Project', color: 'bg-orange-500/20 text-orange-400' },
  'subsidiary-creation': { label: 'New Entity', color: 'bg-pink-500/20 text-pink-400' },
  // Fallback for unknown signal types
  'default': { label: 'Signal', color: 'bg-gray-500/20 text-gray-400' },
};

// Get signal type config with fallback
function getSignalChip(signalType: string): { label: string; color: string } {
  return signalTypeConfig[signalType] || {
    label: signalType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: signalTypeConfig.default.color
  };
}

const cardTypeLabels: Record<CardTypeEnum, string> = {
  nba: 'Next Best Action',
  decision: 'Decision',
  signal: 'Signal',
  report: 'Report',
  recall: 'Recall',
  system: 'System',
  context: 'Query',  // S381: Query context card
};

export function Card({ card, onAction, isNBA = false }: CardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = cardTypeIcons[card.type];
  // S390: Use status color override for saved/evaluating cards
  const colorClass = statusColors[card.status] || cardTypeColors[card.type];
  const statusBadge = statusBadges[card.status];
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
        {/* Type Badge + Status Badge + Expiry */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-white/60" />
            <span className="text-xs text-white/60 uppercase tracking-wide">
              {cardTypeLabels[card.type]}
            </span>
            {/* S390: Status badge for saved/evaluating */}
            {statusBadge && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            )}
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

        {/* Entity Context + Signal Chips */}
        {(card.entityName || (card.tags && card.tags.length > 0 && card.type === 'signal')) && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {card.entityName && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                {card.entityName}
              </span>
            )}
            {/* S390: Signal type chips - shows what triggered this result */}
            {card.type === 'signal' && card.tags && card.tags.map((tag) => {
              const chip = getSignalChip(tag);
              return (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full ${chip.color}`}
                >
                  {chip.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Actions - Always visible, filtered by status */}
        <CardActions actions={card.actions} onAction={handleAction} cardStatus={card.status} />
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
