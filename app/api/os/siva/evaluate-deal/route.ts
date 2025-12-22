/**
 * SIVA Deal Evaluation Endpoint (F5)
 *
 * POST /api/os/siva/evaluate-deal
 *
 * PILOT: Deterministic deal evaluation using persona policy from database.
 * NO AI calls - pure rule-based scoring for predictable, testable output.
 *
 * Contract:
 * Request:
 * {
 *   deal_id: string,
 *   vertical: string,
 *   subVertical: string,
 *   region: string,
 *   deal_data: {
 *     arr: number,                              // Annual Recurring Revenue
 *     gross_margin: number,                     // 0.0 - 1.0
 *     customer_count: number,                   // Number of customers
 *     largest_customer_revenue_share: number,   // 0.0 - 1.0
 *     cash_flow_trend: 'positive' | 'negative' | 'neutral'
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   decision: 'APPROVE' | 'NEEDS_REVIEW' | 'REJECT',
 *   score: number,                              // 0.0 - 1.0
 *   reasoning: string,
 *   edge_cases_triggered: string[],
 *   evaluation_details: { ... }
 * }
 *
 * Decision Logic:
 * 1. Calculate weighted score from deal_data
 * 2. Check edge case rules (immediate REJECT/NEEDS_REVIEW)
 * 3. Apply decision thresholds from persona policy
 * 4. Return deterministic result
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db/client';

interface DealData {
  arr: number;
  gross_margin: number;
  customer_count: number;
  largest_customer_revenue_share: number;
  cash_flow_trend: 'positive' | 'negative' | 'neutral';
}

interface EvaluationRequest {
  deal_id: string;
  vertical: string;
  subVertical: string;
  region: string;
  deal_data: DealData;
}

interface PersonaPolicy {
  evidence_scope: {
    decision_thresholds?: {
      approve_min_score: number;
      reject_max_score: number;
      needs_review_range: [number, number];
    };
    edge_case_rules?: Record<string, 'REJECT' | 'NEEDS_REVIEW'>;
    evaluation_weights?: {
      financial_health: number;
      market_position: number;
      deal_terms: number;
      risk_factors: number;
    };
  };
  disclaimer_rules?: {
    always_include?: string;
    risk_warning?: string;
  };
}

type Decision = 'APPROVE' | 'NEEDS_REVIEW' | 'REJECT';

/**
 * Calculate weighted score from deal data
 * Returns 0.0 - 1.0
 */
function calculateScore(dealData: DealData, weights: PersonaPolicy['evidence_scope']['evaluation_weights']): number {
  const w = weights || {
    financial_health: 0.35,
    market_position: 0.20,
    deal_terms: 0.25,
    risk_factors: 0.20,
  };

  // Financial Health Score (based on margin and ARR)
  const marginScore = Math.min(dealData.gross_margin / 0.80, 1.0); // 80% margin = perfect
  const arrScore = Math.min(dealData.arr / 1000000, 1.0); // $1M ARR = perfect
  const financialHealth = (marginScore * 0.6 + arrScore * 0.4);

  // Market Position Score (based on customer count and concentration)
  const customerCountScore = Math.min(dealData.customer_count / 50, 1.0); // 50 customers = perfect
  const concentrationScore = 1.0 - dealData.largest_customer_revenue_share; // Lower concentration = better
  const marketPosition = (customerCountScore * 0.5 + concentrationScore * 0.5);

  // Deal Terms Score (simplified - based on ARR threshold)
  const dealTerms = dealData.arr >= 250000 ? 0.8 : dealData.arr >= 100000 ? 0.5 : 0.3;

  // Risk Factors Score (based on cash flow and concentration)
  let riskFactors = 0.5; // baseline
  if (dealData.cash_flow_trend === 'positive') riskFactors += 0.3;
  if (dealData.cash_flow_trend === 'negative') riskFactors -= 0.3;
  if (dealData.largest_customer_revenue_share < 0.20) riskFactors += 0.2;
  if (dealData.largest_customer_revenue_share > 0.50) riskFactors -= 0.2;
  riskFactors = Math.max(0, Math.min(1, riskFactors));

  // Weighted final score
  const score = (
    financialHealth * w.financial_health +
    marketPosition * w.market_position +
    dealTerms * w.deal_terms +
    riskFactors * w.risk_factors
  );

  return Math.max(0, Math.min(1, score));
}

