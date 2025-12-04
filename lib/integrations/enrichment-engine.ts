/**
 * Generic Enrichment Engine
 *
 * Provides unified data enrichment that reads from vertical config.
 * NO vertical-specific logic hardcoded - all behavior comes from config.
 *
 * Flow:
 * 1. Get vertical config from DB (cached)
 * 2. Use enrichmentSources to determine which APIs to call
 * 3. Filter signals based on allowedSignalTypes
 * 4. Apply scoring using scoringWeights and scoringFactors
 *
 * Supports:
 * - Apollo: Company data, headcount, hiring signals
 * - SERP: News, hiring announcements, expansion signals
 * - LinkedIn: Profile enrichment (future)
 * - Crunchbase: Funding, growth signals (future)
 */

import {
  searchUAEEmployers,
  searchHRContacts,
  enrichCompany,
  getHiringSignals,
  toEBEmployer,
  type ApolloCompany,
  type ApolloContact,
} from './apollo';
import {
  getCompanySignals,
  searchTopHiringCompanies,
  type ExtractedSignal,
} from './serp';
import {
  getVerticalConfigCached,
  type VerticalConfig,
  type VerticalConfigData,
  type EnrichmentSourceConfig,
} from '@/lib/admin/vertical-config-service';

// =============================================================================
// TYPES
// =============================================================================

export interface EnrichedEntity {
  id: string;
  name: string;
  type: 'company' | 'individual' | 'family' | 'candidate';
  industry?: string;
  size?: 'enterprise' | 'mid-market' | 'smb';
  headcount?: number;
  headcountGrowth?: number;
  region: string;
  city?: string;
  description?: string;
  website?: string;
  linkedIn?: string;

  // Scoring (uses vertical config weights)
  score: number;
  scoreBreakdown: Record<string, number>;

  // Signals (filtered by allowedSignalTypes)
  signals: ExtractedSignal[];

  // Contact info
  decisionMaker?: {
    name: string;
    title: string;
    email?: string;
    linkedin?: string;
  };

  // Metadata
  freshness: 'fresh' | 'recent' | 'stale';
  dataSources: string[];
  lastEnriched: Date;
}

export interface EnrichmentSearchParams {
  vertical: string;
  subVertical: string;
  region: string;
  regions?: string[];
  industries?: string[];
  minHeadcount?: number;
  maxHeadcount?: number;
  minScore?: number;
  limit?: number;
}

export interface EnrichmentSearchResult {
  entities: EnrichedEntity[];
  total: number;
  regions: string[];
  timestamp: Date;
  verticalConfig: {
    vertical: string;
    subVertical: string;
    region: string;
    radarTarget: string;
  };
  dataQuality: {
    sourcesUsed: string[];
    signalCount: number;
    enrichedCount: number;
  };
}

// =============================================================================
// SCORING ENGINE (Uses Vertical Config)
// =============================================================================

/**
 * Calculate score for an entity using vertical config weights
 */
