/**
 * Generic Enrichment Engine
 *
 * CRITICAL ARCHITECTURE (DO NOT CHANGE):
 * =====================================
 * 1. DISCOVERY (Find companies with hiring signals):
 *    - SERP API: Search Google News for hiring/expansion news
 *    - LLM: Extract company names from news articles
 *    - This is the PRIMARY source of leads
 *
 * 2. ENRICHMENT (Add details to discovered companies):
 *    - Apollo: Headcount, growth metrics, HR contacts
 *    - Apollo is ONLY for enrichment, NOT discovery
 *    - If Apollo fails, companies still show (just without enrichment data)
 *
 * Flow:
 * SERP News → LLM Extraction → Companies Discovered → Apollo Enrichment (optional)
 *
 * NO vertical-specific logic hardcoded - all behavior comes from config.
 */

import {
  searchHRContacts,
  enrichCompany,
  toEBEmployer,
  type ApolloCompany,
  type ApolloContact,
} from './apollo';
import {
  getCompanySignals,
  searchTopHiringCompanies,
  discoverCompanies,
  type ExtractedSignal,
} from './serp';
import {
  extractCompaniesFromNews,
  type ExtractedCompany,
} from './llm-extractor';
import {
  getVerticalConfigCached,
  type VerticalConfig,
  type VerticalConfigData,
  type EnrichmentSourceConfig,
} from '@/lib/admin/vertical-config-service';
// Note: Using simplified discovery scoring instead of full VerticalScoringEngine
// to avoid complex type conversions. Apollo enrichment scoring uses full engine.

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
  grade?: 'hot' | 'warm' | 'cold';  // Discovery grade for UI display

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
 * Calculate DISCOVERY score using config weights
 * NO HARDCODING - all weights come from Super Admin vertical config
 *
 * Score based on:
 * - Signal count and types (from config allowedSignalTypes)
 * - Signal confidence (from LLM extraction)
 * - Signal freshness (configurable via scoringFactors)
 */
