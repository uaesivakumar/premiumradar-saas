/**
 * SIVA Client - UPR OS Integration (v3.0)
 *
 * Thin integration layer that sends structured payloads to UPR OS SIVA
 * and returns deterministic decisions. NO intelligence logic in SaaS.
 *
 * v3.0 Changes (Sprint 71 - Multi-Vertical):
 * - Added sub_vertical_slug support for persona-driven SIVA tools
 * - All tool inputs now accept optional sub_vertical_slug
 * - Persona loading happens in UPR OS, not SaaS
 *
 * CRITICAL RULES:
 * - DO NOT build prompts here
 * - DO NOT invent scoring logic
 * - DO NOT re-implement SIVA primitives
 * - SaaS is a messenger + renderer, NOT a brain
 *
 * Reference: docs/SIVA_API_CONTRACT.md
 */

// =============================================================================
// TYPES
// =============================================================================

export type SIVAProfile =
  | 'banking_employee'
  | 'banking_corporate'
  | 'insurance_individual'
  | 'recruitment_hiring'
  | 'saas_b2b'
  | 'default';

export type ScoreType = 'q_score' | 't_score' | 'l_score' | 'e_score' | 'composite';

export type Tier = 'HOT' | 'WARM' | 'COLD' | 'DISQUALIFIED';

export type ContactTier = 'STRATEGIC' | 'PRIMARY' | 'SECONDARY' | 'BACKUP';

export type TimingCategory = 'OPTIMAL' | 'GOOD' | 'FAIR' | 'POOR';

export type EdgeDecision = 'BLOCK' | 'WARN' | 'PROCEED';

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface Signal {
  type: string;
  title?: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  confidence?: number;
}

export interface EntityData {
  name: string;
  domain?: string;
  industry?: string;
  size?: number;
  size_range?: string;
  linkedin_url?: string;
  locations?: string[];
  headcount?: number;
  headcount_growth?: number;
}

export interface UAESignals {
  has_ae_domain?: boolean;
  has_uae_address?: boolean;
  linkedin_location?: string;
}

export interface SalaryIndicators {
  salary_level?: 'low' | 'medium' | 'high';
  avg_salary?: number;
}

export interface ScoreRequest {
  entity_type?: 'company';
  entity_id?: string;
  entity_data?: EntityData;
  signals?: Signal[];
  score_types?: ScoreType[];
  options?: {
    include_breakdown?: boolean;
    include_explanation?: boolean;
    profile?: SIVAProfile;
  };
}

export interface RankRequest {
  entities: Array<{
    id: string;
    name?: string;
    scores?: {
      q_score?: number;
      t_score?: number;
      l_score?: number;
      e_score?: number;
    };
  }>;
  options?: {
    profile?: SIVAProfile;
    weights?: {
      q_score?: number;
      t_score?: number;
      l_score?: number;
      e_score?: number;
    };
    limit?: number;
    explain?: boolean;
  };
}

export interface CompanyQualityInput {
  company_name: string;
  domain?: string;
  industry?: string;
  size?: number;
  size_bucket?: 'startup' | 'scaleup' | 'enterprise';
  uae_signals?: UAESignals;
  salary_indicators?: SalaryIndicators;
  license_type?: 'Free Zone' | 'Mainland' | 'unknown';
}

export interface ContactTierInput {
  title: string;
  company_size?: number;
  department?: string;
  hiring_velocity_monthly?: number;
  // v3.0: Persona support
  sub_vertical_slug?: string;
}

export interface TimingScoreInput {
  current_date?: string;
  signal_type?: 'hiring' | 'funding' | 'expansion' | 'award';
  signal_age?: number;
  fiscal_context?: {
    quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  };
  // v3.0: Persona support
  sub_vertical_slug?: string;
}

export interface EdgeCasesInput {
  company_profile: {
    name: string;
    sector?: 'private' | 'government' | 'semi-government';
    size?: number;
    year_founded?: number;
    is_sanctioned?: boolean;
    is_bankrupt?: boolean;
    has_legal_issues?: boolean;
  };
  contact_profile?: {
    email?: string;
    is_verified?: boolean;
    has_bounced?: boolean;
    has_opted_out?: boolean;
  };
  historical_data?: {
    previous_attempts?: number;
    previous_responses?: number;
    last_contact_date?: string;
    has_active_negotiation?: boolean;
  };
  // v3.0: Persona support
  sub_vertical_slug?: string;
  signal_data?: {
    days_since_signal?: number;
    signal_type?: string;
  };
}

