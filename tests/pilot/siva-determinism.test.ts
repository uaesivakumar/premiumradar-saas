/**
 * PILOT: SIVA Deal Evaluation Determinism Tests (F6)
 *
 * Tests that validate:
 * 1. Same input produces identical output across multiple calls
 * 2. Edge case rules are applied consistently
 * 3. No banking-specific logic is referenced
 *
 * Contract:
 * - 10 consecutive calls with same input must return identical results
 * - Edge cases must trigger same decisions
 * - No hardcoded banking references
 */

import { describe, test, expect, beforeAll } from 'vitest';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

interface DealData {
  arr: number;
  gross_margin: number;
  customer_count: number;
  largest_customer_revenue_share: number;
  cash_flow_trend: 'positive' | 'negative' | 'neutral';
}

interface EvaluationResponse {
  success: boolean;
  decision: 'APPROVE' | 'NEEDS_REVIEW' | 'REJECT';
  score: number;
  reasoning: string;
  edge_cases_triggered: string[];
  evaluation_details: {
    persona_key: string;
    policy_version: number;
    override_reason: string | null;
  };
  metadata: {
    deterministic: boolean;
  };
}

async function evaluateDeal(dealData: DealData, dealId = 'test-001'): Promise<EvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/os/siva/evaluate-deal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deal_id: dealId,
      vertical: 'saas_deal_evaluation',
      subVertical: 'cfo_deal_review',
      region: 'US',
      deal_data: dealData,
    }),
  });
  return response.json();
}

