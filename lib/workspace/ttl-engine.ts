/**
 * TTL Engine - S370: Card State Foundation
 *
 * Card expiry logic per WORKSPACE_EXPERIENCE_FLOW.md:
 * - Cards expire silently based on type
 * - Expired cards are removed from surface
 * - Decisions NEVER expire (for recall)
 */

import { Card, CardType } from './card-state';

// =============================================================================
// TTL CONFIGURATION
// =============================================================================

/**
 * TTL values by card type (in milliseconds)
 * null = never expires
 */
export const TTL_CONFIG: Record<CardType, number | null> = {
  nba: 4 * 60 * 60 * 1000,          // 4 hours
  signal: 24 * 60 * 60 * 1000,      // 24 hours
  decision: null,                    // Never expires (persist for recall)
  report: 7 * 24 * 60 * 60 * 1000,  // 7 days
  recall: 30 * 60 * 1000,           // 30 minutes
  system: 1 * 60 * 60 * 1000,       // 1 hour
};

// =============================================================================
// TTL FUNCTIONS
// =============================================================================

/**
 * Get expiry time for a card type
 * Returns null if the card type never expires
 */
export function getExpiryTime(type: CardType, fromDate: Date = new Date()): Date | null {
  const ttl = TTL_CONFIG[type];
  if (ttl === null) return null;

  return new Date(fromDate.getTime() + ttl);
}

/**
 * Safely convert expiresAt to Date (handles string from JSON deserialization)
 */
function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

/**
 * Check if a card should be expired
 */
export function shouldExpire(card: Card, now: Date = new Date()): boolean {
  // Already expired, dismissed, or acted
  if (card.status !== 'active') return false;

  // No expiry set
  if (!card.expiresAt) return false;

  // Convert to Date if string (from JSON deserialization)
  const expiresAt = toDate(card.expiresAt);
  if (!expiresAt) return false;

  // Check if expiry time has passed
  return now >= expiresAt;
}

/**
 * Get remaining time until expiry in milliseconds
 * Returns null if no expiry
 * Returns 0 if already expired
 */
export function getTimeToExpiry(card: Card, now: Date = new Date()): number | null {
  if (!card.expiresAt) return null;

  // Convert to Date if string (from JSON deserialization)
  const expiresAt = toDate(card.expiresAt);
  if (!expiresAt) return null;

  const remaining = expiresAt.getTime() - now.getTime();
  return remaining > 0 ? remaining : 0;
}

/**
 * Get human-readable expiry string
 */
export function getExpiryDisplayString(card: Card, now: Date = new Date()): string | null {
  const remaining = getTimeToExpiry(card, now);

  if (remaining === null) return null;
  if (remaining === 0) return 'Expired';

  const minutes = Math.floor(remaining / (60 * 1000));
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));

  if (days > 0) return `${days}d remaining`;
  if (hours > 0) return `${hours}h remaining`;
  if (minutes > 0) return `${minutes}m remaining`;
  return 'Expiring soon';
}

/**
 * Filter out expired cards from a list
 */
export function filterExpired(cards: Card[], now: Date = new Date()): Card[] {
  return cards.filter(card => !shouldExpire(card, now));
}

/**
 * Mark expired cards with status='expired'
 * Returns new array with updated cards
 */
export function markExpired(cards: Card[], now: Date = new Date()): Card[] {
  return cards.map(card => {
    if (shouldExpire(card, now)) {
      return { ...card, status: 'expired' as const };
    }
    return card;
  });
}

/**
 * Get cards that are about to expire (within threshold)
 * Useful for warnings
 */
export function getExpiringCards(
  cards: Card[],
  thresholdMs: number = 30 * 60 * 1000, // 30 minutes
  now: Date = new Date()
): Card[] {
  return cards.filter(card => {
    const remaining = getTimeToExpiry(card, now);
    return remaining !== null && remaining > 0 && remaining <= thresholdMs;
  });
}

// =============================================================================
// TTL ENGINE CLASS (for interval-based expiry)
// =============================================================================

export class TTLEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private onExpire: (expiredIds: string[]) => void;
  private getCards: () => Card[];
  private intervalMs: number;

  constructor(options: {
    getCards: () => Card[];
    onExpire: (expiredIds: string[]) => void;
    intervalMs?: number;
  }) {
    this.getCards = options.getCards;
    this.onExpire = options.onExpire;
    this.intervalMs = options.intervalMs ?? 60000; // Check every minute
  }

  /**
   * Start the TTL engine
   */
  start(): void {
    if (this.intervalId) return; // Already running

    this.intervalId = setInterval(() => {
      this.checkAndExpire();
    }, this.intervalMs);

    // Check immediately on start
    this.checkAndExpire();
  }

  /**
   * Stop the TTL engine
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for expired cards and notify
   */
  private checkAndExpire(): void {
    const cards = this.getCards();
    const now = new Date();

    const expiredIds = cards
      .filter(card => shouldExpire(card, now))
      .map(card => card.id);

    if (expiredIds.length > 0) {
      this.onExpire(expiredIds);
    }
  }

  /**
   * Force a check now
   */
  checkNow(): void {
    this.checkAndExpire();
  }
}