export interface CompositeScoreInput {
  company_quality: {
    quality_score: number;
    confidence: number;
    edge_cases_applied?: string[];
  };
  contact_tier?: {
    tier: ContactTier;
    priority: number;
    confidence: number;
  };
  timing_score?: {
    timing_multiplier: number;
    category: TimingCategory;
    confidence: number;
  };
  edge_cases?: {
    decision: EdgeDecision;
    blockers?: unknown[];
    warnings?: unknown[];
  };
  signals?: Array<{
    type: string;
    confidence: number;
    age_days?: number;
  }>;
}

// =============================================================================
// OUTPUT TYPES
// =============================================================================

export interface ScoreResponse {
  success: boolean;
  data: {
    entity_id: string | null;
    entity_type: 'company';
    scores: {
      q_score?: { value: number; rating?: string; breakdown?: Record<string, number> };
      t_score?: { value: number; category?: string; breakdown?: Record<string, number> };
      l_score?: { value: number; tier?: string; breakdown?: Record<string, number> };
      e_score?: { value: number; strength?: string; breakdown?: Record<string, number> };
      composite?: { value: number; tier: Tier; grade: string };
    };
    explanations?: Record<string, string>;
    scoring_profile: string;
  };
  reason: string;
  confidence: number;
  profile: string;
  executionTimeMs: number;
  requestId: string;
}

export interface RankResponse {
  success: boolean;
  data: {
    ranked_entities: Array<{
      rank: number;
      entity_id: string;
      rank_score: number;
      scores: Record<string, number>;
      position_change?: number;
      explanation?: {
        why_this_rank: string[];
        comparison_to_next?: string;
        why_not_first?: string;
      };
    }>;
    total_ranked: number;
    total_input: number;
    ranking_config: {
      profile: string;
      weights: Record<string, number>;
      is_custom_weights: boolean;
    };
  };
  reason: string;
  confidence: number;
  profile: string;
  executionTimeMs: number;
  requestId: string;
}

export interface CompanyQualityResponse {
  success: boolean;
  tool: string;
  result: {
    quality_score: number;
    reasoning: Array<{
      factor: string;
      points: number;
      explanation: string;
    }>;
    confidence: number;
    policy_version: string;
    edge_cases_applied: string[];
    timestamp: string;
  };
  metadata: {
    executionTimeMs: number;
    timestamp: string;
  };
}

export interface ContactTierResponse {
  success: boolean;
  tool: string;
  result: {
    tier: ContactTier;
    priority: 1 | 2 | 3 | 4;
    confidence: number;
    reasoning: string;
    target_titles: string[];
    fallback_titles: string[];
    metadata: {
      score_breakdown: {
        seniority_score: number;
        department_score: number;
        company_size_score: number;
      };
      inferred_seniority: string;
      inferred_department: string;
      // v3.0: Persona info
      persona_loaded?: boolean;
      persona_titles_used?: boolean;
      sub_vertical_slug?: string;
      persona_name?: string | null;
    };
  };
  metadata: {
    executionTimeMs: number;
    timestamp: string;
  };
}

export interface TimingScoreResponse {
  success: boolean;
  tool: string;
  result: {
    timing_multiplier: number;
    category: TimingCategory;
    confidence: number;
    reasoning: string;
    metadata: {
      calendar_multiplier: number;
      signal_recency_multiplier: number;
      signal_type_modifier: number;
      calendar_context: string;
      signal_freshness: string;
      next_optimal_window?: string;
      // v3.0: Persona info
      persona_loaded?: boolean;
      persona_timing_applied?: boolean;
      sub_vertical_slug?: string;
      persona_name?: string | null;
    };
  };
  metadata: {
    executionTimeMs: number;
    timestamp: string;
  };
}

export interface EdgeCasesResponse {
  success: boolean;
  tool: string;
  result: {
    decision: EdgeDecision;
    confidence: number;
    blockers: Array<{
      type: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
      message: string;
      can_override: boolean;
      metadata?: {
        rule_type?: string;
        multiplier?: number;
        source?: 'hardcoded' | 'persona';
      };
    }>;
    warnings: Array<{
      type: string;
      severity: 'MEDIUM' | 'LOW';
      message: string;
      can_override: boolean;
    }>;
    // v3.0: Persona-driven boosters
    boosters?: Array<{
      type: string;
      multiplier: number;
      reason: string;
      source: 'persona';
    }>;
    reasoning: string;
    metadata: {
      blockers_count: number;
      warnings_count: number;
      boosters_count?: number;
      critical_issues: string[];
      persona_blockers?: number;
      overridable: boolean;
      // v3.0: Persona info
      persona_loaded?: boolean;
      sub_vertical_slug?: string;
      persona_name?: string | null;
    };
  };
  metadata: {
    executionTimeMs: number;
    timestamp: string;
  };
}