function calculateScore(
  apolloData: {
    headcount: number;
    headcountGrowth: number;
    openJobs?: number;
    hiringVelocity?: number;
  },
  signals: ExtractedSignal[],
  regionMatch: boolean,
  config: VerticalConfigData
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  // Get scoring factors from config
  const factors = config.scoringFactors || [];

  // Calculate each factor
  for (const factor of factors) {
    let factorScore = 0;

    switch (factor.id) {
      case 'hiring-velocity':
        const openJobs = apolloData.openJobs || 0;
        if (openJobs >= 100) factorScore = 100;
        else if (openJobs >= 50) factorScore = 80;
        else if (openJobs >= 20) factorScore = 60;
        else if (openJobs >= 10) factorScore = 40;
        else if (openJobs > 0) factorScore = 20;
        break;

      case 'headcount-growth':
        const growth = apolloData.headcountGrowth;
        if (growth >= 30) factorScore = 100;
        else if (growth >= 20) factorScore = 80;
        else if (growth >= 10) factorScore = 60;
        else if (growth >= 5) factorScore = 40;
        else if (growth > 0) factorScore = 20;
        break;

      case 'news-signals':
        const hiringSignals = signals.filter(s =>
          config.allowedSignalTypes.includes(s.type)
        ).length;
        factorScore = Math.min(100, hiringSignals * 20);
        break;

      case 'company-size':
        const headcount = apolloData.headcount;
        if (headcount >= 5000) factorScore = 100;
        else if (headcount >= 1000) factorScore = 80;
        else if (headcount >= 500) factorScore = 65;
        else if (headcount >= 200) factorScore = 50;
        else if (headcount >= 50) factorScore = 30;
        break;

      case 'region-match':
        factorScore = regionMatch ? 100 : 0;
        break;

      default:
        // Custom factor - check signals
        const matchingSignals = signals.filter(s => s.type === factor.id).length;
        factorScore = Math.min(100, matchingSignals * 25);
    }

    breakdown[factor.id] = Math.round(factorScore * factor.weight);
  }

  // Calculate total score
  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const normalizedScore = Math.min(100, Math.round(totalScore));

  return { score: normalizedScore, breakdown };
}

/**
 * Determine signal freshness based on dates
 */
function determineFreshness(signals: ExtractedSignal[]): 'fresh' | 'recent' | 'stale' {
  if (signals.length === 0) return 'stale';

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const hasFreshSignal = signals.some(s => {
    if (!s.date) return false;
    const signalDate = new Date(s.date);
    return signalDate > weekAgo;
  });

  if (hasFreshSignal) return 'fresh';

  const hasRecentSignal = signals.some(s => {
    if (!s.date) return false;
    const signalDate = new Date(s.date);
    return signalDate > monthAgo;
  });

  return hasRecentSignal ? 'recent' : 'stale';
}

/**
 * Filter signals based on vertical config's allowedSignalTypes
 */
function filterSignalsByConfig(
  signals: ExtractedSignal[],
  config: VerticalConfigData
): ExtractedSignal[] {
  return signals.filter(signal =>
    config.allowedSignalTypes.includes(signal.type)
  );
}

// =============================================================================
// MAIN ENRICHMENT FUNCTION
// =============================================================================

/**
 * Search and enrich entities using vertical config
 */
