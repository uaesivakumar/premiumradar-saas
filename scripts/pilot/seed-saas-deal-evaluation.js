/**
 * PILOT: Seed saas_deal_evaluation vertical
 *
 * Creates:
 * - Vertical: saas_deal_evaluation (entity_type: deal)
 * - Sub-Vertical: cfo_deal_review
 * - Persona: skeptical_cfo with full policy
 *
 * Usage: node scripts/pilot/seed-saas-deal-evaluation.js
 *
 * Requires: DATABASE_URL environment variable
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedPilotVertical() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('=== PILOT SEED: saas_deal_evaluation ===\n');

    // 1. Create Vertical
    console.log('1. Creating vertical: saas_deal_evaluation');
    const verticalResult = await client.query(`
      INSERT INTO os_verticals (key, name, entity_type, region_scope, is_active)
      VALUES ('saas_deal_evaluation', 'SaaS Deal Evaluation', 'deal', '["US", "GLOBAL"]'::jsonb, true)
      ON CONFLICT (key) DO UPDATE SET
        name = EXCLUDED.name,
        entity_type = EXCLUDED.entity_type,
        region_scope = EXCLUDED.region_scope,
        updated_at = NOW()
      RETURNING id, key, entity_type
    `);
    const vertical = verticalResult.rows[0];
    console.log(`   Created: ${vertical.key} (id: ${vertical.id}, entity_type: ${vertical.entity_type})`);

    // 2. Create Sub-Vertical
    console.log('\n2. Creating sub-vertical: cfo_deal_review');
    const subVerticalResult = await client.query(`
      INSERT INTO os_sub_verticals (vertical_id, key, name, default_agent, is_active)
      VALUES ($1, 'cfo_deal_review', 'CFO Deal Review', 'siva_deal_evaluator', true)
      ON CONFLICT (vertical_id, key) DO UPDATE SET
        name = EXCLUDED.name,
        default_agent = EXCLUDED.default_agent,
        updated_at = NOW()
      RETURNING id, key, default_agent
    `, [vertical.id]);
    const subVertical = subVerticalResult.rows[0];
    console.log(`   Created: ${subVertical.key} (id: ${subVertical.id}, agent: ${subVertical.default_agent})`);

    // 3. Create Persona
    console.log('\n3. Creating persona: skeptical_cfo');
    const personaResult = await client.query(`
      INSERT INTO os_personas (sub_vertical_id, key, name, mission, decision_lens, is_active)
      VALUES ($1, 'skeptical_cfo', 'Skeptical CFO',
              'Evaluate SaaS deals with conservative financial lens. Protect capital. Prioritize margin and cash flow.',
              'Risk-averse, margin-focused, cash-flow conscious. Default to caution.',
              true)
      ON CONFLICT (sub_vertical_id, key) DO UPDATE SET
        name = EXCLUDED.name,
        mission = EXCLUDED.mission,
        decision_lens = EXCLUDED.decision_lens,
        updated_at = NOW()
      RETURNING id, key, name
    `, [subVertical.id]);
    const persona = personaResult.rows[0];
    console.log(`   Created: ${persona.key} (id: ${persona.id})`);

    // 4. Create/Update Persona Policy with decision thresholds
    console.log('\n4. Creating persona policy with decision thresholds');

    // The skeptical_cfo policy for deal evaluation
    const skepticalCfoPolicy = {
      // Standard policy fields
      allowed_intents: ['evaluate_deal', 'score_deal', 'recommend_action'],
      forbidden_outputs: ['guarantee_outcome', 'promise_returns', 'investment_advice'],
      allowed_tools: ['deal_scorer', 'financial_analyzer', 'risk_assessor'],

      // Custom decision thresholds for deal evaluation
      evidence_scope: {
        decision_thresholds: {
          approve_min_score: 0.85,
          reject_max_score: 0.40,
          needs_review_range: [0.40, 0.85]
        },
        edge_case_rules: {
          margin_below_20_percent: 'REJECT',
          customer_concentration_above_40_percent: 'NEEDS_REVIEW',
          negative_cash_flow_trend: 'REJECT',
          no_financial_data: 'NEEDS_REVIEW',
          arr_below_100k: 'NEEDS_REVIEW',
          negative_growth: 'REJECT'
        },
        evaluation_weights: {
          financial_health: 0.35,
          market_position: 0.20,
          deal_terms: 0.25,
          risk_factors: 0.20
        }
      },

      memory_scope: {
        retain_decisions: true,
        decision_ttl_days: 90
      },

      cost_budget: {
        max_tokens_per_call: 4000,
        model_tier: 'standard'
      },

      latency_budget: {
        max_response_ms: 5000,
        timeout_action: 'NEEDS_REVIEW'
      },

      escalation_rules: {
        escalate_on: ['no_financial_data', 'conflicting_signals'],
        escalation_message: 'Deal requires manual CFO review - insufficient data or conflicting signals'
      },

      disclaimer_rules: {
        always_include: 'This is an AI-assisted evaluation. Final investment decisions require human review.',
        risk_warning: 'Past performance does not guarantee future results.'
      }
    };

    // Check if policy exists
    const existingPolicy = await client.query(
      'SELECT id FROM os_persona_policies WHERE persona_id = $1',
      [persona.id]
    );

    if (existingPolicy.rows.length === 0) {
      // Insert new policy
      await client.query(`
        INSERT INTO os_persona_policies (
          persona_id, policy_version,
          allowed_intents, forbidden_outputs, allowed_tools,
          evidence_scope, memory_scope, cost_budget, latency_budget,
          escalation_rules, disclaimer_rules
        )
        VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        persona.id,
        JSON.stringify(skepticalCfoPolicy.allowed_intents),
        JSON.stringify(skepticalCfoPolicy.forbidden_outputs),
        JSON.stringify(skepticalCfoPolicy.allowed_tools),
        JSON.stringify(skepticalCfoPolicy.evidence_scope),
        JSON.stringify(skepticalCfoPolicy.memory_scope),
        JSON.stringify(skepticalCfoPolicy.cost_budget),
        JSON.stringify(skepticalCfoPolicy.latency_budget),
        JSON.stringify(skepticalCfoPolicy.escalation_rules),
        JSON.stringify(skepticalCfoPolicy.disclaimer_rules),
      ]);
      console.log('   Created new policy');
    } else {
      // Update existing policy
      await client.query(`
        UPDATE os_persona_policies SET
          allowed_intents = $2,
          forbidden_outputs = $3,
          allowed_tools = $4,
          evidence_scope = $5,
          memory_scope = $6,
          cost_budget = $7,
          latency_budget = $8,
          escalation_rules = $9,
          disclaimer_rules = $10,
          updated_at = NOW()
        WHERE persona_id = $1
      `, [
        persona.id,
        JSON.stringify(skepticalCfoPolicy.allowed_intents),
        JSON.stringify(skepticalCfoPolicy.forbidden_outputs),
        JSON.stringify(skepticalCfoPolicy.allowed_tools),
        JSON.stringify(skepticalCfoPolicy.evidence_scope),
        JSON.stringify(skepticalCfoPolicy.memory_scope),
        JSON.stringify(skepticalCfoPolicy.cost_budget),
        JSON.stringify(skepticalCfoPolicy.latency_budget),
        JSON.stringify(skepticalCfoPolicy.escalation_rules),
        JSON.stringify(skepticalCfoPolicy.disclaimer_rules),
      ]);
      console.log('   Updated existing policy');
    }

    // 5. Log to control plane audit
    console.log('\n5. Logging to control plane audit');
    await client.query(`
      INSERT INTO os_controlplane_audit (
        actor_user, action, target_type, target_id, request_json, success
      )
      VALUES ('pilot-seed-script', 'seed_pilot_vertical', 'vertical', $1, $2, true)
    `, [
      vertical.id,
      JSON.stringify({
        vertical: vertical.key,
        sub_vertical: subVertical.key,
        persona: persona.key,
        entity_type: 'deal',
        region: 'US'
      })
    ]);
    console.log('   Audit logged');

    await client.query('COMMIT');

    console.log('\n=== PILOT SEED COMPLETE ===');
    console.log(`
Summary:
  Vertical:     ${vertical.key} (${vertical.id})
  Sub-Vertical: ${subVertical.key} (${subVertical.id})
  Persona:      ${persona.key} (${persona.id})
  Entity Type:  deal
  Region:       US

Decision Thresholds:
  APPROVE:      score >= 0.85
  NEEDS_REVIEW: 0.40 <= score < 0.85
  REJECT:       score < 0.40

Edge Cases:
  - margin_below_20_percent -> REJECT
  - customer_concentration_above_40_percent -> NEEDS_REVIEW
  - negative_cash_flow_trend -> REJECT
  - no_financial_data -> NEEDS_REVIEW
`);

    return { vertical, subVertical, persona };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('SEED FAILED:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
seedPilotVertical()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