/**
 * Check edge cases that override score-based decision
 */
function checkEdgeCases(dealData: DealData, rules: Record<string, 'REJECT' | 'NEEDS_REVIEW'>): string[] {
  const triggered: string[] = [];

  // margin_below_20_percent
  if (dealData.gross_margin < 0.20 && rules['margin_below_20_percent']) {
    triggered.push('margin_below_20_percent');
  }

  // customer_concentration_above_40_percent
  if (dealData.largest_customer_revenue_share > 0.40 && rules['customer_concentration_above_40_percent']) {
    triggered.push('customer_concentration_above_40_percent');
  }

  // negative_cash_flow_trend
  if (dealData.cash_flow_trend === 'negative' && rules['negative_cash_flow_trend']) {
    triggered.push('negative_cash_flow_trend');
  }

  // arr_below_100k
  if (dealData.arr < 100000 && rules['arr_below_100k']) {
    triggered.push('arr_below_100k');
  }

  // negative_growth (inferred from low ARR + few customers)
  if (dealData.arr < 50000 && dealData.customer_count < 3 && rules['negative_growth']) {
    triggered.push('negative_growth');
  }

  return triggered;
}

/**
 * Determine decision based on edge cases and score thresholds
 */
function determineDecision(
  score: number,
  edgeCases: string[],
  rules: Record<string, 'REJECT' | 'NEEDS_REVIEW'>,
  thresholds: PersonaPolicy['evidence_scope']['decision_thresholds']
): { decision: Decision; overrideReason: string | null } {
  const t = thresholds || {
    approve_min_score: 0.85,
    reject_max_score: 0.40,
    needs_review_range: [0.40, 0.85],
  };

  // Check edge case overrides first
  for (const edgeCase of edgeCases) {
    const action = rules[edgeCase];
    if (action === 'REJECT') {
      return { decision: 'REJECT', overrideReason: edgeCase };
    }
  }

  // Check for NEEDS_REVIEW edge cases
  for (const edgeCase of edgeCases) {
    const action = rules[edgeCase];
    if (action === 'NEEDS_REVIEW') {
      return { decision: 'NEEDS_REVIEW', overrideReason: edgeCase };
    }
  }

  // Score-based decision
  if (score >= t.approve_min_score) {
    return { decision: 'APPROVE', overrideReason: null };
  } else if (score < t.reject_max_score) {
    return { decision: 'REJECT', overrideReason: null };
  } else {
    return { decision: 'NEEDS_REVIEW', overrideReason: null };
  }
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(
  decision: Decision,
  score: number,
  edgeCases: string[],
  overrideReason: string | null,
  dealData: DealData
): string {
  const parts: string[] = [];

  if (overrideReason) {
    parts.push(`Decision overridden by edge case: ${overrideReason.replace(/_/g, ' ')}.`);
  }

  parts.push(`Calculated score: ${(score * 100).toFixed(1)}%.`);

  // Add specific reasoning based on decision
  if (decision === 'APPROVE') {
    parts.push('Deal meets financial health and risk criteria.');
    if (dealData.gross_margin >= 0.60) parts.push('Strong gross margin.');
    if (dealData.largest_customer_revenue_share < 0.20) parts.push('Healthy customer diversification.');
  } else if (decision === 'REJECT') {
    if (dealData.gross_margin < 0.20) parts.push('Margin below acceptable threshold.');
    if (dealData.cash_flow_trend === 'negative') parts.push('Negative cash flow trend.');
    if (dealData.arr < 100000) parts.push('ARR below minimum threshold.');
  } else {
    parts.push('Deal requires manual review.');
    if (edgeCases.length > 0) {
      parts.push(`Concerns: ${edgeCases.map(e => e.replace(/_/g, ' ')).join(', ')}.`);
    }
  }

  return parts.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluationRequest = await request.json();

    // Validate request
    if (!body.deal_id || !body.vertical || !body.subVertical || !body.region || !body.deal_data) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_REQUEST',
        message: 'deal_id, vertical, subVertical, region, and deal_data are required',
      }, { status: 400 });
    }

    const { deal_id, vertical, subVertical, region, deal_data } = body;

    // Validate deal_data fields
    if (
      typeof deal_data.arr !== 'number' ||
      typeof deal_data.gross_margin !== 'number' ||
      typeof deal_data.customer_count !== 'number' ||
      typeof deal_data.largest_customer_revenue_share !== 'number' ||
      !['positive', 'negative', 'neutral'].includes(deal_data.cash_flow_trend)
    ) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_DEAL_DATA',
        message: 'deal_data must include arr, gross_margin, customer_count, largest_customer_revenue_share, and cash_flow_trend',
      }, { status: 400 });
    }

    // Resolve persona and policy from database
    const personaResult = await queryOne<{
      persona_id: string;
      persona_key: string;
      policy_version: number;
      evidence_scope: PersonaPolicy['evidence_scope'];
      disclaimer_rules: PersonaPolicy['disclaimer_rules'];
    }>(
      `SELECT
         p.id as persona_id,
         p.key as persona_key,
         pol.policy_version,
         pol.evidence_scope,
         pol.disclaimer_rules
       FROM os_personas p
       JOIN os_sub_verticals sv ON p.sub_vertical_id = sv.id
       JOIN os_verticals v ON sv.vertical_id = v.id
       LEFT JOIN os_persona_policies pol ON p.id = pol.persona_id
       WHERE v.key = $1 AND sv.key = $2 AND p.is_active = true
       ORDER BY p.created_at ASC
       LIMIT 1`,
      [vertical, subVertical]
    );

    if (!personaResult) {
      return NextResponse.json({
        success: false,
        error: 'PERSONA_NOT_FOUND',
        message: `No active persona found for ${vertical}/${subVertical}`,
      }, { status: 404 });
    }

    // Extract policy configuration (with defaults)
    const evidenceScope = personaResult.evidence_scope || {};
    const thresholds = evidenceScope.decision_thresholds;
    const edgeCaseRules = evidenceScope.edge_case_rules || {};
    const weights = evidenceScope.evaluation_weights;
    const disclaimers = personaResult.disclaimer_rules || {};

    // Calculate score
    const score = calculateScore(deal_data, weights);

    // Check edge cases
    const edgeCasesTriggered = checkEdgeCases(deal_data, edgeCaseRules);

    // Determine decision
    const { decision, overrideReason } = determineDecision(
      score,
      edgeCasesTriggered,
      edgeCaseRules,
      thresholds
    );

    // Generate reasoning
    const reasoning = generateReasoning(decision, score, edgeCasesTriggered, overrideReason, deal_data);

    // Build response
    return NextResponse.json({
      success: true,
      decision,
      score: Math.round(score * 1000) / 1000, // 3 decimal places
      reasoning,
      edge_cases_triggered: edgeCasesTriggered,

      evaluation_details: {
        deal_id,
        persona_key: personaResult.persona_key,
        policy_version: personaResult.policy_version,
        thresholds_used: thresholds || 'defaults',
        weights_used: weights || 'defaults',
        override_reason: overrideReason,
        input: {
          arr: deal_data.arr,
          gross_margin: deal_data.gross_margin,
          customer_count: deal_data.customer_count,
          largest_customer_revenue_share: deal_data.largest_customer_revenue_share,
          cash_flow_trend: deal_data.cash_flow_trend,
        },
      },

      disclaimers: {
        general: disclaimers.always_include || 'This is an AI-assisted evaluation. Final decisions require human review.',
        risk: disclaimers.risk_warning || null,
      },

      metadata: {
        vertical,
        subVertical,
        region,
        evaluated_at: new Date().toISOString(),
        deterministic: true, // Flag that this is rule-based, not AI
      },
    });

  } catch (error) {
    console.error('[SIVA evaluate-deal] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to evaluate deal',
    }, { status: 500 });
  }
}