export async function searchAndEnrich(
  params: EnrichmentSearchParams
): Promise<EnrichmentSearchResult> {
  const startTime = Date.now();

  // 1. Get vertical config
  const verticalConfig = await getVerticalConfigCached(
    params.vertical,
    params.subVertical,
    params.region
  );

  if (!verticalConfig) {
    throw new Error(
      `VERTICAL_NOT_CONFIGURED: No config found for ${params.vertical}/${params.subVertical}/${params.region}`
    );
  }

  const config = verticalConfig.config;

  // 2. Determine which enrichment sources to use (from config)
  const enabledSources = config.enrichmentSources
    .filter((s: EnrichmentSourceConfig) => s.enabled)
    .sort((a: EnrichmentSourceConfig, b: EnrichmentSourceConfig) => a.priority - b.priority);

  const sourcesUsed: string[] = [];
  let signalCount = 0;

  // 3. Map region IDs to cities (could also come from config)
  const regionToCities: Record<string, string[]> = {
    'dubai': ['Dubai'],
    'abu-dhabi': ['Abu Dhabi'],
    'sharjah': ['Sharjah'],
    'northern-emirates': ['Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
    'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  };

  const targetCities = params.regions?.length
    ? params.regions.flatMap(r => regionToCities[r] || [r])
    : regionToCities[params.region] || ['Dubai'];

  // 4. Fetch data from enabled sources
  const entities: EnrichedEntity[] = [];
  let apolloCompanies: ApolloCompany[] = [];

  // Check if Apollo is enabled
  const apolloSource = enabledSources.find((s: EnrichmentSourceConfig) => s.type === 'apollo');
  if (apolloSource) {
    console.log('[Enrichment] Fetching from Apollo...');
    sourcesUsed.push('apollo');

    try {
      const apolloResult = await searchUAEEmployers({
        minEmployees: params.minHeadcount || 50,
        maxEmployees: params.maxHeadcount,
        perPage: params.limit || 25,
      });
      apolloCompanies = apolloResult.companies;
      console.log(`[Enrichment] Apollo returned ${apolloCompanies.length} companies`);
    } catch (error) {
      console.error('[Enrichment] Apollo failed:', error);
    }
  }

  // 5. Enrich with SERP signals (if enabled)
  const serpEnabled = enabledSources.some((s: EnrichmentSourceConfig) =>
    s.type === 'custom' && s.id === 'serp-news'
  );

  console.log('[Enrichment] Enriching with signals...');

  const enrichmentPromises = apolloCompanies.slice(0, params.limit || 25).map(async (company) => {
    // Get hiring signals from Apollo
    const apolloSignals = getHiringSignals(company);

    // Get news signals from SERP (if enabled)
    let serpSignals: ExtractedSignal[] = [];
    if (serpEnabled) {
      try {
        const allSignals = await getCompanySignals(company.name);
        // Filter signals based on vertical config
        serpSignals = filterSignalsByConfig(allSignals, config);
        signalCount += serpSignals.length;
        if (serpSignals.length > 0) sourcesUsed.push('serp');
      } catch (error) {
        console.warn(`[Enrichment] SERP failed for ${company.name}:`, error);
      }
    }

    // Get HR contact (if needed for this vertical)
    let hrContact: ApolloContact | undefined;
    if (verticalConfig.radarTarget === 'companies') {
      try {
        const contacts = await searchHRContacts(company.name);
        hrContact = contacts[0];
      } catch (error) {
        // Continue without contact
      }
    }

    // Check region match
    const companyCity = company.city?.toLowerCase() || '';
    const regionMatch = targetCities.some(city =>
      companyCity.includes(city.toLowerCase())
    );

    // Calculate score using vertical config
    const { score, breakdown } = calculateScore(
      {
        headcount: company.estimated_num_employees || company.employee_count || 0,
        headcountGrowth: company.employee_growth_6_months || 0,
        openJobs: company.num_open_jobs,
        hiringVelocity: company.hiring_velocity,
      },
      serpSignals,
      regionMatch,
      config
    );

    // Apply minimum score filter
    if (params.minScore && score < params.minScore) {
      return null;
    }

    const baseData = toEBEmployer(company);

    const enrichedEntity: EnrichedEntity = {
      id: baseData.id,
      name: baseData.name,
      type: verticalConfig.radarTarget === 'companies' ? 'company' : 'individual',
      industry: baseData.industry,
      size: baseData.size,
      headcount: baseData.headcount,
      headcountGrowth: baseData.headcountGrowth,
      region: baseData.region,
      city: baseData.city,
      description: baseData.description,
      website: baseData.website,
      linkedIn: baseData.linkedIn,
      score,
      scoreBreakdown: breakdown,
      signals: serpSignals,
      decisionMaker: hrContact ? {
        name: hrContact.name || `${hrContact.first_name} ${hrContact.last_name}`,
        title: hrContact.title || 'Decision Maker',
        email: hrContact.email,
        linkedin: hrContact.linkedin_url,
      } : undefined,
      freshness: determineFreshness(serpSignals),
      dataSources: [...new Set(sourcesUsed)],
      lastEnriched: new Date(),
    };

    return enrichedEntity;
  });

  const enrichedResults = await Promise.all(enrichmentPromises);
  entities.push(...enrichedResults.filter((e): e is EnrichedEntity => e !== null));

  // 6. Sort by score
  entities.sort((a, b) => b.score - a.score);

  const duration = Date.now() - startTime;
  console.log(`[Enrichment] Complete in ${duration}ms: ${entities.length} entities, ${signalCount} signals`);

  return {
    entities,
    total: entities.length,
    regions: params.regions || [params.region],
    timestamp: new Date(),
    verticalConfig: {
      vertical: params.vertical,
      subVertical: params.subVertical,
      region: params.region,
      radarTarget: verticalConfig.radarTarget,
    },
    dataQuality: {
      sourcesUsed: [...new Set(sourcesUsed)],
      signalCount,
      enrichedCount: entities.filter(e => e.signals.length > 0).length,
    },
  };
}

/**
 * Enrich a single entity
 */
export async function enrichSingleEntity(
  entityNameOrDomain: string,
  vertical: string,
  subVertical: string,
  region: string
): Promise<EnrichedEntity | null> {
  try {
    // Get vertical config
    const verticalConfig = await getVerticalConfigCached(vertical, subVertical, region);

    if (!verticalConfig) {
      throw new Error(`VERTICAL_NOT_CONFIGURED`);
    }

    const config = verticalConfig.config;

    // Try Apollo enrichment
    let apolloData: ApolloCompany | null = null;
    if (entityNameOrDomain.includes('.')) {
      apolloData = await enrichCompany(entityNameOrDomain);
    }

    // Get SERP signals
    const allSignals = await getCompanySignals(entityNameOrDomain);
    const filteredSignals = filterSignalsByConfig(allSignals, config);

    if (!apolloData && filteredSignals.length === 0) {
      return null;
    }

    // Get contact
    let hrContact: ApolloContact | undefined;
    try {
      const contacts = await searchHRContacts(entityNameOrDomain);
      hrContact = contacts[0];
    } catch (error) {
      // Continue without contact
    }

    const { score, breakdown } = calculateScore(
      {
        headcount: apolloData?.estimated_num_employees || 0,
        headcountGrowth: apolloData?.employee_growth_6_months || 0,
        openJobs: apolloData?.num_open_jobs,
        hiringVelocity: apolloData?.hiring_velocity,
      },
      filteredSignals,
      true,
      config
    );

    if (apolloData) {
      const baseData = toEBEmployer(apolloData);
      return {
        id: baseData.id,
        name: baseData.name,
        type: 'company',
        industry: baseData.industry,
        size: baseData.size,
        headcount: baseData.headcount,
        headcountGrowth: baseData.headcountGrowth,
        region: baseData.region,
        city: baseData.city,
        description: baseData.description,
        website: baseData.website,
        linkedIn: baseData.linkedIn,
        score,
        scoreBreakdown: breakdown,
        signals: filteredSignals,
        decisionMaker: hrContact ? {
          name: hrContact.name || `${hrContact.first_name} ${hrContact.last_name}`,
          title: hrContact.title || 'Decision Maker',
          email: hrContact.email,
          linkedin: hrContact.linkedin_url,
        } : undefined,
        freshness: determineFreshness(filteredSignals),
        dataSources: ['apollo', filteredSignals.length > 0 ? 'serp' : ''].filter(Boolean),
        lastEnriched: new Date(),
      };
    }

    // SERP-only entity
    return {
      id: `serp-${entityNameOrDomain.toLowerCase().replace(/\s+/g, '-')}`,
      name: entityNameOrDomain,
      type: 'company',
      region: region,
      score,
      scoreBreakdown: breakdown,
      signals: filteredSignals,
      decisionMaker: hrContact ? {
        name: hrContact.name || `${hrContact.first_name} ${hrContact.last_name}`,
        title: hrContact.title || 'Decision Maker',
        email: hrContact.email,
        linkedin: hrContact.linkedin_url,
      } : undefined,
      freshness: determineFreshness(filteredSignals),
      dataSources: ['serp'],
      lastEnriched: new Date(),
    };
  } catch (error) {
    console.error(`[Enrichment] Failed to enrich ${entityNameOrDomain}:`, error);
    return null;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export const enrichmentEngine = {
  search: searchAndEnrich,
  enrich: enrichSingleEntity,
};

export default enrichmentEngine;
