'use client';

/**
 * useVerticalConfig - EB Journey Phase 4
 *
 * Fetches VerticalConfig from the API based on current SalesContext.
 * Provides signal types, journey stages, KPIs, and other config data.
 *
 * Uses React Query for caching (5 min stale time matches server cache).
 */

import { useQuery } from '@tanstack/react-query';
import { useSalesContext } from './useSalesContext';

// =============================================================================
// TYPES
// =============================================================================

export interface SignalTemplate {
  title: string;
  content: string;
  confidence: number;
  relevance: number;
}

export interface SignalConfig {
  type: string;
  name: string;
  description: string;
  relevance: number;
  templates?: SignalTemplate[];
}

export interface JourneyStage {
  id: string;
  name: string;
  order: number;
  actions: string[];
  exitCriteria: string[];
}

export interface DefaultKPI {
  product: string;
  target: number;
  unit: string;
  period: string;
}

export interface ScoringWeights {
  quality: number;
  timing: number;
  liquidity: number;
  endUser: number;
}

export interface ScoringFactor {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export interface RegionalWeight {
  region: string;
  qualityBoost: number;
  timingBoost: number;
  marketMaturity: number;
}

export interface EnrichmentSource {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  fields?: string[];
}

export interface OutreachChannel {
  id: string;
  channel: string;
  enabled: boolean;
  priority: number;
  templates?: string[];
}

export interface VerticalConfigData {
  allowedSignalTypes: string[];
  signalConfigs: SignalConfig[];
  journeyStages: JourneyStage[];
  defaultKPIs: DefaultKPI[];
  scoringWeights: ScoringWeights;
  scoringFactors: ScoringFactor[];
  regionalWeights: RegionalWeight[];
  enrichmentSources: EnrichmentSource[];
  outreachChannels: OutreachChannel[];
  timingSignals?: unknown[];
  b2bAdjustments?: unknown;
  companyProfiles?: unknown[];
}

export interface VerticalConfig {
  id: string;
  vertical: string;
  subVertical: string;
  regionCountry: string;
  regionCity?: string;
  name: string;
  description: string;
  radarTarget: string;
  config: VerticalConfigData;
  isActive: boolean;
  isSeeded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerticalConfigResponse {
  success: boolean;
  data?: VerticalConfig;
  error?: string;
  message?: string;
}

// =============================================================================
// FETCHER
// =============================================================================

const fetchVerticalConfig = async (
  vertical: string,
  subVertical: string,
  region: string
): Promise<VerticalConfigResponse> => {
  const url = `/api/admin/vertical-config?vertical=${encodeURIComponent(vertical)}&subVertical=${encodeURIComponent(subVertical)}&region=${encodeURIComponent(region)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch vertical config');
  }
  return res.json();
};

// =============================================================================
// HOOK
// =============================================================================

export interface UseVerticalConfigReturn {
  // Config data
  config: VerticalConfig | null;
  configData: VerticalConfigData | null;

  // Quick access to common fields
  allowedSignalTypes: string[];
  signalConfigs: SignalConfig[];
  journeyStages: JourneyStage[];
  defaultKPIs: DefaultKPI[];
  scoringWeights: ScoringWeights | null;
  enrichmentSources: EnrichmentSource[];
  outreachChannels: OutreachChannel[];

  // Helpers
  getSignalConfig: (signalType: string) => SignalConfig | undefined;
  isSignalAllowed: (signalType: string) => boolean;

  // State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isConfigured: boolean; // True if vertical is configured

  // Actions
  refresh: () => void;
}

export function useVerticalConfig(): UseVerticalConfigReturn {
  const { vertical, subVertical, regions } = useSalesContext();

  // Use first region for config lookup (configs are typically country-level)
  // In the future, we might need region-specific configs
  const region = regions.length > 0 ? getCountryFromRegion(regions[0]) : 'UAE';

  // Build query key
  const queryKey = ['verticalConfig', vertical, subVertical, region];
  const enabled = Boolean(vertical && subVertical);

  const { data, error, isLoading, refetch } = useQuery<VerticalConfigResponse, Error>({
    queryKey,
    queryFn: () => fetchVerticalConfig(vertical!, subVertical!, region),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - match server cache
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const config = data?.success ? data.data ?? null : null;
  const configData = config?.config ?? null;

  // Quick access fields with defaults
  const allowedSignalTypes = configData?.allowedSignalTypes ?? [];
  const signalConfigs = configData?.signalConfigs ?? [];
  const journeyStages = configData?.journeyStages ?? [];
  const defaultKPIs = configData?.defaultKPIs ?? [];
  const scoringWeights = configData?.scoringWeights ?? null;
  const enrichmentSources = configData?.enrichmentSources ?? [];
  const outreachChannels = configData?.outreachChannels ?? [];

  // Helpers
  const getSignalConfig = (signalType: string): SignalConfig | undefined => {
    return signalConfigs.find((s: SignalConfig) => s.type === signalType);
  };

  const isSignalAllowed = (signalType: string): boolean => {
    return allowedSignalTypes.includes(signalType);
  };

  return {
    config,
    configData,
    allowedSignalTypes,
    signalConfigs,
    journeyStages,
    defaultKPIs,
    scoringWeights,
    enrichmentSources,
    outreachChannels,
    getSignalConfig,
    isSignalAllowed,
    isLoading,
    isError: !!error,
    error: error ?? null,
    isConfigured: config !== null,
    refresh: () => refetch(),
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Maps region IDs to country codes for config lookup
 */
function getCountryFromRegion(region: string): string {
  const regionToCountry: Record<string, string> = {
    // UAE regions
    dubai: 'UAE',
    'abu-dhabi': 'UAE',
    sharjah: 'UAE',
    'northern-emirates': 'UAE',
    // Add more as needed
    riyadh: 'KSA',
    jeddah: 'KSA',
    qatar: 'Qatar',
    bahrain: 'Bahrain',
    kuwait: 'Kuwait',
    oman: 'Oman',
  };

  return regionToCountry[region] ?? region.toUpperCase();
}

export default useVerticalConfig;