export interface CompositeScoreResponse {
  success: boolean;
  tool: string;
  result: {
    q_score: number;
    tier: Tier;
    confidence: number;
    breakdown: {
      company_contribution: number;
      contact_contribution: number;
      timing_contribution: number;
      signal_contribution: number;
      edge_case_penalty: number;
    };
    recommended_action: 'PRIORITIZE' | 'QUEUE' | 'NURTURE' | 'SKIP';
    reasoning: string;
  };
  metadata: {
    executionTimeMs: number;
    timestamp: string;
  };
}

export interface SIVAError {
  success: false;
  error: string;
  code?: string;
  tool?: string;
  metadata?: {
    executionTimeMs: number;
    timestamp: string;
    requestId?: string;
  };
}

// =============================================================================
// CLIENT CONFIGURATION
// =============================================================================

const UPR_OS_URL = process.env.UPR_OS_URL || 'https://upr-os.sivakumar.ai';
// VS10.5: Use PR_OS_TOKEN for SaaS→OS authentication (same as os-client.ts)
const PR_OS_TOKEN = process.env.PR_OS_TOKEN || process.env.UPR_OS_API_KEY || '';
const SIVA_TIMEOUT_MS = 10000; // 10s timeout

/**
 * Get headers for SIVA requests
 * VS10.5: Added x-pr-os-token for secure OS authentication
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    // VS10.5: Secure SaaS→OS boundary with token authentication
    'x-pr-os-token': PR_OS_TOKEN,
    'X-Module-Caller': 'premiumradar-saas',
    'X-Request-Source': 'saas-siva-client',
  };
}

/**
 * Make request to UPR OS SIVA
 */
async function sivaRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${UPR_OS_URL}${endpoint}`;

  console.log(`[SIVA] POST ${endpoint}`, { bodyKeys: Object.keys(body) });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SIVA_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SIVA] Error ${response.status}:`, errorText);
      throw new Error(`SIVA error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[SIVA] Response from ${endpoint}:`, { success: data.success });

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`SIVA timeout after ${SIVA_TIMEOUT_MS}ms`);
    }

    throw error;
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Score an entity using UPR OS SIVA
 *
 * @param request - Score request with entity data and signals
 * @returns ScoreResponse with Q, T, L, E, and composite scores
 *
 * @example
 * const scores = await sivaClient.score({
 *   entity_data: { name: 'TechCorp', size: 200, industry: 'Technology' },
 *   signals: [{ type: 'hiring-expansion', confidence: 0.9 }],
 *   score_types: ['composite'],
 *   options: { profile: 'banking_employee', include_explanation: true }
 * });
 */
export async function score(request: ScoreRequest): Promise<ScoreResponse> {
  return sivaRequest<ScoreResponse>('/api/os/score', {
    entity_type: request.entity_type || 'company',
    entity_id: request.entity_id,
    entity_data: request.entity_data,
    signals: request.signals || [],
    score_types: request.score_types || ['composite'],
    options: {
      include_breakdown: request.options?.include_breakdown ?? true,
      include_explanation: request.options?.include_explanation ?? true,
      profile: request.options?.profile || 'banking_employee',
    },
  });
}

/**
 * Rank entities using UPR OS SIVA
 *
 * @param request - Rank request with entities and options
 * @returns RankResponse with ranked entities and explanations
 *
 * @example
 * const ranked = await sivaClient.rank({
 *   entities: [
 *     { id: '1', scores: { q_score: 80, t_score: 70 } },
 *     { id: '2', scores: { q_score: 60, t_score: 90 } }
 *   ],
 *   options: { profile: 'banking_employee', limit: 5, explain: true }
 * });
 */
export async function rank(request: RankRequest): Promise<RankResponse> {
  return sivaRequest<RankResponse>('/api/os/rank', {
    entities: request.entities,
    options: {
      profile: request.options?.profile || 'banking_employee',
      weights: request.options?.weights,
      limit: request.options?.limit || 50,
      explain: request.options?.explain ?? true,
    },
  });
}

/**
 * Evaluate company quality using SIVA Tool 1
 *
 * @param input - Company data for quality evaluation
 * @returns CompanyQualityResponse with score and reasoning
 */
export async function evaluateCompanyQuality(
  input: CompanyQualityInput
): Promise<CompanyQualityResponse> {
  return sivaRequest<CompanyQualityResponse>(
    '/api/agent-core/v1/tools/evaluate_company_quality',
    input as unknown as Record<string, unknown>
  );
}

/**
 * Select contact tier using SIVA Tool 2
 *
 * @param input - Contact title and company context
 * @returns ContactTierResponse with tier classification
 */
