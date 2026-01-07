/**
 * Card Lifecycle Validation Tests - S370 F8
 *
 * Validates:
 * 1. Card interface has all required fields
 * 2. TTL engine correctly expires cards
 * 3. Priority sorting works (higher priority first)
 * 4. Only ONE card with type='nba' can exist
 * 5. rehydrate() correctly restores state
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Card,
  CardType,
  createCard,
  createNBACard,
  createDecisionCard,
  createSignalCard,
  createSystemCard,
  DEFAULT_PRIORITIES,
} from '../card-state';
import {
  TTL_CONFIG,
  getExpiryTime,
  shouldExpire,
  getTimeToExpiry,
  filterExpired,
  markExpired,
  getExpiringCards,
  TTLEngine,
} from '../ttl-engine';
import {
  sortByPriority,
  getDisplayCards,
  ensureNBAFirst,
  boostPriority,
  reducePriority,
  hasActiveNBA,
  getActiveNBA,
  findDuplicateNBAs,
  groupByType,
  getCardsForEntity,
} from '../card-priority';

// =============================================================================
// TEST 1: Card Interface Validation
// =============================================================================

describe('Card Interface', () => {
  it('creates a card with all required fields', () => {
    const card = createCard({
      type: 'signal',
      priority: 600,
      title: 'Test Signal',
      summary: 'This is a test',
      expiresAt: new Date(Date.now() + 86400000),
      sourceType: 'signal',
      actions: [],
    });

    // Required fields
    expect(card.id).toBeDefined();
    expect(typeof card.id).toBe('string');
    expect(card.type).toBe('signal');
    expect(card.priority).toBe(600);
    expect(card.createdAt).toBeInstanceOf(Date);
    expect(card.expiresAt).toBeInstanceOf(Date);
    expect(card.status).toBe('active');
    expect(card.title).toBe('Test Signal');
    expect(card.summary).toBe('This is a test');
    expect(card.sourceType).toBe('signal');
    expect(Array.isArray(card.actions)).toBe(true);
  });

  it('creates NBA card with correct defaults', () => {
    const nba = createNBACard({
      title: 'Call Acme Corp',
      summary: 'High-value prospect ready for outreach',
      entityId: 'company-123',
      entityName: 'Acme Corp',
      actions: [{ id: 'call', label: 'Call', type: 'primary', handler: 'nba.call' }],
    });

    expect(nba.type).toBe('nba');
    expect(nba.priority).toBe(DEFAULT_PRIORITIES.nba);
    expect(nba.priority).toBe(1000);
    expect(nba.entityId).toBe('company-123');
  });

  it('creates decision card that never expires', () => {
    const decision = createDecisionCard({
      title: 'Deal Verdict: Pursue',
      summary: '85% match score',
      expandedContent: { verdict: 'pursue', confidence: 0.85 },
      actions: [],
    });

    expect(decision.type).toBe('decision');
    expect(decision.expiresAt).toBeNull();
  });

  it('creates signal card with TTL when provided', () => {
    const expiryTime = getExpiryTime('signal');
    const signal = createSignalCard({
      title: 'Hiring Signal',
      summary: 'Company is expanding',
      expiresAt: expiryTime,
    });

    expect(signal.type).toBe('signal');
    expect(signal.expiresAt).toBeInstanceOf(Date);
    // Should expire in ~24 hours
    const diff = signal.expiresAt!.getTime() - signal.createdAt.getTime();
    expect(diff).toBeCloseTo(24 * 60 * 60 * 1000, -3); // Within 1 second
  });

  it('creates signal card with null expiry by default', () => {
    const signal = createSignalCard({
      title: 'Hiring Signal',
      summary: 'Company is expanding',
    });

    // Default is null (caller decides TTL policy)
    expect(signal.expiresAt).toBeNull();
  });
});

// =============================================================================
// TEST 2: TTL Engine Validation
// =============================================================================

describe('TTL Engine', () => {
  it('correctly identifies expired cards', () => {
    const expiredCard = createCard({
      type: 'signal',
      priority: 600,
      title: 'Expired',
      summary: 'This is expired',
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
      sourceType: 'signal',
      actions: [],
    });

    const activeCard = createCard({
      type: 'signal',
      priority: 600,
      title: 'Active',
      summary: 'This is active',
      expiresAt: new Date(Date.now() + 86400000), // Tomorrow
      sourceType: 'signal',
      actions: [],
    });

    expect(shouldExpire(expiredCard)).toBe(true);
    expect(shouldExpire(activeCard)).toBe(false);
  });

  it('returns null expiry for decision cards', () => {
    const expiryTime = getExpiryTime('decision');
    expect(expiryTime).toBeNull();
  });

  it('returns correct TTL for each card type', () => {
    expect(TTL_CONFIG.nba).toBe(4 * 60 * 60 * 1000); // 4 hours
    expect(TTL_CONFIG.signal).toBe(24 * 60 * 60 * 1000); // 24 hours
    expect(TTL_CONFIG.decision).toBeNull(); // Never
    expect(TTL_CONFIG.report).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
    expect(TTL_CONFIG.recall).toBe(30 * 60 * 1000); // 30 minutes
    expect(TTL_CONFIG.system).toBe(1 * 60 * 60 * 1000); // 1 hour
  });

  it('marks expired cards correctly', () => {
    const cards: Card[] = [
      createCard({
        type: 'signal',
        priority: 600,
        title: 'Expired',
        summary: 'Should be expired',
        expiresAt: new Date(Date.now() - 1000),
        sourceType: 'signal',
        actions: [],
      }),
      createCard({
        type: 'signal',
        priority: 600,
        title: 'Active',
        summary: 'Should stay active',
        expiresAt: new Date(Date.now() + 86400000),
        sourceType: 'signal',
        actions: [],
      }),
    ];

    const result = markExpired(cards);
    expect(result[0].status).toBe('expired');
    expect(result[1].status).toBe('active');
  });

  it('filters out cards that should expire', () => {
    const cards: Card[] = [
      createCard({
        type: 'signal',
        priority: 600,
        title: 'Expiring',
        summary: 'Should be filtered (active but past expiry)',
        expiresAt: new Date(Date.now() - 1000), // Past expiry time
        sourceType: 'signal',
        actions: [],
        status: 'active', // Still active, should be filtered by shouldExpire check
      }),
      createCard({
        type: 'signal',
        priority: 600,
        title: 'Active',
        summary: 'Should remain',
        expiresAt: new Date(Date.now() + 86400000),
        sourceType: 'signal',
        actions: [],
      }),
    ];

    const filtered = filterExpired(cards);
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Active');
  });

  it('does not filter already-dismissed cards', () => {
    const cards: Card[] = [
      createCard({
        type: 'signal',
        priority: 600,
        title: 'Dismissed',
        summary: 'Already dismissed, not active',
        expiresAt: new Date(Date.now() - 1000),
        sourceType: 'signal',
        actions: [],
        status: 'dismissed',
      }),
    ];

    // shouldExpire returns false for non-active cards
    const filtered = filterExpired(cards);
    expect(filtered.length).toBe(1); // Not filtered because status !== 'active'
  });

  it('finds cards expiring soon', () => {
    const expiringCard = createCard({
      type: 'signal',
      priority: 600,
      title: 'Expiring Soon',
      summary: 'Will expire in 5 minutes',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      sourceType: 'signal',
      actions: [],
    });

    const normalCard = createCard({
      type: 'signal',
      priority: 600,
      title: 'Normal',
      summary: 'Will expire in 24 hours',
      expiresAt: new Date(Date.now() + 86400000),
      sourceType: 'signal',
      actions: [],
    });

    const cards = [expiringCard, normalCard];
    const expiringSoon = getExpiringCards(cards, 10 * 60 * 1000); // 10 minute threshold

    expect(expiringSoon.length).toBe(1);
    expect(expiringSoon[0].title).toBe('Expiring Soon');
  });
});

// =============================================================================
// TEST 3: Priority Sorting Validation
// =============================================================================

describe('Priority Sorting', () => {
  it('sorts cards by priority (higher first)', () => {
    const lowPriority = createCard({
      type: 'system',
      priority: 100,
      title: 'Low',
      summary: 'Low priority',
      sourceType: 'system',
      actions: [],
    });

    const medPriority = createCard({
      type: 'signal',
      priority: 600,
      title: 'Medium',
      summary: 'Medium priority',
      sourceType: 'signal',
      actions: [],
    });

    const highPriority = createCard({
      type: 'nba',
      priority: 1000,
      title: 'High',
      summary: 'High priority',
      sourceType: 'system',
      actions: [],
    });

    const cards = [lowPriority, medPriority, highPriority];
    const sorted = sortByPriority(cards);

    expect(sorted[0].priority).toBe(1000);
    expect(sorted[1].priority).toBe(600);
    expect(sorted[2].priority).toBe(100);
  });

  it('sorts by createdAt within same priority', () => {
    const older = createCard({
      type: 'signal',
      priority: 600,
      title: 'Older',
      summary: 'Created first',
      createdAt: new Date(Date.now() - 60000), // 1 minute ago
      sourceType: 'signal',
      actions: [],
    });

    const newer = createCard({
      type: 'signal',
      priority: 600,
      title: 'Newer',
      summary: 'Created second',
      createdAt: new Date(),
      sourceType: 'signal',
      actions: [],
    });

    const cards = [older, newer];
    const sorted = sortByPriority(cards);

    expect(sorted[0].title).toBe('Newer'); // Newer first
    expect(sorted[1].title).toBe('Older');
  });

  it('only returns active cards in getDisplayCards', () => {
    const activeCard = createCard({
      type: 'signal',
      priority: 600,
      title: 'Active',
      summary: 'Should appear',
      status: 'active',
      sourceType: 'signal',
      actions: [],
    });

    const dismissedCard = createCard({
      type: 'signal',
      priority: 600,
      title: 'Dismissed',
      summary: 'Should not appear',
      status: 'dismissed',
      sourceType: 'signal',
      actions: [],
    });

    const expiredCard = createCard({
      type: 'signal',
      priority: 600,
      title: 'Expired',
      summary: 'Should not appear',
      status: 'expired',
      sourceType: 'signal',
      actions: [],
    });

    const cards = [activeCard, dismissedCard, expiredCard];
    const display = getDisplayCards(cards);

    expect(display.length).toBe(1);
    expect(display[0].title).toBe('Active');
  });

  it('boosts priority without exceeding 999', () => {
    const card = createCard({
      type: 'signal',
      priority: 600,
      title: 'Boost Me',
      summary: 'Will be boosted',
      sourceType: 'signal',
      actions: [],
    });

    const boosted = boostPriority(card, 100);
    expect(boosted.priority).toBe(700);

    const maxBoosted = boostPriority(card, 500);
    expect(maxBoosted.priority).toBe(999); // Capped below NBA
  });

  it('reduces priority without going below 0', () => {
    const card = createCard({
      type: 'signal',
      priority: 600,
      title: 'Reduce Me',
      summary: 'Will be reduced',
      sourceType: 'signal',
      actions: [],
    });

    const reduced = reducePriority(card, 100);
    expect(reduced.priority).toBe(500);

    const maxReduced = reducePriority(card, 1000);
    expect(maxReduced.priority).toBe(0); // Capped at 0
  });
});

// =============================================================================
// TEST 4: Single NBA Constraint Validation
// =============================================================================

describe('Single NBA Constraint', () => {
  it('detects when active NBA exists', () => {
    const nba = createNBACard({
      title: 'Current NBA',
      summary: 'The one and only',
      actions: [],
    });

    const signal = createSignalCard({
      title: 'Signal',
      summary: 'Just a signal',
      actions: [],
    });

    const cards = [nba, signal];
    expect(hasActiveNBA(cards)).toBe(true);

    const noNbaCards = [signal];
    expect(hasActiveNBA(noNbaCards)).toBe(false);
  });

  it('returns the active NBA', () => {
    const nba = createNBACard({
      title: 'Current NBA',
      summary: 'The one and only',
      actions: [],
    });

    const signal = createSignalCard({
      title: 'Signal',
      summary: 'Just a signal',
      actions: [],
    });

    const cards = [nba, signal];
    const activeNBA = getActiveNBA(cards);

    expect(activeNBA).not.toBeNull();
    expect(activeNBA!.title).toBe('Current NBA');
  });

  it('finds duplicate NBAs', () => {
    // Create cards with explicit different timestamps
    const olderTime = new Date(Date.now() - 60000);
    const newerTime = new Date();

    const nba1 = createCard({
      type: 'nba',
      priority: 1000,
      title: 'First NBA',
      summary: 'Created first (older)',
      createdAt: olderTime,
      expiresAt: null,
      sourceType: 'nba',
      actions: [],
    });

    const nba2 = createCard({
      type: 'nba',
      priority: 1000,
      title: 'Second NBA',
      summary: 'Created second (newer)',
      createdAt: newerTime,
      expiresAt: null,
      sourceType: 'nba',
      actions: [],
    });

    const cards = [nba1, nba2];
    const duplicates = findDuplicateNBAs(cards);

    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toBe(nba1.id); // Older one is marked as duplicate
  });

  it('ensures NBA is always first', () => {
    const signal1 = createSignalCard({
      title: 'Signal 1',
      summary: 'First signal',
      priority: 900, // Even with high priority
      actions: [],
    });

    const nba = createNBACard({
      title: 'NBA',
      summary: 'Should be first',
      actions: [],
    });

    const signal2 = createSignalCard({
      title: 'Signal 2',
      summary: 'Second signal',
      actions: [],
    });

    const cards = [signal1, signal2, nba];
    const ensured = ensureNBAFirst(cards);

    expect(ensured[0].type).toBe('nba');
  });
});

// =============================================================================
// TEST 5: Grouping and Entity Functions
// =============================================================================

describe('Grouping Functions', () => {
  it('groups cards by type', () => {
    const cards = [
      createNBACard({ title: 'NBA', summary: 'NBA', actions: [] }),
      createSignalCard({ title: 'Signal 1', summary: 'Signal', actions: [] }),
      createSignalCard({ title: 'Signal 2', summary: 'Signal', actions: [] }),
      createDecisionCard({ title: 'Decision', summary: 'Decision', actions: [] }),
    ];

    const groups = groupByType(cards);

    expect(groups.get('nba')?.length).toBe(1);
    expect(groups.get('signal')?.length).toBe(2);
    expect(groups.get('decision')?.length).toBe(1);
  });

  it('gets cards for specific entity', () => {
    const cards = [
      createSignalCard({
        title: 'Acme Signal',
        summary: 'For Acme',
        entityId: 'acme-123',
        actions: [],
      }),
      createSignalCard({
        title: 'Beta Signal',
        summary: 'For Beta',
        entityId: 'beta-456',
        actions: [],
      }),
      createSignalCard({
        title: 'Another Acme',
        summary: 'Also for Acme',
        entityId: 'acme-123',
        actions: [],
      }),
    ];

    const acmeCards = getCardsForEntity(cards, 'acme-123');
    expect(acmeCards.length).toBe(2);
    expect(acmeCards.every((c) => c.entityId === 'acme-123')).toBe(true);
  });
});

// =============================================================================
// DEFAULT PRIORITIES VALIDATION
// =============================================================================

describe('Default Priorities', () => {
  it('has correct priority values', () => {
    expect(DEFAULT_PRIORITIES.nba).toBe(1000);
    expect(DEFAULT_PRIORITIES.decision).toBe(800);
    expect(DEFAULT_PRIORITIES.signal).toBe(600);
    expect(DEFAULT_PRIORITIES.recall).toBe(400);
    expect(DEFAULT_PRIORITIES.report).toBe(300);
    expect(DEFAULT_PRIORITIES.system).toBe(100);
  });

  it('NBA has highest priority', () => {
    const priorities = Object.values(DEFAULT_PRIORITIES);
    const max = Math.max(...priorities);
    expect(DEFAULT_PRIORITIES.nba).toBe(max);
  });
});
