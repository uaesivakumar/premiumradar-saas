/**
 * Left Rail Store - S372: Dynamic Left Rail
 *
 * WORKSPACE UX (LOCKED):
 * - Sections appear/disappear based on state
 * - No empty sections ever visible
 * - No disabled items
 * - Clicking filters, doesn't navigate
 *
 * Sections:
 * - TODAY: Always visible
 * - SAVED LEADS: Show if count > 0
 * - FOLLOW-UPS: Show if count > 0
 * - REPORTS: Show if count > 0
 * - PREFERENCES: Always at bottom
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type LeftRailSection =
  | 'today'
  | 'saved-leads'
  | 'follow-ups'
  | 'reports'
  | 'preferences';

export type CardFilter =
  | { type: 'all' }
  | { type: 'today' }
  | { type: 'saved-leads' }
  | { type: 'follow-ups' }
  | { type: 'reports' }
  | { type: 'entity'; entityId: string };

interface SectionCounts {
  savedLeads: number;
  followUps: number;
  reports: number;
}

interface LeftRailStore {
  // State
  activeSection: LeftRailSection;
  filter: CardFilter;
  counts: SectionCounts;

  // Actions
  setActiveSection: (section: LeftRailSection) => void;
  setFilter: (filter: CardFilter) => void;
  updateCounts: (counts: Partial<SectionCounts>) => void;
  incrementCount: (key: keyof SectionCounts) => void;
  decrementCount: (key: keyof SectionCounts) => void;

  // Computed
  getSectionVisibility: () => Record<LeftRailSection, boolean>;
  getSectionCount: (section: LeftRailSection) => number | null;
}

// =============================================================================
// STORE
// =============================================================================

export const useLeftRailStore = create<LeftRailStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeSection: 'today',
      filter: { type: 'all' },
      counts: {
        savedLeads: 0,
        followUps: 0,
        reports: 0,
      },

      // Actions
      setActiveSection: (section) => {
        set({ activeSection: section });
        // Auto-update filter based on section
        const filterMap: Record<LeftRailSection, CardFilter> = {
          today: { type: 'today' },
          'saved-leads': { type: 'saved-leads' },
          'follow-ups': { type: 'follow-ups' },
          reports: { type: 'reports' },
          preferences: { type: 'all' }, // Preferences doesn't filter cards
        };
        set({ filter: filterMap[section] });
      },

      setFilter: (filter) => set({ filter }),

      updateCounts: (counts) =>
        set((state) => ({
          counts: { ...state.counts, ...counts },
        })),

      incrementCount: (key) =>
        set((state) => ({
          counts: { ...state.counts, [key]: state.counts[key] + 1 },
        })),

      decrementCount: (key) =>
        set((state) => ({
          counts: { ...state.counts, [key]: Math.max(0, state.counts[key] - 1) },
        })),

      // Computed: Which sections are visible
      getSectionVisibility: () => {
        const { counts } = get();
        return {
          today: true, // Always visible
          'saved-leads': counts.savedLeads > 0,
          'follow-ups': counts.followUps > 0,
          reports: counts.reports > 0,
          preferences: true, // Always at bottom
        };
      },

      // Computed: Get count badge for section
      getSectionCount: (section) => {
        const { counts } = get();
        switch (section) {
          case 'saved-leads':
            return counts.savedLeads > 0 ? counts.savedLeads : null;
          case 'follow-ups':
            return counts.followUps > 0 ? counts.followUps : null;
          case 'reports':
            return counts.reports > 0 ? counts.reports : null;
          default:
            return null;
        }
      },
    }),
    { name: 'LeftRailStore' }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectActiveSection = (state: LeftRailStore) => state.activeSection;
export const selectFilter = (state: LeftRailStore) => state.filter;
export const selectCounts = (state: LeftRailStore) => state.counts;