export async function selectContactTier(
  input: ContactTierInput
): Promise<ContactTierResponse> {
  return sivaRequest<ContactTierResponse>(
    '/api/agent-core/v1/tools/select_contact_tier',
    input as unknown as Record<string, unknown>
  );
}

/**
 * Calculate timing score using SIVA Tool 3
 *
 * @param input - Signal and calendar context
 * @returns TimingScoreResponse with timing multiplier and category
 */
export async function calculateTimingScore(
  input: TimingScoreInput
): Promise<TimingScoreResponse> {
  return sivaRequest<TimingScoreResponse>(
    '/api/agent-core/v1/tools/calculate_timing_score',
    input as unknown as Record<string, unknown>
  );
}

/**
 * Check edge cases using SIVA Tool 4
 *
 * @param input - Company, contact, and historical data
 * @returns EdgeCasesResponse with decision (BLOCK/WARN/PROCEED)
 */
export async function checkEdgeCases(
  input: EdgeCasesInput
): Promise<EdgeCasesResponse> {
  return sivaRequest<EdgeCasesResponse>(
    '/api/agent-core/v1/tools/check_edge_cases',
    input as unknown as Record<string, unknown>
  );
}

/**
 * Generate composite score using SIVA Tool 8
 *
 * @param input - Combined scores from other tools
 * @returns CompositeScoreResponse with final Q-score and tier
 */
export async function generateCompositeScore(
  input: CompositeScoreInput
): Promise<CompositeScoreResponse> {
  return sivaRequest<CompositeScoreResponse>(
    '/api/agent-core/v1/tools/generate_composite_score',
    input as unknown as Record<string, unknown>
  );
}

/**
 * Check SIVA health status
 *
 * @returns Health status of all SIVA tools
 */
export async function healthCheck(): Promise<{
  status: string;
  tools: Record<string, Record<string, string>>;
  totalTools: number;
  operationalTools: number;
}> {
  const url = `${UPR_OS_URL}/api/agent-core/v1/health`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`SIVA health check failed: ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// HIGH-LEVEL HELPERS
// =============================================================================

/**
 * Score and rank companies in one call
 *
 * This is the primary integration point for SaaS.
 * Takes enriched companies from the enrichment engine
 * and returns SIVA-ranked results with explanations.
 *
 * @param companies - Enriched companies from Apollo/SERP
 * @param options - Profile and ranking options
 * @returns Ranked companies with SIVA scores and explanations
 */
export async function scoreAndRank(
  companies: Array<{
    id: string;
    name: string;
    domain?: string;
    industry?: string;
    size?: number;
    headcount?: number;
    signals?: Signal[];
  }>,
  options?: {
    profile?: SIVAProfile;
    limit?: number;
  }
): Promise<{
  ranked: RankResponse['data']['ranked_entities'];
  totalScored: number;
  profile: string;
}> {
  const profile = options?.profile || 'banking_employee';

  // Score all companies in parallel
  const scorePromises = companies.map((company) =>
    score({
      entity_data: {
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size || company.headcount,
      },
      signals: company.signals || [],
      score_types: ['composite'],
      options: { profile, include_explanation: true },
    }).catch((error) => {
      console.error(`[SIVA] Score failed for ${company.name}:`, error);
      return null;
    })
  );

  const scoreResults = await Promise.all(scorePromises);

  // Filter successful scores and prepare for ranking
  const scoredEntities = scoreResults
    .map((result, index) => {
      if (!result?.success) return null;
      return {
        id: companies[index].id,
        name: companies[index].name,
        scores: {
          q_score: result.data.scores.q_score?.value || 0,
          t_score: result.data.scores.t_score?.value || 0,
          l_score: result.data.scores.l_score?.value || 0,
          e_score: result.data.scores.e_score?.value || 0,
        },
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  if (scoredEntities.length === 0) {
    return {
      ranked: [],
      totalScored: 0,
      profile,
    };
  }

  // Rank the scored entities
  const rankResult = await rank({
    entities: scoredEntities,
    options: {
      profile,
      limit: options?.limit || 10,
      explain: true,
    },
  });

  return {
    ranked: rankResult.data.ranked_entities,
    totalScored: scoredEntities.length,
    profile,
  };
}

// =============================================================================
// EXPORT
// =============================================================================

export const sivaClient = {
  // Core API
  score,
  rank,

  // Individual Tools
  evaluateCompanyQuality,
  selectContactTier,
  calculateTimingScore,
  checkEdgeCases,
  generateCompositeScore,

  // Health
  healthCheck,

  // High-level helpers
  scoreAndRank,
};

export default sivaClient;
