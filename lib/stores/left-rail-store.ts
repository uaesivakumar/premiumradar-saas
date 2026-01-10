/**
 * Left Rail Store - S390: Static Sidebar Structure
 *
 * SIDEBAR INVARIANT (LOCKED):
 * - Sidebar structure is STATIC
 * - Menu items NEVER disappear
 * - Counts are DYNAMIC
 * - If count = 0 → show (0), never hide
 *
 * Sections (ALWAYS VISIBLE):
 * - COMPANIES: Saved, Actioned, Ignored, Unactioned
 * - LEADS: Saved, Actioned, Ignored, Unactioned
 * - REPORTS: Performance, Conversion, Pipeline
 * - ACTIVITIES: Today, Yesterday, This Week, Last Week, This Month, Custom
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// =============================================================================
// STATIC SCHEMA (NEVER CHANGES)
// =============================================================================

/**
 * S390: Static sidebar schema - items NEVER disappear
 */
export const SIDEBAR_SCHEMA = {
  companies: {
    label: 'Companies',
    items: ['saved', 'actioned', 'ignored', 'unactioned'] as const,
  },
  leads: {
    label: 'Leads',
    items: ['saved', 'actioned', 'ignored', 'unactioned'] as const,
  },
  reports: {
    label: 'Reports',
    items: ['performance', 'conversion', 'pipeline'] as const,
  },
  activities: {
    label: 'Activities',
    items: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'custom'] as const,
  },
} as const;

export type SidebarSection = keyof typeof SIDEBAR_SCHEMA;
export type CompanyFilter = typeof SIDEBAR_SCHEMA.companies.items[number];
export type LeadFilter = typeof SIDEBAR_SCHEMA.leads.items[number];
export type ReportFilter = typeof SIDEBAR_SCHEMA.reports.items[number];
export type ActivityFilter = typeof SIDEBAR_SCHEMA.activities.items[number];

// =============================================================================
// TYPES
// =============================================================================

export type ActiveFilter =
  | { section: 'companies'; item: CompanyFilter }
  | { section: 'leads'; item: LeadFilter }
  | { section: 'reports'; item: ReportFilter }
  | { section: 'activities'; item: ActivityFilter }
  | null;

interface SectionCounts {
  companies: {
    saved: number;
    actioned: number;
    ignored: number;
    unactioned: number;
  };
  leads: {
    saved: number;
    actioned: number;
    ignored: number;
    unactioned: number;
  };
  reports: {
    performance: number;
    conversion: number;
    pipeline: number;
  };
  activities: {
    today: number;
    yesterday: number;
    this_week: number;
    last_week: number;
    this_month: number;
    custom: number;
  };
}

interface LeftRailStore {
  // State
  activeFilter: ActiveFilter;
  counts: SectionCounts;
  isLoading: boolean;

  // Actions
  setActiveFilter: (filter: ActiveFilter) => void;
  updateCounts: (section: SidebarSection, counts: Partial<SectionCounts[SidebarSection]>) => void;
  setAllCounts: (counts: Partial<SectionCounts>) => void;
  setLoading: (loading: boolean) => void;

  // Getters
  getCount: (section: SidebarSection, item: string) => number;
  isActive: (section: SidebarSection, item: string) => boolean;
}

// =============================================================================
// STORE
// =============================================================================

export const useLeftRailStore = create<LeftRailStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      activeFilter: null,
      isLoading: false,
      counts: {
        companies: {
          saved: 0,
          actioned: 0,
          ignored: 0,
          unactioned: 0,
        },
        leads: {
          saved: 0,
          actioned: 0,
          ignored: 0,
          unactioned: 0,
        },
        reports: {
          performance: 0,
          conversion: 0,
          pipeline: 0,
        },
        activities: {
          today: 0,
          yesterday: 0,
          this_week: 0,
          last_week: 0,
          this_month: 0,
          custom: 0,
        },
      },

      // Actions
      setActiveFilter: (filter) => {
        set({ activeFilter: filter });
        console.log('[LeftRailStore] Filter set:', filter);
      },

      updateCounts: (section, counts) => {
        set((state) => ({
          counts: {
            ...state.counts,
            [section]: {
              ...state.counts[section],
              ...counts,
            },
          },
        }));
      },

      setAllCounts: (counts) => {
        set((state) => ({
          counts: {
            ...state.counts,
            ...counts,
          },
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      // Getters
      getCount: (section, item) => {
        const { counts } = get();
        const sectionCounts = counts[section] as Record<string, number>;
        return sectionCounts[item] ?? 0;
      },

      isActive: (section, item) => {
        const { activeFilter } = get();
        if (!activeFilter) return false;
        return activeFilter.section === section && activeFilter.item === item;
      },
    }),
    { name: 'LeftRailStore' }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectActiveFilter = (state: LeftRailStore) => state.activeFilter;
export const selectCounts = (state: LeftRailStore) => state.counts;
export const selectIsLoading = (state: LeftRailStore) => state.isLoading;
