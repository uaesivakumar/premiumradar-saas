/**
 * Silence Store - S377: Silence, TTL, Rehydration
 *
 * Tracks user-silenced patterns to prevent unwanted cards.
 *
 * WORKSPACE UX (LOCKED):
 * - Users can silence by entity, signal type, or source
 * - Silenced patterns persist across sessions
 * - Cards matching silence patterns are filtered out
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Card } from './card-state';

// =============================================================================
// TYPES
// =============================================================================

export type SilenceReason =
  | 'not_interested'    // User not interested in this entity
  | 'already_contacted' // Already contacted this entity
  | 'no_longer_relevant' // Entity no longer relevant
  | 'spam'              // User considers this spam
  | 'other';            // Other reason

export interface SilencePattern {
  id: string;
  type: 'entity' | 'signal_type' | 'source' | 'tag';
  value: string;        // Entity ID, signal type, source name, or tag
  reason: SilenceReason;
  silencedAt: Date;
  expiresAt: Date | null; // null = permanent
}

interface SilenceStore {
  // State
  patterns: SilencePattern[];

  // Actions
  silence: (
    type: SilencePattern['type'],
    value: string,
    reason: SilenceReason,
    durationDays?: number | null
  ) => string;
  unsilence: (patternId: string) => void;

  // Queries
  isSilenced: (card: Card) => boolean;
  getSilenceReason: (card: Card) => SilencePattern | null;
  getPatternsByType: (type: SilencePattern['type']) => SilencePattern[];

  // Lifecycle
  cleanupExpired: () => void;
  clear: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return `silence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function matchesPattern(card: Card, pattern: SilencePattern): boolean {
  switch (pattern.type) {
    case 'entity':
      return card.entityId === pattern.value;
    case 'signal_type':
      return card.sourceType === pattern.value;
    case 'source':
      // Check if card came from this source (e.g., 'discovery', 'manual')
      return card.tags?.includes(`source:${pattern.value}`) || false;
    case 'tag':
      return card.tags?.includes(pattern.value) || false;
    default:
      return false;
  }
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useSilenceStore = create<SilenceStore>()(
  devtools(
    persist(
      (set, get) => ({
        patterns: [],

        // =============================================================================
        // ACTIONS
        // =============================================================================

        silence: (type, value, reason, durationDays = null) => {
          const id = generateId();
          const now = new Date();

          const pattern: SilencePattern = {
            id,
            type,
            value,
            reason,
            silencedAt: now,
            expiresAt: durationDays !== null
              ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
              : null,
          };

          set(state => ({
            patterns: [
              // Remove any existing pattern with same type+value
              ...state.patterns.filter(p => !(p.type === type && p.value === value)),
              pattern,
            ],
          }));

          console.log('[SilenceStore] Pattern added:', type, value);
          return id;
        },

        unsilence: (patternId) => {
          set(state => ({
            patterns: state.patterns.filter(p => p.id !== patternId),
          }));
          console.log('[SilenceStore] Pattern removed:', patternId);
        },

        // =============================================================================
        // QUERIES
        // =============================================================================

        isSilenced: (card) => {
          const { patterns } = get();
          const now = new Date();

          return patterns.some(pattern => {
            // Check if pattern expired
            if (pattern.expiresAt && pattern.expiresAt <= now) {
              return false;
            }
            return matchesPattern(card, pattern);
          });
        },

        getSilenceReason: (card) => {
          const { patterns } = get();
          const now = new Date();

          return patterns.find(pattern => {
            if (pattern.expiresAt && pattern.expiresAt <= now) {
              return false;
            }
            return matchesPattern(card, pattern);
          }) || null;
        },

        getPatternsByType: (type) => {
          return get().patterns.filter(p => p.type === type);
        },

        // =============================================================================
        // LIFECYCLE
        // =============================================================================

        cleanupExpired: () => {
          const now = new Date();
          set(state => ({
            patterns: state.patterns.filter(
              p => p.expiresAt === null || p.expiresAt > now
            ),
          }));
        },

        clear: () => {
          set({ patterns: [] });
        },
      }),
      {
        name: 'silence-store',
        // Serialize/deserialize dates
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const data = JSON.parse(str);
            // Convert date strings back to Date objects
            if (data.state?.patterns) {
              data.state.patterns = data.state.patterns.map((p: SilencePattern) => ({
                ...p,
                silencedAt: new Date(p.silencedAt),
                expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
              }));
            }
            return data;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
      }
    ),
    { name: 'SilenceStore' }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectSilencePatterns = (state: SilenceStore) => state.patterns;
export const selectPatternCount = (state: SilenceStore) => state.patterns.length;

// =============================================================================
// FILTER HELPER
// =============================================================================

/**
 * Filter out silenced cards from a list
 */
export function filterSilenced(cards: Card[]): Card[] {
  const { isSilenced } = useSilenceStore.getState();
  return cards.filter(card => !isSilenced(card));
}
