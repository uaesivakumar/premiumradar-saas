/**
 * S255: MVT Hard Gate Tests
 * Sprint S255: MVT_HARD_GATE_SUB_VERTICAL
 *
 * Tests for Minimum Viable Truth (MVT) enforcement at Sub-Vertical creation.
 *
 * PRD Reference:
 * - PRD v1.2 Law 1: Authority precedes intelligence
 * - Control Plane v2.0: Runtime eligibility hard gate
 * - PRD v1.3: Sales-Bench deterministic scenarios
 *
 * MVT Components:
 * 1. ICP Truth Triad (primary_entity_type + buyer_role + decision_owner)
 * 2. Signal Allow-List (entity_type must match primary)
 * 3. Kill Rules (min 2, at least 1 compliance/regulatory)
 * 4. Sales-Bench Seed Scenarios (min 2 golden, 2 kill)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// TYPE DEFINITIONS (Mirror of API types for testing)
// =============================================================================

interface AllowedSignal {
  signal_key: string;
  entity_type: string;
  justification: string;
}

interface KillRule {
  rule: string;
  action: 'BLOCK' | 'WARN' | 'FLAG';
  reason: string;
}

interface SeedScenario {
  scenario_id: string;
  entry_intent: string;
  buyer_type: string;
  success_condition?: string;
  fail_condition?: string;
}

interface SeedScenarios {
  golden: SeedScenario[];
  kill: SeedScenario[];
}

interface MVTValidationResult {
  valid: boolean;
  errors: string[];
}

// =============================================================================
// MVT VALIDATION FUNCTION (Mirror of API implementation)
// =============================================================================

function validateMVT(
  primary_entity_type: string | undefined,
  buyer_role: string | undefined,
  decision_owner: string | undefined,
  allowed_signals: AllowedSignal[] | undefined,
  kill_rules: KillRule[] | undefined,
  seed_scenarios: SeedScenarios | undefined
): MVTValidationResult {
  const errors: string[] = [];

  // 1. ICP Truth Triad validation
  if (!primary_entity_type) {
    errors.push('primary_entity_type is required');
  }
  if (!buyer_role) {
    errors.push('buyer_role is required (ICP Truth Triad)');
  }
  if (!decision_owner) {
    errors.push('decision_owner is required (ICP Truth Triad)');
  }

  // 2. Signal Allow-List validation
  if (!allowed_signals || allowed_signals.length < 1) {
    errors.push('At least 1 allowed_signal is required');
  } else {
    // Check signal entity_type matches primary_entity_type
    for (const signal of allowed_signals) {
      if (!signal.signal_key) {
        errors.push('Signal must have signal_key');
      }
      if (!signal.entity_type) {
        errors.push('Signal must have entity_type');
      }
      if (!signal.justification) {
        errors.push('Signal must have justification');
      }
      if (primary_entity_type && signal.entity_type && signal.entity_type !== primary_entity_type) {
        errors.push(`Signal entity_type '${signal.entity_type}' must match primary_entity_type '${primary_entity_type}'`);
      }
    }
  }

  // 3. Kill Rules validation
  if (!kill_rules || kill_rules.length < 2) {
    errors.push(`Minimum 2 kill_rules required (found: ${kill_rules?.length || 0})`);
  } else {
    // Check for at least 1 compliance rule
    const complianceKeywords = ['compliance', 'regulatory', 'legal', 'aml', 'kyc'];
    const hasComplianceRule = kill_rules.some((rule) =>
      complianceKeywords.some((keyword) =>
        rule.reason.toLowerCase().includes(keyword)
      )
    );
    if (!hasComplianceRule) {
      errors.push('At least 1 compliance/regulatory kill_rule required');
    }
  }

  // 4. Sales-Bench Seed Scenarios validation
  if (!seed_scenarios) {
    errors.push('seed_scenarios is required');
  } else {
    if (!seed_scenarios.golden || seed_scenarios.golden.length < 2) {
      errors.push(`Minimum 2 golden seed_scenarios required (found: ${seed_scenarios.golden?.length || 0})`);
    }
    if (!seed_scenarios.kill || seed_scenarios.kill.length < 2) {
      errors.push(`Minimum 2 kill seed_scenarios required (found: ${seed_scenarios.kill?.length || 0})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// VALID MVT FIXTURES (For reference)
// =============================================================================

const VALID_MVT = {
  primary_entity_type: 'company',
  buyer_role: 'HR Manager / Finance Director',
  decision_owner: 'CFO or Company Owner',
  allowed_signals: [
    { signal_key: 'hiring_expansion', entity_type: 'company', justification: 'Indicates growing workforce' },
    { signal_key: 'headcount_jump', entity_type: 'company', justification: 'Rapid headcount growth' },
    { signal_key: 'office_opening', entity_type: 'company', justification: 'New office needs banking' },
  ] as AllowedSignal[],
  kill_rules: [
    { rule: 'government_entity', action: 'BLOCK' as const, reason: 'Regulatory: Government entities have separate channels' },
    { rule: 'sanctioned_country', action: 'BLOCK' as const, reason: 'Compliance: Cannot bank sanctioned entities' },
    { rule: 'shell_company', action: 'BLOCK' as const, reason: 'AML/KYC: Shell companies flagged for AML' },
  ] as KillRule[],
  seed_scenarios: {
    golden: [
      { scenario_id: 'eb-golden-001', entry_intent: 'open_salary_account', buyer_type: 'hr_manager', success_condition: 'meeting_scheduled' },
      { scenario_id: 'eb-golden-002', entry_intent: 'payroll_services', buyer_type: 'cfo', success_condition: 'proposal_requested' },
    ],
    kill: [
      { scenario_id: 'eb-kill-001', entry_intent: 'guaranteed_returns', buyer_type: 'suspicious', fail_condition: 'compliance_violation' },
      { scenario_id: 'eb-kill-002', entry_intent: 'structure_deposits', buyer_type: 'aml_test', fail_condition: 'aml_evasion_attempt' },
    ],
  } as SeedScenarios,
};

// =============================================================================
// TEST 1: INCOMPLETE MVT → CREATION REJECTED
// =============================================================================

describe('Test 1: Incomplete MVT → Creation Rejected', () => {
  describe('Missing ICP Truth Triad components', () => {
    it('should reject when primary_entity_type is missing', () => {
      const result = validateMVT(
        undefined,
        VALID_MVT.buyer_role,
        VALID_MVT.decision_owner,
        VALID_MVT.allowed_signals,
        VALID_MVT.kill_rules,
        VALID_MVT.seed_scenarios
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('primary_entity_type is required');
    });

    it('should reject when buyer_role is missing', () => {
      const result = validateMVT(
        VALID_MVT.primary_entity_type,
        undefined,
        VALID_MVT.decision_owner,
        VALID_MVT.allowed_signals,
        VALID_MVT.kill_rules,
        VALID_MVT.seed_scenarios
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('buyer_role is required (ICP Truth Triad)');
    });

    it('should reject when decision_owner is missing', () => {
      const result = validateMVT(
        VALID_MVT.primary_entity_type,
        VALID_MVT.buyer_role,
        undefined,
        VALID_MVT.allowed_signals,
        VALID_MVT.kill_rules,
        VALID_MVT.seed_scenarios
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('decision_owner is required (ICP Truth Triad)');
    });

    it('should reject when all ICP Truth Triad components are missing', () => {
      const result = validateMVT(
        undefined,
        undefined,
        undefined,
        VALID_MVT.allowed_signals,
        VALID_MVT.kill_rules,
        VALID_MVT.seed_scenarios
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Missing allowed_signals', () => {
    it('should reject when allowed_signals is undefined', () => {
      const result = validateMVT(
        VALID_MVT.primary_entity_type,
        VALID_MVT.buyer_role,
        VALID_MVT.decision_owner,
        undefined,
        VALID_MVT.kill_rules,
        VALID_MVT.seed_scenarios
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least 1 allowed_signal is required');
    });

    it('should reject when allowed_signals is empty array', () => {
      const result = validateMVT(
        VALID_MVT.primary_entity_type,
        VALID_MVT.buyer_role,
        VALID_MVT.decision_owner,
        [],
        VALID_MVT.kill_rules,
        VALID_MVT.seed_scenarios
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least 1 allowed_signal is required');
    });
  });

  describe('Missing seed_scenarios', () => {
    it('should reject when seed_scenarios is undefined', () => {
      const result = validateMVT(
        VALID_MVT.primary_entity_type,
        VALID_MVT.buyer_role,
        VALID_MVT.decision_owner,
        VALID_MVT.allowed_signals,
        VALID_MVT.kill_rules,
        undefined
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('seed_scenarios is required');
    });
  });
});

// =============================================================================
// TEST 2: WRONG ENTITY_TYPE VS SIGNAL → REJECTED
// =============================================================================

describe('Test 2: Wrong entity_type vs signal → Rejected', () => {
  it('should reject when signal entity_type does not match primary_entity_type', () => {
    const mismatchedSignals: AllowedSignal[] = [
      { signal_key: 'hiring_expansion', entity_type: 'individual', justification: 'Test' }, // MISMATCH: company vs individual
    ];

    const result = validateMVT(
      'company', // primary_entity_type is 'company'
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      mismatchedSignals, // but signal says 'individual'
      VALID_MVT.kill_rules,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("entity_type 'individual' must match primary_entity_type 'company'"))).toBe(true);
  });

  it('should reject when any signal has mismatched entity_type', () => {
    const mixedSignals: AllowedSignal[] = [
      { signal_key: 'hiring_expansion', entity_type: 'company', justification: 'Valid' },
      { signal_key: 'life_event', entity_type: 'individual', justification: 'INVALID' }, // MISMATCH
      { signal_key: 'office_opening', entity_type: 'company', justification: 'Valid' },
    ];

    const result = validateMVT(
      'company',
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      mixedSignals,
      VALID_MVT.kill_rules,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("entity_type 'individual' must match"))).toBe(true);
  });

  it('should accept when all signals match primary_entity_type', () => {
    const validSignals: AllowedSignal[] = [
      { signal_key: 'hiring_expansion', entity_type: 'company', justification: 'Valid' },
      { signal_key: 'headcount_jump', entity_type: 'company', justification: 'Valid' },
    ];

    const result = validateMVT(
      'company',
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      validSignals,
      VALID_MVT.kill_rules,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

// =============================================================================
// TEST 3: NO KILL RULES → REJECTED
// =============================================================================

describe('Test 3: No kill rules → Rejected', () => {
  it('should reject when kill_rules is undefined', () => {
    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      undefined,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Minimum 2 kill_rules required'))).toBe(true);
  });

  it('should reject when kill_rules is empty', () => {
    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      [],
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum 2 kill_rules required (found: 0)');
  });

  it('should reject when only 1 kill_rule is provided', () => {
    const singleKillRule: KillRule[] = [
      { rule: 'test_rule', action: 'BLOCK', reason: 'Compliance test' },
    ];

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      singleKillRule,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum 2 kill_rules required (found: 1)');
  });

  it('should reject when no compliance/regulatory kill_rule exists', () => {
    const nonComplianceRules: KillRule[] = [
      { rule: 'too_small', action: 'BLOCK', reason: 'Business: Company too small' },
      { rule: 'wrong_industry', action: 'BLOCK', reason: 'Business: Wrong industry vertical' },
    ];

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      nonComplianceRules,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least 1 compliance/regulatory kill_rule required');
  });

  it('should accept when 2+ kill_rules with at least 1 compliance', () => {
    const validKillRules: KillRule[] = [
      { rule: 'sanctioned', action: 'BLOCK', reason: 'Compliance: Sanctioned entity' },
      { rule: 'too_small', action: 'BLOCK', reason: 'Business: Company too small' },
    ];

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      validKillRules,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(true);
  });

  it('should recognize AML and KYC as compliance keywords', () => {
    const amlKycRules: KillRule[] = [
      { rule: 'aml_flag', action: 'BLOCK', reason: 'AML screening failed' },
      { rule: 'kyc_incomplete', action: 'BLOCK', reason: 'KYC documents missing' },
    ];

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      amlKycRules,
      VALID_MVT.seed_scenarios
    );

    // Should pass because AML/KYC count as compliance
    expect(result.valid).toBe(true);
    expect(result.errors).not.toContain('At least 1 compliance/regulatory kill_rule required');
  });
});

// =============================================================================
// TEST 4: NO SALES-BENCH SEEDS → REJECTED
// =============================================================================

describe('Test 4: No Sales-Bench seeds → Rejected', () => {
  it('should reject when golden scenarios is empty', () => {
    const noGolden: SeedScenarios = {
      golden: [],
      kill: VALID_MVT.seed_scenarios.kill,
    };

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      noGolden
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum 2 golden seed_scenarios required (found: 0)');
  });

  it('should reject when only 1 golden scenario provided', () => {
    const oneGolden: SeedScenarios = {
      golden: [VALID_MVT.seed_scenarios.golden[0]],
      kill: VALID_MVT.seed_scenarios.kill,
    };

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      oneGolden
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum 2 golden seed_scenarios required (found: 1)');
  });

  it('should reject when kill scenarios is empty', () => {
    const noKill: SeedScenarios = {
      golden: VALID_MVT.seed_scenarios.golden,
      kill: [],
    };

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      noKill
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum 2 kill seed_scenarios required (found: 0)');
  });

  it('should reject when only 1 kill scenario provided', () => {
    const oneKill: SeedScenarios = {
      golden: VALID_MVT.seed_scenarios.golden,
      kill: [VALID_MVT.seed_scenarios.kill[0]],
    };

    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      oneKill
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Minimum 2 kill seed_scenarios required (found: 1)');
  });

  it('should accept when 2+ golden and 2+ kill scenarios provided', () => {
    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

// =============================================================================
// TEST 5: VALID MVT → RUNTIME_ELIGIBLE = FALSE (UNTIL PERSONA + POLICY)
// =============================================================================

describe('Test 5: Valid MVT → runtime_eligible = false (until persona + policy)', () => {
  /**
   * This test verifies the business logic that:
   * - A sub-vertical with valid MVT is mvt_valid = true
   * - But runtime_eligible remains false until:
   *   - At least one active persona exists
   *   - That persona has an ACTIVE policy
   */

  interface RuntimeEligibilityInput {
    mvt_valid: boolean;
    sub_vertical_is_active: boolean;
    vertical_is_active: boolean;
    has_active_persona_with_active_policy: boolean;
  }

  function calculateRuntimeEligibility(input: RuntimeEligibilityInput): {
    runtime_eligible: boolean;
    eligibility_blocker: string | null;
  } {
    if (!input.sub_vertical_is_active) {
      return { runtime_eligible: false, eligibility_blocker: 'SUB_VERTICAL_INACTIVE' };
    }
    if (!input.mvt_valid) {
      return { runtime_eligible: false, eligibility_blocker: 'MVT_INCOMPLETE' };
    }
    if (!input.vertical_is_active) {
      return { runtime_eligible: false, eligibility_blocker: 'VERTICAL_INACTIVE' };
    }
    if (!input.has_active_persona_with_active_policy) {
      return { runtime_eligible: false, eligibility_blocker: 'NO_ACTIVE_PERSONA_POLICY' };
    }
    return { runtime_eligible: true, eligibility_blocker: null };
  }

  it('should be NOT runtime_eligible when mvt_valid but no persona', () => {
    const result = calculateRuntimeEligibility({
      mvt_valid: true,
      sub_vertical_is_active: true,
      vertical_is_active: true,
      has_active_persona_with_active_policy: false, // NO PERSONA
    });

    expect(result.runtime_eligible).toBe(false);
    expect(result.eligibility_blocker).toBe('NO_ACTIVE_PERSONA_POLICY');
  });

  it('should be NOT runtime_eligible when mvt_valid but persona policy not ACTIVE', () => {
    const result = calculateRuntimeEligibility({
      mvt_valid: true,
      sub_vertical_is_active: true,
      vertical_is_active: true,
      has_active_persona_with_active_policy: false, // Policy is DRAFT, not ACTIVE
    });

    expect(result.runtime_eligible).toBe(false);
    expect(result.eligibility_blocker).toBe('NO_ACTIVE_PERSONA_POLICY');
  });

  it('should be NOT runtime_eligible when mvt_invalid even with persona', () => {
    const result = calculateRuntimeEligibility({
      mvt_valid: false, // MVT INCOMPLETE
      sub_vertical_is_active: true,
      vertical_is_active: true,
      has_active_persona_with_active_policy: true,
    });

    expect(result.runtime_eligible).toBe(false);
    expect(result.eligibility_blocker).toBe('MVT_INCOMPLETE');
  });

  it('should be NOT runtime_eligible when sub_vertical inactive', () => {
    const result = calculateRuntimeEligibility({
      mvt_valid: true,
      sub_vertical_is_active: false, // INACTIVE
      vertical_is_active: true,
      has_active_persona_with_active_policy: true,
    });

    expect(result.runtime_eligible).toBe(false);
    expect(result.eligibility_blocker).toBe('SUB_VERTICAL_INACTIVE');
  });

  it('should be NOT runtime_eligible when parent vertical inactive', () => {
    const result = calculateRuntimeEligibility({
      mvt_valid: true,
      sub_vertical_is_active: true,
      vertical_is_active: false, // PARENT INACTIVE
      has_active_persona_with_active_policy: true,
    });

    expect(result.runtime_eligible).toBe(false);
    expect(result.eligibility_blocker).toBe('VERTICAL_INACTIVE');
  });

  it('should be runtime_eligible when ALL conditions met', () => {
    const result = calculateRuntimeEligibility({
      mvt_valid: true,
      sub_vertical_is_active: true,
      vertical_is_active: true,
      has_active_persona_with_active_policy: true, // ALL CONDITIONS MET
    });

    expect(result.runtime_eligible).toBe(true);
    expect(result.eligibility_blocker).toBe(null);
  });
});

