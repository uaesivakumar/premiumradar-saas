/**
 * useSalesContext Hook
 *
 * React hook for accessing and managing the Sales Context.
 * This context filters ALL intelligence operations.
 *
 * Hierarchy: Vertical → Sub-Vertical → Region
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
} from '@/lib/intelligence/context/types';
import {
  createContextFilter,
  getVerticalDisplayName,
  getSubVerticalDisplayName,
  getRelevantSignalsForSubVertical,
  scoreSignalRelevance,
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
  region: RegionContext;
  salesConfig: SalesConfig;

  // Display names
  verticalName: string;
  subVerticalName: string;
  regionName: string;

  // Actions
  setVertical: (vertical: Vertical) => void;
  setSubVertical: (subVertical: SubVertical) => void;
  setRegion: (region: RegionContext) => void;
  updateConfig: (config: Partial<SalesConfig>) => void;
  resetContext: () => void;

  // Filtering
  filterSignals: (signals: SalesSignal[]) => SalesSignal[];
  getContextFilter: () => ContextFilter;
  scoreSignal: (signal: SalesSignal) => number;

  // Helpers
  availableSubVerticals: SubVertical[];
  relevantSignalTypes: string[];
  isValidContext: boolean;
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
  const setRegion = useSalesContextStore((state) => state.setRegion);
  const updateConfig = useSalesContextStore((state) => state.updateConfig);
  const resetContext = useSalesContextStore((state) => state.resetContext);
  const filterSignals = useSalesContextStore((state) => state.filterSignals);
  const getAvailableSubVerticals = useSalesContextStore((state) => state.getAvailableSubVerticals);
  const isValidContext = useSalesContextStore((state) => state.isValidContext);

  // Convenience accessors
  const vertical = context.vertical;
  const subVertical = context.subVertical;
  const region = context.region;
  const salesConfig = context.salesConfig;

  // Display names
  const verticalName = useMemo(
    () => getVerticalDisplayName(vertical),
    [vertical]
  );

  const subVerticalName = useMemo(
    () => getSubVerticalDisplayName(subVertical),
    [subVertical]
  );

  const regionName = useMemo(() => {
    const parts = [region.country];
    if (region.city) parts.push(region.city);
    if (region.territory) parts.push(region.territory);
    return parts.join(' / ');
  }, [region]);

  // Available sub-verticals
  const availableSubVerticals = useMemo(
    () => getAvailableSubVerticals(),
    [vertical] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Relevant signal types for current sub-vertical
  const relevantSignalTypes = useMemo(
    () => getRelevantSignalsForSubVertical(subVertical),
    [subVertical]
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
    region,
    salesConfig,

    // Display names
    verticalName,
    subVerticalName,
    regionName,

    // Actions
    setVertical,
    setSubVertical,
    setRegion,
    updateConfig,
    resetContext,

    // Filtering
    filterSignals,
    getContextFilter,
    scoreSignal,

    // Helpers
    availableSubVerticals,
    relevantSignalTypes,
    isValidContext: isValidContext(),
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
 * Extract region filter string for queries
 */
export function getRegionFilterString(region: RegionContext): string {
  const parts = [region.country];
  if (region.city) parts.push(region.city);
  if (region.territory) parts.push(region.territory);
  return parts.join(', ');
}

/**
 * Check if a signal's region matches the context region
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
