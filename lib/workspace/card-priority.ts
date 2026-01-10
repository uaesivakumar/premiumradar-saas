/**
 * Card Priority Sorting - S370: Card State Foundation
 *
 * WORKSPACE UX (LOCKED):
 * - Cards are priority-ordered, NOT chronological
 * - NBA card is ALWAYS first (highest priority)
 * - Only ONE NBA can exist at any time
 *
 * Priority Order:
 * 1. NBA (1000) - Always on top
 * 2. Decisions (800) - Important for recall
 * 3. Signals (600) - Actionable opportunities
 * 4. Recall (400) - Informational
 * 5. Reports (300) - Lower priority
 * 6. System (100) - Lowest
 */

import { Card, CardType, DEFAULT_PRIORITIES } from './card-state';

// =============================================================================
// PRIORITY SORTING
// =============================================================================

/**
 * Sort cards by priority (higher first)
 * Within same priority, newer cards first
 */
export function sortByPriority(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    // Primary sort: priority (descending)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    // Secondary sort: createdAt (newer first)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/**
 * S390: Visible statuses - cards that should be shown in UI
 * INVARIANT: A lead never disappears unless user explicitly SKIPS it.
 */
const VISIBLE_STATUSES = ['active', 'evaluating', 'saved'];

/**
 * Get cards sorted and filtered for display
 * - Shows active, evaluating, and saved cards
 * - Sorted by priority
 * - NBA always first
 *
 * S390 FIX: Evaluate and Save keep cards visible
 */
export function getDisplayCards(cards: Card[]): Card[] {
  const visibleCards = cards.filter(card => VISIBLE_STATUSES.includes(card.status));
  return sortByPriority(visibleCards);
}

/**
 * S390: Get cards by lead state for sidebar sections
 */
export function getCardsByState(cards: Card[], status: 'active' | 'evaluating' | 'saved'): Card[] {
  return sortByPriority(cards.filter(card => card.status === status));
}

/**
 * S390: Get all unactioned cards (inbox)
 */
export function getInboxCards(cards: Card[]): Card[] {
  return getCardsByState(cards, 'active');
}

/**
 * S390: Get all cards being evaluated
 */
export function getEvaluatingCards(cards: Card[]): Card[] {
  return getCardsByState(cards, 'evaluating');
}

/**
 * S390: Get all saved cards
 */
export function getSavedCards(cards: Card[]): Card[] {
  return getCardsByState(cards, 'saved');
}

/**
 * Ensure NBA is always first in the sorted list
 * (This is a validation helper - NBA should already have highest priority)
 */
export function ensureNBAFirst(cards: Card[]): Card[] {
  const nba = cards.find(card => card.type === 'nba' && card.status === 'active');

  if (!nba) {
    return sortByPriority(cards);
  }

  const others = cards.filter(card => card.id !== nba.id);
  return [nba, ...sortByPriority(others)];
}

// =============================================================================
// PRIORITY ADJUSTMENT
// =============================================================================

/**
 * Boost a card's priority (make it more visible)
 */
export function boostPriority(card: Card, boost: number = 100): Card {
  return {
    ...card,
    priority: Math.min(card.priority + boost, 999), // Cap below NBA
  };
}

/**
 * Reduce a card's priority (make it less visible)
 */
export function reducePriority(card: Card, reduction: number = 100): Card {
  return {
    ...card,
    priority: Math.max(card.priority - reduction, 0),
  };
}

/**
 * Get relative priority description
 */
export function getPriorityLabel(priority: number): string {
  if (priority >= 900) return 'Urgent';
  if (priority >= 700) return 'High';
  if (priority >= 500) return 'Normal';
  if (priority >= 300) return 'Low';
  return 'Background';
}

// =============================================================================
// NBA CONSTRAINTS
// =============================================================================

/**
 * Check if adding an NBA would violate the single-NBA constraint
 */
export function hasActiveNBA(cards: Card[]): boolean {
  return cards.some(card => card.type === 'nba' && card.status === 'active');
}

/**
 * Get the current active NBA (if any)
 */
export function getActiveNBA(cards: Card[]): Card | null {
  return cards.find(card => card.type === 'nba' && card.status === 'active') || null;
}

/**
 * Validate that only one NBA exists
 * Returns the ID of duplicate NBAs that should be removed
 */
export function findDuplicateNBAs(cards: Card[]): string[] {
  const activeNBAs = cards
    .filter(card => card.type === 'nba' && card.status === 'active')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (activeNBAs.length <= 1) return [];

  // Keep the newest, return IDs of others
  return activeNBAs.slice(1).map(card => card.id);
}

// =============================================================================
// GROUPING
// =============================================================================

/**
 * Group cards by type
 */
export function groupByType(cards: Card[]): Map<CardType, Card[]> {
  const groups = new Map<CardType, Card[]>();

  for (const card of cards) {
    const existing = groups.get(card.type) || [];
    groups.set(card.type, [...existing, card]);
  }

  return groups;
}

/**
 * Group cards by entity
 */
export function groupByEntity(cards: Card[]): Map<string, Card[]> {
  const groups = new Map<string, Card[]>();

  for (const card of cards) {
    if (!card.entityId) continue;

    const existing = groups.get(card.entityId) || [];
    groups.set(card.entityId, [...existing, card]);
  }

  return groups;
}

/**
 * Get cards for a specific entity
 */
export function getCardsForEntity(cards: Card[], entityId: string): Card[] {
  return sortByPriority(
    cards.filter(card => card.entityId === entityId && card.status === 'active')
  );
}
