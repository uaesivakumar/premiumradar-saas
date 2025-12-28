/**
 * S312-S314: Enterprise-Aware SIVA Client
 * Part of User & Enterprise Management Program v1.1
 * Phase E - AI & BTE Integration
 *
 * Wraps the SIVA client with enterprise context.
 * Ensures all SIVA operations are properly scoped and tracked.
 */

import { sivaClient } from '@/lib/integrations/siva-client';
import {
  EnterpriseAIContext,
  getEnterpriseAIContext,
  requireEnterpriseAIContext,
  getSIVAContext,
  canPerformAIOperation,
  storeEnterpriseEvidencePack,
} from './enterprise-context';

import type {
  ScoreRequest,
  ScoreResponse,
  RankRequest,
  RankResponse,
  Signal,
  ProactiveInsightsResponse,
  DashboardInsightsResponse,
} from '@/lib/integrations/siva-client';

// =============================================================================
// TYPES
// =============================================================================

export interface EnterpriseScoreRequest extends ScoreRequest {
  // Context is automatically added
}

export interface EnterpriseRankRequest extends RankRequest {
  // Context is automatically added
}

export interface EnterpriseScoreResult {
  success: boolean;
  data: ScoreResponse['data'] | null;
  context: {
    enterprise_id: string;
    workspace_id: string | null;
    vertical: string;
    sub_vertical: string;
    region: string;
  };
  evidence_pack_id?: string;
  error?: string;
}

export interface EnterpriseRankResult {
  success: boolean;
  data: RankResponse['data'] | null;
  context: {
    enterprise_id: string;
    workspace_id: string | null;
  };
  evidence_pack_id?: string;
  error?: string;
}

// =============================================================================
// ENTERPRISE SCORE (S313)
// =============================================================================

/**
 * Score entities with enterprise context
 * Automatically adds vertical/sub-vertical context from enterprise config
 */