describe('SIVA Deal Evaluation Determinism', () => {
  // Skip if database not available (CI without DB)
  const skipIfNoDb = process.env.SKIP_DB_TESTS === 'true' ? test.skip : test;

  describe('Deterministic Output', () => {
    skipIfNoDb('should produce identical output for 10 consecutive calls with same input', async () => {
      const testDeal: DealData = {
        arr: 500000,
        gross_margin: 0.75,
        customer_count: 25,
        largest_customer_revenue_share: 0.15,
        cash_flow_trend: 'positive',
      };

      const results: EvaluationResponse[] = [];

      // Make 10 consecutive calls
      for (let i = 0; i < 10; i++) {
        const result = await evaluateDeal(testDeal, `determinism-test-${i}`);
        results.push(result);
      }

      // Verify all results are identical
      const firstResult = results[0];
      expect(firstResult.success).toBe(true);
      expect(firstResult.metadata?.deterministic).toBe(true);

      for (let i = 1; i < results.length; i++) {
        expect(results[i].decision).toBe(firstResult.decision);
        expect(results[i].score).toBe(firstResult.score);
        expect(results[i].edge_cases_triggered).toEqual(firstResult.edge_cases_triggered);
      }
    });
  });

  describe('Edge Case Rule Consistency', () => {
    skipIfNoDb('should apply margin_below_20_percent edge case', async () => {
      const lowMarginDeal: DealData = {
        arr: 500000,
        gross_margin: 0.15, // Below 20%
        customer_count: 25,
        largest_customer_revenue_share: 0.10,
        cash_flow_trend: 'positive',
      };

      const result = await evaluateDeal(lowMarginDeal, 'edge-case-margin');

      expect(result.success).toBe(true);
      expect(result.edge_cases_triggered).toContain('margin_below_20_percent');
      expect(result.decision).toBe('REJECT'); // Edge case overrides
    });

    skipIfNoDb('should apply customer_concentration_above_40_percent edge case', async () => {
      const concentratedDeal: DealData = {
        arr: 500000,
        gross_margin: 0.75,
        customer_count: 10,
        largest_customer_revenue_share: 0.50, // Above 40%
        cash_flow_trend: 'positive',
      };

      const result = await evaluateDeal(concentratedDeal, 'edge-case-concentration');

      expect(result.success).toBe(true);
      expect(result.edge_cases_triggered).toContain('customer_concentration_above_40_percent');
      expect(result.decision).toBe('NEEDS_REVIEW'); // Edge case triggers review
    });

    skipIfNoDb('should apply negative_cash_flow_trend edge case', async () => {
      const negativeCashFlowDeal: DealData = {
        arr: 500000,
        gross_margin: 0.75,
        customer_count: 25,
        largest_customer_revenue_share: 0.15,
        cash_flow_trend: 'negative', // Negative trend
      };

      const result = await evaluateDeal(negativeCashFlowDeal, 'edge-case-cashflow');

      expect(result.success).toBe(true);
      expect(result.edge_cases_triggered).toContain('negative_cash_flow_trend');
      expect(result.decision).toBe('REJECT'); // Edge case overrides
    });
  });

  describe('Decision Threshold Consistency', () => {
    skipIfNoDb('should return APPROVE for high-margin healthy deal', async () => {
      const healthyDeal: DealData = {
        arr: 1000000,
        gross_margin: 0.85,
        customer_count: 50,
        largest_customer_revenue_share: 0.10,
        cash_flow_trend: 'positive',
      };

      const result = await evaluateDeal(healthyDeal, 'threshold-approve');

      expect(result.success).toBe(true);
      expect(result.decision).toBe('APPROVE');
      expect(result.score).toBeGreaterThanOrEqual(0.85);
      expect(result.edge_cases_triggered).toHaveLength(0);
    });

    skipIfNoDb('should return REJECT for low-score deal', async () => {
      const poorDeal: DealData = {
        arr: 50000,
        gross_margin: 0.25,
        customer_count: 3,
        largest_customer_revenue_share: 0.40,
        cash_flow_trend: 'neutral',
      };

      const result = await evaluateDeal(poorDeal, 'threshold-reject');

      expect(result.success).toBe(true);
      expect(result.decision).toBe('REJECT');
      expect(result.score).toBeLessThan(0.40);
    });

    skipIfNoDb('should return NEEDS_REVIEW for mid-range deal', async () => {
      const midRangeDeal: DealData = {
        arr: 300000,
        gross_margin: 0.50,
        customer_count: 15,
        largest_customer_revenue_share: 0.25,
        cash_flow_trend: 'neutral',
      };

      const result = await evaluateDeal(midRangeDeal, 'threshold-review');

      expect(result.success).toBe(true);
      expect(result.decision).toBe('NEEDS_REVIEW');
      expect(result.score).toBeGreaterThanOrEqual(0.40);
      expect(result.score).toBeLessThan(0.85);
    });
  });

  describe('No Banking-Specific Logic', () => {
    skipIfNoDb('should not reference banking-specific logic', async () => {
      const testDeal: DealData = {
        arr: 500000,
        gross_margin: 0.75,
        customer_count: 25,
        largest_customer_revenue_share: 0.15,
        cash_flow_trend: 'positive',
      };

      const result = await evaluateDeal(testDeal, 'no-banking-test');

      expect(result.success).toBe(true);

      // Verify response doesn't contain banking-specific terms
      const responseText = JSON.stringify(result).toLowerCase();
      expect(responseText).not.toContain('employee banking');
      expect(responseText).not.toContain('payroll');
      expect(responseText).not.toContain('salary account');
      expect(responseText).not.toContain('wps'); // UAE payroll system
      expect(responseText).not.toContain('headcount');

      // Verify persona is skeptical_cfo, not banking persona
      expect(result.evaluation_details.persona_key).toBe('skeptical_cfo');
    });

    skipIfNoDb('should use entity_type: deal not company', async () => {
      // This test verifies the vertical is configured correctly
      const response = await fetch(`${API_BASE_URL}/api/os/resolve-vertical?vertical=saas_deal_evaluation&subVertical=cfo_deal_review&region=US`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.entity_type).toBe('deal');
      expect(data.entity_type).not.toBe('company');
    });
  });

  describe('Persona Policy Application', () => {
    skipIfNoDb('should use skeptical_cfo persona with correct thresholds', async () => {
      const response = await fetch(`${API_BASE_URL}/api/os/resolve-vertical?vertical=saas_deal_evaluation&subVertical=cfo_deal_review&region=US`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.persona_key).toBe('skeptical_cfo');
      expect(data.policy).toBeDefined();

      // Verify decision thresholds
      const thresholds = data.policy?.evidence_scope?.decision_thresholds;
      expect(thresholds).toBeDefined();
      expect(thresholds?.approve_min_score).toBe(0.85);
      expect(thresholds?.reject_max_score).toBe(0.40);
    });
  });
});

describe('Vertical Resolution', () => {
  const skipIfNoDb = process.env.SKIP_DB_TESTS === 'true' ? test.skip : test;

  skipIfNoDb('should resolve saas_deal_evaluation to correct persona', async () => {
    const response = await fetch(`${API_BASE_URL}/api/os/resolve-vertical?vertical=saas_deal_evaluation&subVertical=cfo_deal_review&region=US`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.vertical_key).toBe('saas_deal_evaluation');
    expect(data.sub_vertical_key).toBe('cfo_deal_review');
    expect(data.persona_key).toBe('skeptical_cfo');
    expect(data.persona_id).toBeDefined();
  });

  skipIfNoDb('should return VERTICAL_NOT_CONFIGURED for unknown vertical', async () => {
    const response = await fetch(`${API_BASE_URL}/api/os/resolve-vertical?vertical=unknown_vertical&subVertical=test&region=US`);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBe('VERTICAL_NOT_CONFIGURED');
  });
});
