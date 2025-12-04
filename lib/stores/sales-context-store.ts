/**
 * Sales Context Store
 *
 * Zustand store for managing the salesperson's context.
 * This context filters ALL intelligence operations.
 *
 * CRITICAL: This represents the SALESPERSON's identity:
 * - vertical: The salesperson's sector (banking only for now)
 * - subVertical: The salesperson's role (employee-banking, corporate-banking, etc.)
 * - regions: Multi-select territories (e.g., ['dubai', 'abu-dhabi'])
 * - targetEntity: What the salesperson targets (companies for EB)
 * - subVerticalLocked: Prevents switching after onboarding
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SalesContext,
  Vertical,
  SubVertical,
  SalesConfig,
  SalesSignal,
  RadarTarget,
} from '@/lib/intelligence/context/types';
import {
  VERTICAL_RADAR_TARGETS,
} from '@/lib/intelligence/context/types';
import {
  createSalesContext,
  updateSalesContext,
  filterSignalsByContext,
  getSubVerticalsForVertical,
  isValidSubVertical,
  formatRegionsForDisplay,
  buildContextBadge,
} from '@/lib/intelligence/context/SalesContextProvider';

// =============================================================================
// Initial Context (Empty - must be configured via onboarding)
// =============================================================================

/**
 * Creates an empty initial context
 * User must select vertical/sub-vertical/regions during onboarding
 */
function createInitialContext(): SalesContext {
  const now = new Date();
  return {
    id: 'initial',
    userId: '',
    vertical: 'banking',
    subVertical: 'employee-banking',
    subVerticalLocked: false, // Not locked until onboarding complete
    regions: [], // Empty - must be selected during onboarding
    targetEntity: 'companies', // Banking targets companies
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

  // Actions
  setVertical: (vertical: Vertical) => void;
  setSubVertical: (subVertical: SubVertical) => void;
  setRegions: (regions: string[]) => void;
  addRegion: (region: string) => void;
  removeRegion: (region: string) => void;
  updateConfig: (config: Partial<SalesConfig>) => void;
  resetContext: () => void;

  // Full context update
  setContext: (context: SalesContext) => void;

  // Lock management
  lockSubVertical: () => void;
  unlockSubVertical: () => void;
  isLocked: () => boolean;

  // Signal filtering
  filterSignals: (signals: SalesSignal[]) => SalesSignal[];

  // Helpers
  getAvailableSubVerticals: () => SubVertical[];
  isValidContext: () => boolean;
  hasValidRegions: () => boolean;
  getContextBadge: () => string;
  getRegionsDisplay: () => string;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useSalesContextStore = create<SalesContextState>()(
  persist(
    (set, get) => ({
      // Initial state - empty context, must be configured
      context: createInitialContext(),
      isLoaded: false,

      // Set vertical (only if not locked)
      setVertical: (vertical: Vertical) => {
        const { context } = get();

        // Prevent vertical change if locked
        if (context.subVerticalLocked) {
          console.warn('[SalesContext] Cannot change vertical - context is locked');
          return;
        }

        const validSubVerticals = getSubVerticalsForVertical(vertical);
        const newSubVertical = isValidSubVertical(vertical, context.subVertical)
          ? context.subVertical
          : validSubVerticals[0];

        const targetEntity = VERTICAL_RADAR_TARGETS[vertical];

        set({
          context: updateSalesContext(context, {
            vertical,
            subVertical: newSubVertical,
            targetEntity,
          }),
        });
      },

      // Set sub-vertical (only if not locked)
      setSubVertical: (subVertical: SubVertical) => {
        const { context } = get();

        // Prevent sub-vertical change if locked
        if (context.subVerticalLocked) {
          console.warn('[SalesContext] Cannot change sub-vertical - context is locked');
          return;
        }

        if (!isValidSubVertical(context.vertical, subVertical)) {
          console.warn(`Invalid sub-vertical ${subVertical} for vertical ${context.vertical}`);
          return;
        }

        set({
          context: updateSalesContext(context, { subVertical }),
        });
      },

      // Set regions (multi-select)
      setRegions: (regions: string[]) => {
        const { context } = get();
        set({
          context: updateSalesContext(context, { regions }),
        });
      },

      // Add a single region
      addRegion: (region: string) => {
        const { context } = get();
        if (!context.regions.includes(region)) {
          set({
            context: updateSalesContext(context, {
              regions: [...context.regions, region],
            }),
          });
        }
      },

      // Remove a single region
      removeRegion: (region: string) => {
        const { context } = get();
        set({
          context: updateSalesContext(context, {
            regions: context.regions.filter(r => r !== region),
          }),
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

      // Reset to initial context (for migration workflow)
      resetContext: () => {
        set({
          context: createInitialContext(),
          isLoaded: false,
        });
      },

      // Set full context (used after onboarding completes)
      setContext: (context: SalesContext) => {
        set({ context, isLoaded: true });
      },

      // Lock sub-vertical (called at end of onboarding)
      lockSubVertical: () => {
        const { context } = get();
        set({
          context: updateSalesContext(context, {
            subVerticalLocked: true,
          }),
        });
      },

      // Unlock sub-vertical (for migration workflow - requires confirmation)
      unlockSubVertical: () => {
        const { context } = get();
        set({
          context: updateSalesContext(context, {
            subVerticalLocked: false,
          }),
        });
      },

      // Check if context is locked
      isLocked: () => {
        const { context } = get();
        return context.subVerticalLocked === true;
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
        return isValidSubVertical(context.vertical, context.subVertical) &&
               context.regions.length > 0;
      },

      // Check if regions are valid
      hasValidRegions: () => {
        const { context } = get();
        return context.regions.length > 0;
      },

      // Get context badge string
      getContextBadge: () => {
        const { context } = get();
        return buildContextBadge(context);
      },

      // Get regions display string
      getRegionsDisplay: () => {
        const { context } = get();
        return formatRegionsForDisplay(context.regions);
      },
    }),
    {
      name: 'sales-context-storage',
      partialize: (state) => ({
        context: state.context,
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
          // Ensure regions is an array
          if (!Array.isArray(state.context.regions)) {
            state.context.regions = [];
          }
          // Ensure subVerticalLocked exists
          if (state.context.subVerticalLocked === undefined) {
            state.context.subVerticalLocked = false;
          }
          // Ensure targetEntity exists
          if (!state.context.targetEntity) {
            state.context.targetEntity = VERTICAL_RADAR_TARGETS[state.context.vertical];
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
export const selectRegions = (state: SalesContextState) => state.context.regions;
export const selectTargetEntity = (state: SalesContextState) => state.context.targetEntity;
export const selectIsLocked = (state: SalesContextState) => state.context.subVerticalLocked;
export const selectSalesConfig = (state: SalesContextState) => state.context.salesConfig;

// Legacy selector for backwards compatibility
/** @deprecated Use selectRegions instead */
export const selectRegion = (state: SalesContextState) => state.context.region;