export async function enterpriseScore(
  request: EnterpriseScoreRequest,
  options: {
    store_evidence?: boolean;
  } = {}
): Promise<EnterpriseScoreResult> {
  try {
    // Get enterprise context
    const aiContext = await requireEnterpriseAIContext({
      require_vertical: false,
    });

    // Check if operation is allowed
    const opCheck = canPerformAIOperation(aiContext, 'ranking');
    if (!opCheck.allowed) {
      return {
        success: false,
        data: null,
        context: getSIVAContext(aiContext),
        error: opCheck.reason,
      };
    }

    // Add enterprise context to request
    const sivaContext = getSIVAContext(aiContext);
    const enhancedRequest: ScoreRequest = {
      ...request,
      options: {
        ...request.options,
        profile: mapVerticalToProfile(sivaContext.sub_vertical),
        include_breakdown: true,
        include_explanation: true,
      },
    };

    // Call SIVA
    const response = await sivaClient.score(enhancedRequest);

    let evidencePackId: string | undefined;

    // Store evidence if requested
    if (options.store_evidence && response.success) {
      try {
        const pack = await storeEnterpriseEvidencePack(
          aiContext,
          'RANKING',
          { request: enhancedRequest },
          { response }
        );
        evidencePackId = pack.id;
      } catch (err) {
        console.error('[Enterprise SIVA] Failed to store evidence:', err);
      }
    }

    return {
      success: response.success,
      data: response.data,
      context: sivaContext,
      evidence_pack_id: evidencePackId,
    };
  } catch (error) {
    console.error('[Enterprise SIVA] Score error:', error);
    return {
      success: false,
      data: null,
      context: {
        enterprise_id: '',
        workspace_id: null,
        vertical: 'banking',
        sub_vertical: 'employee_banking',
        region: 'UAE',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// ENTERPRISE RANK (S314)
// =============================================================================

/**
 * Rank entities with enterprise context
 * Results are scoped to the enterprise/workspace
 */
export async function enterpriseRank(
  request: EnterpriseRankRequest,
  options: {
    store_evidence?: boolean;
  } = {}
): Promise<EnterpriseRankResult> {
  try {
    // Get enterprise context
    const aiContext = await requireEnterpriseAIContext();

    // Check if operation is allowed
    const opCheck = canPerformAIOperation(aiContext, 'ranking');
    if (!opCheck.allowed) {
      return {
        success: false,
        data: null,
        context: {
          enterprise_id: aiContext.enterprise_id,
          workspace_id: aiContext.workspace_id,
        },
        error: opCheck.reason,
      };
    }

    const sivaContext = getSIVAContext(aiContext);

    // Add enterprise context to request
    const enhancedRequest: RankRequest = {
      ...request,
      options: {
        ...request.options,
        profile: mapVerticalToProfile(sivaContext.sub_vertical),
        explain: true,
      },
    };

    // Call SIVA
    const response = await sivaClient.rank(enhancedRequest);

    let evidencePackId: string | undefined;

    // Store evidence if requested
    if (options.store_evidence && response.success) {
      try {
        const pack = await storeEnterpriseEvidencePack(
          aiContext,
          'RANKING',
          { request: enhancedRequest },
          { response }
        );
        evidencePackId = pack.id;
      } catch (err) {
        console.error('[Enterprise SIVA] Failed to store evidence:', err);
      }
    }

    return {
      success: response.success,
      data: response.data,
      context: {
        enterprise_id: aiContext.enterprise_id,
        workspace_id: aiContext.workspace_id,
      },
      evidence_pack_id: evidencePackId,
    };
  } catch (error) {
    console.error('[Enterprise SIVA] Rank error:', error);
    return {
      success: false,
      data: null,
      context: {
        enterprise_id: '',
        workspace_id: null,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// ENTERPRISE SCORE AND RANK (Combined)
// =============================================================================

/**
 * Score and rank companies with enterprise context
 * This is the primary integration point for enterprise users
 */
export async function enterpriseScoreAndRank(
  companies: Array<{
    id: string;
    name: string;
    domain?: string;
    industry?: string;
    size?: number;
    headcount?: number;
    signals?: Signal[];
  }>,
  options: {
    limit?: number;
    store_evidence?: boolean;
  } = {}
): Promise<{
  success: boolean;
  ranked: RankResponse['data']['ranked_entities'];
  totalScored: number;
  context: {
    enterprise_id: string;
    workspace_id: string | null;
    vertical: string;
    sub_vertical: string;
    region: string;
  };
  evidence_pack_id?: string;
  error?: string;
}> {
  try {
    // Get enterprise context
    const aiContext = await requireEnterpriseAIContext();

    // Check if operation is allowed
    const opCheck = canPerformAIOperation(aiContext, 'ranking');
    if (!opCheck.allowed) {
      return {
        success: false,
        ranked: [],
        totalScored: 0,
        context: getSIVAContext(aiContext),
        error: opCheck.reason,
      };
    }

    const sivaContext = getSIVAContext(aiContext);
    const profile = mapVerticalToProfile(sivaContext.sub_vertical);

    // Call the underlying scoreAndRank
    const result = await sivaClient.scoreAndRank(companies, {
      profile,
      limit: options.limit || 10,
    });

    let evidencePackId: string | undefined;

    // Store evidence if requested
    if (options.store_evidence && result.ranked.length > 0) {
      try {
        const pack = await storeEnterpriseEvidencePack(
          aiContext,
          'RANKING',
          {
            companies: companies.map((c) => ({ id: c.id, name: c.name })),
            limit: options.limit,
          },
          { result }
        );
        evidencePackId = pack.id;
      } catch (err) {
        console.error('[Enterprise SIVA] Failed to store evidence:', err);
      }
    }

    return {
      success: true,
      ranked: result.ranked,
      totalScored: result.totalScored,
      context: sivaContext,
      evidence_pack_id: evidencePackId,
    };
  } catch (error) {
    console.error('[Enterprise SIVA] ScoreAndRank error:', error);
    return {
      success: false,
      ranked: [],
      totalScored: 0,
      context: {
        enterprise_id: '',
        workspace_id: null,
        vertical: 'banking',
        sub_vertical: 'employee_banking',
        region: 'UAE',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// ENTERPRISE INSIGHTS
// =============================================================================

/**
 * Get proactive insights with enterprise context
 */
export async function enterpriseGetInsights(params: {
  companyId?: string;
  companyName?: string;
  domain?: string;
}): Promise<{
  success: boolean;
  data: ProactiveInsightsResponse | null;
  context: {
    enterprise_id: string;
  };
  error?: string;
}> {
  try {
    const aiContext = await getEnterpriseAIContext();

    if (!aiContext) {
      return {
        success: false,
        data: null,
        context: { enterprise_id: '' },
        error: 'No enterprise context',
      };
    }

    const response = await sivaClient.getProactiveInsights({
      ...params,
      tenantId: aiContext.enterprise_id,
    });

    return {
      success: response.success,
      data: response,
      context: { enterprise_id: aiContext.enterprise_id },
    };
  } catch (error) {
    console.error('[Enterprise SIVA] Insights error:', error);
    return {
      success: false,
      data: null,
      context: { enterprise_id: '' },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get dashboard insights with enterprise context
 */
export async function enterpriseGetDashboardInsights(
  limit: number = 5
): Promise<{
  success: boolean;
  data: DashboardInsightsResponse | null;
  context: {
    enterprise_id: string;
  };
  error?: string;
}> {
  try {
    const aiContext = await getEnterpriseAIContext();

    if (!aiContext) {
      return {
        success: false,
        data: null,
        context: { enterprise_id: '' },
        error: 'No enterprise context',
      };
    }

    const response = await sivaClient.getDashboardInsights(
      aiContext.enterprise_id,
      limit
    );

    return {
      success: response.success,
      data: response,
      context: { enterprise_id: aiContext.enterprise_id },
    };
  } catch (error) {
    console.error('[Enterprise SIVA] Dashboard insights error:', error);
    return {
      success: false,
      data: null,
      context: { enterprise_id: '' },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Map sub-vertical slug to SIVA profile
 */
function mapVerticalToProfile(subVertical: string): import('@/lib/integrations/siva-client').SIVAProfile {
  const mapping: Record<string, import('@/lib/integrations/siva-client').SIVAProfile> = {
    employee_banking: 'banking_employee',
    corporate_banking: 'banking_corporate',
    sme_banking: 'banking_employee', // Use employee banking for SME
    individual_insurance: 'insurance_individual',
    corporate_insurance: 'insurance_individual',
    tech_recruitment: 'recruitment_hiring',
    executive_recruitment: 'recruitment_hiring',
    b2b_saas: 'saas_b2b',
  };

  return mapping[subVertical] || 'default';
}

// =============================================================================
// EXPORT
// =============================================================================

export const enterpriseSiva = {
  score: enterpriseScore,
  rank: enterpriseRank,
  scoreAndRank: enterpriseScoreAndRank,
  getInsights: enterpriseGetInsights,
  getDashboardInsights: enterpriseGetDashboardInsights,
};

export default enterpriseSiva;
