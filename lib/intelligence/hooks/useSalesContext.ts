/**
 * useSalesContext Hook
 *
 * React hook for accessing and managing the Sales Context.
 * This context filters ALL intelligence operations.
 *
 * Hierarchy: Vertical → Sub-Vertical → Regions (multi-select)
 *
 * EB JOURNEY: Updated for multi-region support
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useSalesContextStore } from '@/lib/stores/sales-context-store';
import type {
  SalesContext,
  Vertical,
  SubVertical,
  RegionContext,
  SalesConfig,
  SalesSignal,
  ContextFilter,
  RadarTarget,
} from '@/lib/intelligence/context/types';
import {
  createContextFilter,
  getVerticalDisplayName,
  getSubVerticalDisplayName,
  getAllowedSignalTypes,
  scoreSignalRelevance,
  formatRegionsForDisplay,
} from '@/lib/intelligence/context/SalesContextProvider';

// =============================================================================
// Hook Return Type
// =============================================================================

export interface UseSalesContextResult {
  // Current context
  context: SalesContext;
  isLoaded: boolean;

  // Convenience accessors
  vertical: Vertical;
  subVertical: SubVertical;
  regions: string[];                  // Multi-region array
  targetEntity: RadarTarget;          // What the vertical targets
  salesConfig: SalesConfig;

  // Lock state
  isLocked: boolean;

  // Display names
  verticalName: string;
  subVerticalName: string;
  regionsDisplay: string;             // Formatted regions string
  contextBadge: string;               // Full context badge

  // Actions - Vertical/SubVertical
  setVertical: (vertical: Vertical) => void;
  setSubVertical: (subVertical: SubVertical) => void;

  // Actions - Regions (multi-select)
  setRegions: (regions: string[]) => void;
  addRegion: (region: string) => void;
  removeRegion: (region: string) => void;

  // Actions - Config
  updateConfig: (config: Partial<SalesConfig>) => void;
  resetContext: () => void;

  // Actions - Lock management
  lockSubVertical: () => void;
  unlockSubVertical: () => void;

  // Filtering
  filterSignals: (signals: SalesSignal[]) => SalesSignal[];
  getContextFilter: () => ContextFilter;
  scoreSignal: (signal: SalesSignal) => number;

  // Helpers
  availableSubVerticals: SubVertical[];
  relevantSignalTypes: string[];
  isValidContext: boolean;
  hasValidRegions: boolean;

  /** @deprecated Use regions instead */
  region?: RegionContext;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useSalesContext(): UseSalesContextResult {
  // Get store state and actions
  const context = useSalesContextStore((state) => state.context);
  const isLoaded = useSalesContextStore((state) => state.isLoaded);
  const setVertical = useSalesContextStore((state) => state.setVertical);
  const setSubVertical = useSalesContextStore((state) => state.setSubVertical);
  const setRegions = useSalesContextStore((state) => state.setRegions);
  const addRegion = useSalesContextStore((state) => state.addRegion);
  const removeRegion = useSalesContextStore((state) => state.removeRegion);
  const updateConfig = useSalesContextStore((state) => state.updateConfig);
  const resetContext = useSalesContextStore((state) => state.resetContext);
  const filterSignals = useSalesContextStore((state) => state.filterSignals);
  const getAvailableSubVerticals = useSalesContextStore((state) => state.getAvailableSubVerticals);
  const isValidContextFn = useSalesContextStore((state) => state.isValidContext);
  const hasValidRegionsFn = useSalesContextStore((state) => state.hasValidRegions);
  const getContextBadge = useSalesContextStore((state) => state.getContextBadge);
  const getRegionsDisplay = useSalesContextStore((state) => state.getRegionsDisplay);
  const lockSubVertical = useSalesContextStore((state) => state.lockSubVertical);
  const unlockSubVertical = useSalesContextStore((state) => state.unlockSubVertical);
  const isLockedFn = useSalesContextStore((state) => state.isLocked);

  // Convenience accessors
  const vertical = context.vertical;
  const subVertical = context.subVertical;
  const regions = context.regions;
  const targetEntity = context.targetEntity;
  const salesConfig = context.salesConfig;
  const isLocked = isLockedFn();

  // Display names
  const verticalName = useMemo(
    () => getVerticalDisplayName(vertical),
    [vertical]
  );

  const subVerticalName = useMemo(
    () => getSubVerticalDisplayName(subVertical),
    [subVertical]
  );

  const regionsDisplay = useMemo(
    () => getRegionsDisplay(),
    [regions] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const contextBadge = useMemo(
    () => getContextBadge(),
    [vertical, subVertical, regions] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Available sub-verticals
  const availableSubVerticals = useMemo(
    () => getAvailableSubVerticals(),
    [vertical] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Relevant signal types for current context (from OS config or defaults)
  const relevantSignalTypes = useMemo(
    () => getAllowedSignalTypes(context),
    [context]
  );

  // Create context filter for queries
  const getContextFilter = useCallback(
    () => createContextFilter(context),
    [context]
  );

  // Score a signal's relevance to current context
  const scoreSignal = useCallback(
    (signal: SalesSignal) => scoreSignalRelevance(signal, context),
    [context]
  );

  return {
    // Context
    context,
    isLoaded,

    // Convenience accessors
    vertical,
    subVertical,
    regions,
    targetEntity,
    salesConfig,

    // Lock state
    isLocked,

    // Display names
    verticalName,
    subVerticalName,
    regionsDisplay,
    contextBadge,

    // Actions - Vertical/SubVertical
    setVertical,
    setSubVertical,

    // Actions - Regions
    setRegions,
    addRegion,
    removeRegion,

    // Actions - Config
    updateConfig,
    resetContext,

    // Actions - Lock management
    lockSubVertical,
    unlockSubVertical,

    // Filtering
    filterSignals,
    getContextFilter,
    scoreSignal,

    // Helpers
    availableSubVerticals,
    relevantSignalTypes,
    isValidContext: isValidContextFn(),
    hasValidRegions: hasValidRegionsFn(),

    // Legacy support
    region: context.region,
  };
}

// =============================================================================
// Context Injection Helper
// =============================================================================

/**
 * Helper to inject sales context into wrapper hooks
 * Use this when calling intelligence wrappers
 */
export function injectSalesContext<T extends Record<string, unknown>>(
  params: T,
  context: SalesContext
): T & { salesContext: SalesContext } {
  return {
    ...params,
    salesContext: context,
  };
}

/**
 * Extract region filter string for queries (multi-region)
 */
export function getRegionFilterString(regions: string[]): string {
  if (regions.length === 0) return '';
  if (regions.length === 4) return 'All UAE';
  return regions.join(', ');
}

/**
 * @deprecated Use formatRegionsForDisplay from SalesContextProvider instead
 */
export function getRegionFilterStringLegacy(region: RegionContext): string {
  const parts = [region.country];
  if (region.city) parts.push(region.city);
  if (region.territory) parts.push(region.territory);
  return parts.join(', ');
}

/**
 * Check if a signal's region matches any of the context regions (multi-region)
 */
export function regionMatchesAny(
  signalRegion: string,
  contextRegions: string[]
): boolean {
  if (contextRegions.length === 0) return true; // No region filter

  const normalizedSignal = signalRegion.toLowerCase().replace(/-/g, '').replace(/_/g, '');

  return contextRegions.some(region => {
    const normalizedContext = region.toLowerCase().replace(/-/g, '').replace(/_/g, '');
    return normalizedSignal.includes(normalizedContext) ||
           normalizedContext.includes(normalizedSignal) ||
           normalizedSignal === normalizedContext;
  });
}

/**
 * @deprecated Use regionMatchesAny for multi-region support
 */
export function regionMatches(
  signalRegion: RegionContext,
  contextRegion: RegionContext
): boolean {
  // Country must match
  if (signalRegion.country !== contextRegion.country) {
    return false;
  }

  // City must match if context specifies city
  if (contextRegion.city && signalRegion.city) {
    if (signalRegion.city !== contextRegion.city) {
      return false;
    }
  }

  // Territory must match if context specifies territory
  if (contextRegion.territory && signalRegion.territory) {
    if (signalRegion.territory !== contextRegion.territory) {
      return false;
    }
  }

  return true;
}
