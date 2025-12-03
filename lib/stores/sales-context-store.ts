/**
 * Sales Context Store
 *
 * Zustand store for managing the salesperson's context.
 * This context filters ALL intelligence operations.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SalesContext,
  Vertical,
  SubVertical,
  RegionContext,
  SalesConfig,
  SalesSignal,
} from '@/lib/intelligence/context/types';
import {
  createSalesContext,
  updateSalesContext,
  filterSignalsByContext,
  getSubVerticalsForVertical,
  isValidSubVertical,
} from '@/lib/intelligence/context/SalesContextProvider';

// =============================================================================
// Initial Context (Unconfigured - must be set via onboarding sync)
// =============================================================================

/**
 * Creates an unconfigured initial context.
 *
 * IMPORTANT: This is a FALLBACK only. The VerticalSyncProvider in
 * dashboard layout will sync the user-selected vertical from
 * onboarding-store on mount.
 *
 * The `isUserConfigured` flag tracks whether vertical was explicitly
 * set by the user during onboarding.
 */
function createInitialContext(): SalesContext {
  const now = new Date();
  return {
    id: 'unconfigured',
    userId: '',
    // Fallback values - will be overwritten by VerticalSyncProvider
    // when user has completed onboarding with a vertical selection
    vertical: 'banking',
    subVertical: 'employee-banking',
    region: {
      country: '',
      city: '',
    },
    salesConfig: {
      signalSensitivities: {},
      productKPIs: [],
    },
    // verticalConfig is undefined - MUST be loaded from API
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// Store Types
// =============================================================================

interface SalesContextState {
  // Current context
  context: SalesContext;

  // Loading state
  isLoaded: boolean;

  // User configuration state - tracks if vertical was explicitly set
  isUserConfigured: boolean;

  // Actions
  setVertical: (vertical: Vertical) => void;
  setSubVertical: (subVertical: SubVertical) => void;
  setRegion: (region: RegionContext) => void;
  updateConfig: (config: Partial<SalesConfig>) => void;
  resetContext: () => void;

  // Full context update
  setContext: (context: SalesContext) => void;

  // Signal filtering
  filterSignals: (signals: SalesSignal[]) => SalesSignal[];

  // Helpers
  getAvailableSubVerticals: () => SubVertical[];
  isValidContext: () => boolean;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useSalesContextStore = create<SalesContextState>()(
  persist(
    (set, get) => ({
      // Initial state - unconfigured context, will be synced from onboarding
      context: createInitialContext(),
      isLoaded: false,
      isUserConfigured: false,

      // Set vertical (resets sub-vertical if invalid)
      // Marks context as user-configured
      setVertical: (vertical: Vertical) => {
        const { context } = get();
        const validSubVerticals = getSubVerticalsForVertical(vertical);

        // If current sub-vertical is invalid for new vertical, reset to first valid
        const newSubVertical = isValidSubVertical(vertical, context.subVertical)
          ? context.subVertical
          : validSubVerticals[0];

        set({
          context: updateSalesContext(context, {
            vertical,
            subVertical: newSubVertical,
          }),
          isUserConfigured: true,  // Mark as configured when vertical is explicitly set
        });
      },

      // Set sub-vertical
      setSubVertical: (subVertical: SubVertical) => {
        const { context } = get();

        // Validate sub-vertical belongs to current vertical
        if (!isValidSubVertical(context.vertical, subVertical)) {
          console.warn(`Invalid sub-vertical ${subVertical} for vertical ${context.vertical}`);
          return;
        }

        set({
          context: updateSalesContext(context, { subVertical }),
        });
      },

      // Set region
      setRegion: (region: RegionContext) => {
        const { context } = get();
        set({
          context: updateSalesContext(context, { region }),
        });
      },

      // Update sales config
      updateConfig: (config: Partial<SalesConfig>) => {
        const { context } = get();
        set({
          context: updateSalesContext(context, {
            salesConfig: { ...context.salesConfig, ...config },
          }),
        });
      },

      // Reset to initial context (must be reconfigured)
      resetContext: () => {
        set({
          context: createInitialContext(),
          isLoaded: false,
          isUserConfigured: false,
        });
      },

      // Set full context (marks as user configured)
      setContext: (context: SalesContext) => {
        set({ context, isLoaded: true, isUserConfigured: true });
      },

      // Filter signals by current context
      filterSignals: (signals: SalesSignal[]) => {
        const { context } = get();
        return filterSignalsByContext(signals, context);
      },

      // Get available sub-verticals for current vertical
      getAvailableSubVerticals: () => {
        const { context } = get();
        return getSubVerticalsForVertical(context.vertical);
      },

      // Validate current context
      isValidContext: () => {
        const { context } = get();
        return isValidSubVertical(context.vertical, context.subVertical);
      },
    }),
    {
      name: 'sales-context-storage',
      partialize: (state) => ({
        context: state.context,
        isUserConfigured: state.isUserConfigured,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoaded = true;
          // Ensure dates are Date objects after rehydration
          if (typeof state.context.createdAt === 'string') {
            state.context.createdAt = new Date(state.context.createdAt);
          }
          if (typeof state.context.updatedAt === 'string') {
            state.context.updatedAt = new Date(state.context.updatedAt);
          }
        }
      },
    }
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const selectSalesContext = (state: SalesContextState) => state.context;
export const selectVertical = (state: SalesContextState) => state.context.vertical;
export const selectSubVertical = (state: SalesContextState) => state.context.subVertical;
export const selectRegion = (state: SalesContextState) => state.context.region;
export const selectSalesConfig = (state: SalesContextState) => state.context.salesConfig;
export const selectIsUserConfigured = (state: SalesContextState) => state.isUserConfigured;