function calculateDiscoveryScore(
  signals: ExtractedSignal[],
  company: ExtractedCompany,
  config?: VerticalConfigData
): { score: number; breakdown: Record<string, number>; grade: 'hot' | 'warm' | 'cold' } {
  const breakdown: Record<string, number> = {};

  // Get weights from config or use defaults from vertical config
  const scoringFactors = config?.scoringFactors || [];

  // Factor 1: Signal count (more signals = higher score)
  const signalCountFactor = scoringFactors.find(f => f.id === 'news-signals');
  const signalCountWeight = signalCountFactor?.weight || 0.3;
  const signalCountScore = Math.min(100, signals.length * 25); // Max at 4 signals
  breakdown['signal-count'] = Math.round(signalCountScore * signalCountWeight);

  // Factor 2: Signal confidence (average confidence of signals)
  const confidenceFactor = scoringFactors.find(f => f.id === 'signal-confidence');
  const confidenceWeight = confidenceFactor?.weight || 0.3;
  const avgConfidence = signals.length > 0
    ? signals.reduce((sum, s) => sum + (s.confidence || 0.7), 0) / signals.length
    : 0;
  const confidenceScore = avgConfidence * 100;
  breakdown['signal-confidence'] = Math.round(confidenceScore * confidenceWeight);

  // Factor 3: Signal freshness (recent signals score higher)
  const freshnessFactor = scoringFactors.find(f => f.id === 'signal-freshness');
  const freshnessWeight = freshnessFactor?.weight || 0.2;
  const freshness = determineFreshness(signals);
  const freshnessScore = freshness === 'fresh' ? 100 : freshness === 'recent' ? 70 : 40;
  breakdown['signal-freshness'] = Math.round(freshnessScore * freshnessWeight);

  // Factor 4: Signal diversity (different signal types)
  const diversityFactor = scoringFactors.find(f => f.id === 'signal-diversity');
  const diversityWeight = diversityFactor?.weight || 0.2;
  const uniqueTypes = new Set(signals.map(s => s.type)).size;
  const diversityScore = Math.min(100, uniqueTypes * 33); // Max at 3 unique types
  breakdown['signal-diversity'] = Math.round(diversityScore * diversityWeight);

  // Calculate total score
  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const normalizedScore = Math.min(100, Math.round(totalScore));

  // Determine grade using config thresholds or defaults
  // Thresholds can be set per-vertical in Super Admin
  const hotThreshold = config?.scoringWeights?.quality !== undefined
    ? 70  // If config exists, use standard thresholds
    : 70;
  const warmThreshold = config?.scoringWeights?.quality !== undefined
    ? 40
    : 40;

  let grade: 'hot' | 'warm' | 'cold';
  if (normalizedScore >= hotThreshold) {
    grade = 'hot';
  } else if (normalizedScore >= warmThreshold) {
    grade = 'warm';
  } else {
    grade = 'cold';
  }

  return { score: normalizedScore, breakdown, grade };
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
 *
 * ARCHITECTURE (IMPORTANT):
 * - SERP + LLM = PRIMARY for DISCOVERY (find companies from hiring news)
 * - Apollo = ONLY for ENRICHMENT (headcount, contacts AFTER discovery)
 *
 * This is NOT a fallback system. SERP+LLM discovers, Apollo enriches.
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

  // 4. DISCOVERY using SERP + LLM (PRIMARY - not fallback!)
  // Employee Banking discovery: Find companies hiring in UAE from news
  const entities: EnrichedEntity[] = [];
  let discoveredCompanies: ExtractedCompany[] = [];

  // Check if SERP discovery is enabled
  const serpSource = enabledSources.find((s: EnrichmentSourceConfig) =>
    s.id === 'serp-news' || s.type === 'custom' && s.fields?.includes('hiring_news')
  );
  const llmSource = enabledSources.find((s: EnrichmentSourceConfig) =>
    s.id === 'llm-extraction' || s.type === 'custom' && s.fields?.includes('company_names')
  );

  // ALWAYS use SERP + LLM for discovery if enabled
  if (serpSource || llmSource) {
    console.log('[Enrichment] STEP 1: SERP + LLM DISCOVERY (Primary)...');
    console.log(`[Enrichment] Searching hiring news for ${params.subVertical} in ${params.region}...`);

    try {
      // Search news for hiring companies - EB specific keywords
      const serpResult = await discoverCompanies({
        region: params.region,
        city: targetCities[0],
        industry: params.subVertical, // employee-banking
        limit: 50,
      });

      console.log(`[Enrichment] SERP found ${serpResult.news.length} news articles`);
      sourcesUsed.push('serp');

      if (serpResult.news.length > 0) {
        // Use LLM to extract company names from news
        const llmResult = await extractCompaniesFromNews(serpResult.news, {
          vertical: params.vertical,
          subVertical: params.subVertical, // CRITICAL: EB-specific extraction
          region: params.region,
          maxCompanies: params.limit || 25,
        });

        discoveredCompanies = llmResult.companies;
        console.log(`[Enrichment] LLM extracted ${discoveredCompanies.length} companies with hiring signals`);

        if (discoveredCompanies.length > 0) {
          sourcesUsed.push('llm');
        }
      }
    } catch (error) {
      console.error('[Enrichment] SERP + LLM discovery failed:', error);
    }
  }

  // 5. DISCOVERY SCORING (SERP + LLM only - NO Apollo during discovery)
  // Apollo is ONLY used when user explicitly requests enrichment/contacts
  console.log('[Enrichment] STEP 2: Discovery scoring (SERP + LLM data only)...');
  console.log(`[Enrichment] Scoring ${discoveredCompanies.length} discovered companies...`);

  // Process discovered companies - calculate discovery score WITHOUT Apollo
  for (const company of discoveredCompanies.slice(0, params.limit || 25)) {
    // Filter signals by config (only EB-relevant signals)
    const filteredSignals = filterSignalsByConfig(company.signals, config);
    signalCount += filteredSignals.length;

    // Calculate DISCOVERY score using Super Admin config weights
    // NO HARDCODING - all weights come from vertical config in database
    const { score, breakdown, grade } = calculateDiscoveryScore(filteredSignals, company, config);

    if (params.minScore && score < params.minScore) continue;

    const enrichedEntity: EnrichedEntity = {
      id: `serp-${company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      name: company.name,
      type: verticalConfig.radarTarget === 'companies' ? 'company' : 'individual',
      industry: company.industry,
      size: 'smb', // Unknown until enriched with Apollo
      region: params.region,
      city: company.city || targetCities[0],
      description: `${company.name} - discovered via hiring signals in ${params.region}`,
      website: company.domain ? `https://${company.domain}` : undefined,
      score,
      scoreBreakdown: breakdown,
      grade,  // Hot/Warm/Cold from discovery scoring
      signals: filteredSignals,
      freshness: determineFreshness(filteredSignals),
      dataSources: ['serp', 'llm'],
      lastEnriched: new Date(),
    };

    entities.push(enrichedEntity);
  }

  // 6. Sort by score
  entities.sort((a, b) => b.score - a.score);

  const duration = Date.now() - startTime;
  console.log(`[Enrichment] Complete in ${duration}ms: ${entities.length} entities, ${signalCount} signals`);
  console.log(`[Enrichment] Sources used: ${sourcesUsed.join(', ')}`);

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
