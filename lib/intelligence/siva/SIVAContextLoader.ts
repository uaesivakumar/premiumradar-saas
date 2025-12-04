'use client';

/**
 * SIVAContextLoader - EB Journey Phase 6.1
 *
 * Loads and combines SalesContext + VerticalConfig into a unified SIVA Context.
 * This context is injected into SIVA wrappers to ensure all intelligence
 * operations are filtered by the salesperson's role and territory.
 *
 * The SIVA Context includes:
 * - Sales context (vertical, subVertical, regions)
 * - Allowed signal types from VerticalConfig
 * - Journey stages for pipeline context
 * - Scoring weights for ranking
 * - Enrichment sources for data fetching
 */

import { useMemo } from 'react';
import { useSalesContext } from '../hooks/useSalesContext';
import { useVerticalConfig } from '../hooks/useVerticalConfig';
import type {
  SignalConfig,
  JourneyStage,
  DefaultKPI,
  ScoringWeights,
  EnrichmentSource,
  OutreachChannel,
} from '../hooks/useVerticalConfig';

// =============================================================================
// TYPES
// =============================================================================

export interface SIVAContext {
  // Identity
  userId: string;
  vertical: string;
  subVertical: string;
  regions: string[];
  subVerticalName: string;
  regionsDisplay: string;

  // Context state
  isLocked: boolean;
  isConfigured: boolean;
  isLoading: boolean;

  // Target (what are we selling to?)
  radarTarget: 'companies' | 'individuals' | 'families' | 'candidates';

  // Signals (what triggers sales opportunities?)
  allowedSignalTypes: string[];
  signalConfigs: SignalConfig[];

  // Journey (pipeline stages)
  journeyStages: JourneyStage[];
  currentStageId?: string;

  // KPIs (what targets?)
  defaultKPIs: DefaultKPI[];

  // Scoring
  scoringWeights: ScoringWeights | null;

  // Enrichment & Outreach
  enrichmentSources: EnrichmentSource[];
  outreachChannels: OutreachChannel[];

  // Helpers
  isSignalAllowed: (signalType: string) => boolean;
  getSignalConfig: (signalType: string) => SignalConfig | undefined;
  getJourneyStage: (stageId: string) => JourneyStage | undefined;
}

export interface SIVAContextLoaderReturn extends SIVAContext {
  // Refresh data from API
  refresh: () => void;

  // Error state
  error: Error | null;
}

// =============================================================================
// FALLBACK VALUES
// =============================================================================

const DEFAULT_RADAR_TARGET = 'companies';

const DEFAULT_SIGNAL_TYPES = [
  'hiring-expansion',
  'office-opening',
  'headcount-jump',
  'subsidiary-creation',
  'market-entry',
];

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to load and combine SalesContext + VerticalConfig
 *
 * Usage:
 *   const sivaContext = useSIVAContextLoader();
 *   if (sivaContext.isSignalAllowed('hiring-expansion')) {
 *     // Process hiring signal
 *   }
 */
export function useSIVAContextLoader(): SIVAContextLoaderReturn {
  // Get sales context from store
  const {
    context: salesContextData,
    vertical,
    subVertical,
    regions,
    subVerticalName,
    regionsDisplay,
    isLocked,
    isValidContext,
  } = useSalesContext();

  // Get userId from context data (may be undefined)
  const userId = salesContextData.userId || `user_${Date.now()}`;

  // Get vertical config from API
  const {
    config,
    configData,
    allowedSignalTypes: configSignalTypes,
    signalConfigs,
    journeyStages,
    defaultKPIs,
    scoringWeights,
    enrichmentSources,
    outreachChannels,
    isLoading,
    isConfigured,
    error,
    refresh,
    getSignalConfig,
    isSignalAllowed: configIsSignalAllowed,
  } = useVerticalConfig();

  // Combine into unified context
  const sivaContext = useMemo<SIVAContext>(() => {
    // Determine radar target from config or default
    const radarTarget = (config?.radarTarget as SIVAContext['radarTarget']) || DEFAULT_RADAR_TARGET;

    // Use config signal types or fallback
    const allowedSignalTypes = configSignalTypes.length > 0 ? configSignalTypes : DEFAULT_SIGNAL_TYPES;

    // Helper to check if signal is allowed
    const isSignalAllowed = (signalType: string): boolean => {
      if (isConfigured) {
        return configIsSignalAllowed(signalType);
      }
      return DEFAULT_SIGNAL_TYPES.includes(signalType);
    };

    // Helper to get journey stage
    const getJourneyStage = (stageId: string): JourneyStage | undefined => {
      return journeyStages.find((s) => s.id === stageId);
    };

    return {
      // Identity
      userId,
      vertical,
      subVertical,
      regions,
      subVerticalName,
      regionsDisplay,

      // State
      isLocked,
      isConfigured,
      isLoading,

      // Target
      radarTarget,

      // Signals
      allowedSignalTypes,
      signalConfigs,

      // Journey
      journeyStages,

      // KPIs
      defaultKPIs,

      // Scoring
      scoringWeights,

      // Enrichment & Outreach
      enrichmentSources,
      outreachChannels,

      // Helpers
      isSignalAllowed,
      getSignalConfig,
      getJourneyStage,
    };
  }, [
    userId,
    vertical,
    subVertical,
    regions,
    subVerticalName,
    regionsDisplay,
    isLocked,
    isConfigured,
    isLoading,
    config,
    configSignalTypes,
    signalConfigs,
    journeyStages,
    defaultKPIs,
    scoringWeights,
    enrichmentSources,
    outreachChannels,
    configIsSignalAllowed,
    getSignalConfig,
  ]);

  return {
    ...sivaContext,
    refresh,
    error,
  };
}

// =============================================================================
// CONTEXT SERIALIZER (for API calls)
// =============================================================================

/**
 * Serialize SIVA Context for API calls
 * Use this when passing context to server-side SIVA wrappers
 */
export function serializeSIVAContext(context: SIVAContext): string {
  return JSON.stringify({
    userId: context.userId,
    vertical: context.vertical,
    subVertical: context.subVertical,
    regions: context.regions,
    radarTarget: context.radarTarget,
    allowedSignalTypes: context.allowedSignalTypes,
    isLocked: context.isLocked,
  });
}

/**
 * Create a minimal context object for embedding in queries
 */
export function createQueryContext(context: SIVAContext): Record<string, unknown> {
  return {
    salesContext: {
      vertical: context.vertical,
      subVertical: context.subVertical,
      regions: context.regions,
    },
    radarTarget: context.radarTarget,
    allowedSignals: context.allowedSignalTypes,
  };
}

export default useSIVAContextLoader;