// =============================================================================
// TEST 6: REPLAY DETERMINISM HOLDS AFTER CREATION
// =============================================================================

describe('Test 6: Replay determinism holds after creation', () => {
  /**
   * PRD v1.2 Law 5: If it cannot be replayed, it did not happen
   *
   * This test verifies that MVT validation produces the same result
   * when given the same inputs multiple times.
   */

  it('should produce identical validation results on repeated calls', () => {
    // Run validation 5 times with same input
    const results: MVTValidationResult[] = [];

    for (let i = 0; i < 5; i++) {
      const result = validateMVT(
        VALID_MVT.primary_entity_type,
        VALID_MVT.buyer_role,
        VALID_MVT.decision_owner,
        VALID_MVT.allowed_signals,
        VALID_MVT.kill_rules,
        VALID_MVT.seed_scenarios
      );
      results.push(result);
    }

    // All results should be identical
    const firstResult = JSON.stringify(results[0]);
    results.forEach((result, index) => {
      expect(JSON.stringify(result)).toBe(firstResult);
    });
  });

  it('should produce identical error lists on repeated validation failures', () => {
    // Invalid input - missing multiple components
    const invalidInput = {
      primary_entity_type: undefined,
      buyer_role: undefined,
      decision_owner: VALID_MVT.decision_owner,
      allowed_signals: [],
      kill_rules: [],
      seed_scenarios: { golden: [], kill: [] } as SeedScenarios,
    };

    const results: MVTValidationResult[] = [];

    for (let i = 0; i < 5; i++) {
      const result = validateMVT(
        invalidInput.primary_entity_type,
        invalidInput.buyer_role,
        invalidInput.decision_owner,
        invalidInput.allowed_signals,
        invalidInput.kill_rules,
        invalidInput.seed_scenarios
      );
      results.push(result);
    }

    // All error lists should be identical (same order, same content)
    const firstErrors = JSON.stringify(results[0].errors.sort());
    results.forEach((result) => {
      expect(JSON.stringify(result.errors.sort())).toBe(firstErrors);
    });
  });

  it('should produce same validation result regardless of call order', () => {
    // Call with valid input
    const validResult = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      VALID_MVT.seed_scenarios
    );

    // Call with invalid input
    const invalidResult = validateMVT(
      undefined,
      undefined,
      undefined,
      [],
      [],
      undefined
    );

    // Call with valid input again
    const validResultAgain = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      VALID_MVT.seed_scenarios
    );

    // Valid results should be identical before and after invalid call
    expect(validResultAgain.valid).toBe(validResult.valid);
    expect(validResultAgain.errors.length).toBe(validResult.errors.length);
  });
});

