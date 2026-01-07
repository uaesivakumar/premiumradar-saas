/**
 * Card Store - S370: Card State Foundation
 *
 * WORKSPACE UX (LOCKED):
 * - Cards are the only visible artifacts
 * - Single source of truth for UI rendering
 * - Only ONE NBA card at any time
 * - Priority-ordered, not chronological
 *
 * See docs/WORKSPACE_UX_DECISION.md (LOCKED)
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Card,
  CardStatus,
  createCard,
} from '@/lib/workspace/card-state';
import {
  sortByPriority,
  getDisplayCards,
  hasActiveNBA,
  getActiveNBA,
  findDuplicateNBAs,
  getCardsForEntity,
} from '@/lib/workspace/card-priority';
import {
  shouldExpire,
  markExpired,
  TTLEngine,
} from '@/lib/workspace/ttl-engine';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface CardStore {
  // State
  cards: Card[];
  lastUpdated: Date | null;

  // Getters
  getActiveCards: () => Card[];
  getNBA: () => Card | null;
  getByEntity: (entityId: string) => Card[];
  getByType: (type: Card['type']) => Card[];

  // Mutations
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'status'>) => string;
  updateCard: (id: string, updates: Partial<Card>) => void;
  dismissCard: (id: string) => void;
  actOnCard: (id: string, actionId: string) => void;
  removeCard: (id: string) => void;

  // Lifecycle
  expireCards: () => void;
  rehydrate: (cards: Card[]) => void;
  clear: () => void;

  // NBA specific
  setNBA: (card: Omit<Card, 'id' | 'createdAt' | 'status' | 'type'>) => string;
  clearNBA: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useCardStore = create<CardStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        cards: [],
        lastUpdated: null,

        // =============================================================================
        // GETTERS
        // =============================================================================

        getActiveCards: () => {
          const { cards } = get();
          return getDisplayCards(cards);
        },

        getNBA: () => {
          const { cards } = get();
          return getActiveNBA(cards);
        },

        getByEntity: (entityId: string) => {
          const { cards } = get();
          return getCardsForEntity(cards, entityId);
        },

        getByType: (type: Card['type']) => {
          const { cards } = get();
          return sortByPriority(
            cards.filter(card => card.type === type && card.status === 'active')
          );
        },

        // =============================================================================
        // MUTATIONS
        // =============================================================================

        addCard: (cardData) => {
          const newCard = createCard({
            ...cardData,
            status: 'active',
          });

          set(state => {
            let updatedCards = [...state.cards];

            // LOCKED RULE: Only ONE NBA can exist
            if (newCard.type === 'nba') {
              // Dismiss any existing active NBA
              updatedCards = updatedCards.map(card =>
                card.type === 'nba' && card.status === 'active'
                  ? { ...card, status: 'dismissed' as CardStatus }
                  : card
              );
            }

            return {
              cards: [...updatedCards, newCard],
              lastUpdated: new Date(),
            };
          });

          console.log('[CardStore] Card added:', newCard.id, newCard.type);
          return newCard.id;
        },

        updateCard: (id, updates) => {
          set(state => ({
            cards: state.cards.map(card =>
              card.id === id ? { ...card, ...updates } : card
            ),
            lastUpdated: new Date(),
          }));
        },

        dismissCard: (id) => {
          set(state => ({
            cards: state.cards.map(card =>
              card.id === id ? { ...card, status: 'dismissed' as CardStatus } : card
            ),
            lastUpdated: new Date(),
          }));
          console.log('[CardStore] Card dismissed:', id);
        },

        actOnCard: (id, actionId) => {
          set(state => ({
            cards: state.cards.map(card =>
              card.id === id ? { ...card, status: 'acted' as CardStatus } : card
            ),
            lastUpdated: new Date(),
          }));
          console.log('[CardStore] Card acted:', id, 'action:', actionId);
        },

        removeCard: (id) => {
          set(state => ({
            cards: state.cards.filter(card => card.id !== id),
            lastUpdated: new Date(),
          }));
        },

        // =============================================================================
        // LIFECYCLE
        // =============================================================================

        expireCards: () => {
          const now = new Date();
          set(state => {
            const updatedCards = markExpired(state.cards, now);
            const expiredCount = updatedCards.filter(c => c.status === 'expired').length -
                                 state.cards.filter(c => c.status === 'expired').length;

            if (expiredCount > 0) {
              console.log('[CardStore] Cards expired:', expiredCount);
            }

            return { cards: updatedCards, lastUpdated: now };
          });
        },

        rehydrate: (cards: Card[]) => {
          // Convert date strings back to Date objects
          const hydratedCards = cards.map(card => ({
            ...card,
            createdAt: new Date(card.createdAt),
            expiresAt: card.expiresAt ? new Date(card.expiresAt) : null,
          }));

          // Validate NBA constraint
          const duplicateNBAs = findDuplicateNBAs(hydratedCards);
          let finalCards = hydratedCards;

          if (duplicateNBAs.length > 0) {
            console.warn('[CardStore] Duplicate NBAs found during rehydration, removing:', duplicateNBAs);
            finalCards = hydratedCards.map(card =>
              duplicateNBAs.includes(card.id)
                ? { ...card, status: 'dismissed' as CardStatus }
                : card
            );
          }

          // Expire any cards that should be expired
          finalCards = markExpired(finalCards);

          set({
            cards: finalCards,
            lastUpdated: new Date(),
          });

          console.log('[CardStore] Rehydrated with', finalCards.length, 'cards');
        },

        clear: () => {
          set({
            cards: [],
            lastUpdated: new Date(),
          });
        },

        // =============================================================================
        // NBA SPECIFIC
        // =============================================================================

        setNBA: (nbaData) => {
          const { addCard } = get();
          return addCard({
            ...nbaData,
            type: 'nba',
          });
        },

        clearNBA: () => {
          set(state => ({
            cards: state.cards.map(card =>
              card.type === 'nba' && card.status === 'active'
                ? { ...card, status: 'dismissed' as CardStatus }
                : card
            ),
            lastUpdated: new Date(),
          }));
        },
      }),
      {
        name: 'card-store',
        // Only persist active and decision cards (for recall)
        partialize: (state) => ({
          cards: state.cards.filter(card =>
            card.status === 'active' ||
            (card.type === 'decision' && card.status !== 'expired')
          ),
        }),
      }
    ),
    { name: 'CardStore' }
  )
);

// =============================================================================
// TTL ENGINE INTEGRATION
// =============================================================================

let ttlEngine: TTLEngine | null = null;

/**
 * Start the TTL engine for automatic card expiry
 */
export function startTTLEngine(): void {
  if (ttlEngine) return;

  ttlEngine = new TTLEngine({
    getCards: () => useCardStore.getState().cards,
    onExpire: (expiredIds) => {
      const store = useCardStore.getState();
      expiredIds.forEach(id => {
        store.updateCard(id, { status: 'expired' });
      });
    },
    intervalMs: 60000, // Check every minute
  });

  ttlEngine.start();
  console.log('[CardStore] TTL engine started');
}

/**
 * Stop the TTL engine
 */
export function stopTTLEngine(): void {
  if (ttlEngine) {
    ttlEngine.stop();
    ttlEngine = null;
    console.log('[CardStore] TTL engine stopped');
  }
}

// =============================================================================
// SELECTORS
// =============================================================================

export const selectActiveCards = (state: CardStore) => state.getActiveCards();
export const selectNBA = (state: CardStore) => state.getNBA();
export const selectCardCount = (state: CardStore) =>
  state.cards.filter(c => c.status === 'active').length;