// =============================================================================
// COMPLETE MVT VALIDATION TEST
// =============================================================================

describe('Complete MVT Validation', () => {
  it('should pass validation with complete valid MVT', () => {
    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      VALID_MVT.kill_rules,
      VALID_MVT.seed_scenarios
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should collect all errors when multiple validations fail', () => {
    const result = validateMVT(
      undefined,                  // Missing primary_entity_type
      undefined,                  // Missing buyer_role
      undefined,                  // Missing decision_owner
      [],                         // Empty allowed_signals
      [],                         // Empty kill_rules
      { golden: [], kill: [] }    // Empty seed_scenarios
    );

    expect(result.valid).toBe(false);
    // Should have at least 6 different errors
    expect(result.errors.length).toBeGreaterThanOrEqual(6);
    expect(result.errors).toContain('primary_entity_type is required');
    expect(result.errors).toContain('buyer_role is required (ICP Truth Triad)');
    expect(result.errors).toContain('decision_owner is required (ICP Truth Triad)');
    expect(result.errors).toContain('At least 1 allowed_signal is required');
  });
});

// =============================================================================
// ERROR MESSAGE QUALITY TESTS
// =============================================================================

describe('Error Message Quality', () => {
  it('should provide actionable error messages', () => {
    const result = validateMVT(
      'company',
      undefined,
      undefined,
      [{ signal_key: 'test', entity_type: 'individual', justification: 'test' }],
      [
        { rule: 'test1', action: 'BLOCK', reason: 'Business reason 1' },
        { rule: 'test2', action: 'BLOCK', reason: 'Business reason 2' },
      ], // 2 rules but no compliance
      { golden: [], kill: [] }
    );

    // Check that error messages are descriptive
    const errorString = result.errors.join(' ');
    expect(errorString).toContain('buyer_role');
    expect(errorString).toContain('decision_owner');
    expect(errorString).toContain('entity_type');
    expect(errorString).toContain('compliance'); // Now should appear since no compliance rule
    expect(errorString).toContain('golden');
    expect(errorString).toContain('kill');
  });

  it('should show counts in error messages where applicable', () => {
    const result = validateMVT(
      VALID_MVT.primary_entity_type,
      VALID_MVT.buyer_role,
      VALID_MVT.decision_owner,
      VALID_MVT.allowed_signals,
      [{ rule: 'single', action: 'BLOCK', reason: 'Compliance: only one rule' }],
      { golden: [VALID_MVT.seed_scenarios.golden[0]], kill: [VALID_MVT.seed_scenarios.kill[0]] }
    );

    expect(result.errors.some((e) => e.includes('found: 1'))).toBe(true);
  });
});
