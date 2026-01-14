/**
 * POLICY DSL TEST HARNESS
 *
 * Tests the deterministic Policy DSL compiler with fixtures.
 * Run: npx tsx lib/enrichment/policy-dsl.test.ts
 */

import { compilePolicyDSL, isDSLFormat, suggestDSLFromFreeText, IPR } from './policy-dsl';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const FIXTURES = {
  // Valid DSL - Working Capital Infrastructure/EPC
  VALID_WORKING_CAPITAL: `
SCOPE:
- vertical: Working Capital
- sub_vertical: Mid-Market - Infrastructure/EPC
- entity: company_contact
- geo_enforcement: discovery_region_to_apollo

PRIMARY:
- Finance Manager
- Accounts Manager
- Accounts Head
- Treasury Manager
- Cash Management Manager
- Billing Manager
- Receivables Manager
- Collections Manager
- Commercial Manager
- Contracts & Commercial Manager
- Project Finance Manager

SECONDARY:
- Operations Manager
- Project Manager
- Administration Manager

FALLBACK:
- Senior Accounts Executive
- Senior Commercial Executive

EXCLUDE:
- Managing Director
- CEO
- CFO
- Group CFO
- Promoter
- Board Member
`,

  // Valid DSL - Minimal (only required sections)
  VALID_MINIMAL: `
PRIMARY:
- Finance Manager
- Accounts Manager

EXCLUDE:
- CEO
- CFO
`,

  // Invalid - Missing PRIMARY section
  INVALID_MISSING_PRIMARY: `
SECONDARY:
- Operations Manager

EXCLUDE:
- CEO
`,

  // Invalid - Missing EXCLUDE section
  INVALID_MISSING_EXCLUDE: `
PRIMARY:
- Finance Manager
`,

  // Invalid - Executive in PRIMARY (lint error)
  INVALID_EXECUTIVE_IN_PRIMARY: `
PRIMARY:
- Finance Manager
- CEO
- Managing Director

EXCLUDE:
- Board Member
`,

  // Invalid - Parentheses in role
  INVALID_PARENTHESES: `
PRIMARY:
- Finance Manager
- Project Manager (Infrastructure only)

EXCLUDE:
- CEO
`,

  // Invalid - No bullet format
  INVALID_NO_BULLET: `
PRIMARY:
Finance Manager
Accounts Manager

EXCLUDE:
- CEO
`,

  // Invalid - Unknown section
  INVALID_UNKNOWN_SECTION: `
PRIMARY:
- Finance Manager

TARGETS:
- Sales Manager

EXCLUDE:
- CEO
`,

  // Legacy free text (not DSL format)
  LEGACY_FREE_TEXT: `
Identify the most reachable, operational finance contacts who actively manage working capital, payments, receivables, and cash-flow execution for Infrastructure / EPC companies.

PRIMARY ROLES (applies to ALL companies, any size):
- Finance Manager
- Accounts Manager
- Treasury Manager
- Cash Management Manager
- Billing Manager
- Receivables / Collections Manager
- Project Finance Manager

SECONDARY ROLES (use only if primary roles are not found):
- Commercial Manager
- Contracts & Commercial Manager
- Operations Manager

FALLBACK ROLES (use only if neither primary nor secondary roles are found):
- Administration Manager
- Project Manager (Infrastructure / EPC projects only)

EXCLUSIONS (do NOT target these):
- Managing Director
- CEO
- CFO
- Promoter
- Board Member
- Group Finance Head
`,
};

// =============================================================================
// TEST RUNNER
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

function runTests(): TestResult[] {
  const results: TestResult[] = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 1: Valid Working Capital DSL
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.VALID_WORKING_CAPITAL);
    const passed = result.success &&
                   result.ipr!.target_roles.primary.length === 11 &&
                   result.ipr!.target_roles.secondary.length === 3 &&
                   result.ipr!.target_roles.fallback.length === 2 &&
                   result.ipr!.skip_rules.exclusions.length === 6;

    results.push({
      name: 'Valid Working Capital DSL',
      passed,
      message: passed
        ? `Parsed ${result.ipr!.target_roles.primary.length} primary, ${result.ipr!.target_roles.secondary.length} secondary, ${result.ipr!.target_roles.fallback.length} fallback roles`
        : `Errors: ${result.errors.map(e => e.message).join('; ')}`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 2: Valid Minimal DSL
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.VALID_MINIMAL);
    const passed = result.success &&
                   result.ipr!.target_roles.primary.length === 2 &&
                   result.ipr!.skip_rules.exclusions.length === 2;

    results.push({
      name: 'Valid Minimal DSL',
      passed,
      message: passed
        ? 'Minimal DSL parsed correctly'
        : `Errors: ${result.errors.map(e => e.message).join('; ')}`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 3: Missing PRIMARY (should fail)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.INVALID_MISSING_PRIMARY);
    const passed = !result.success &&
                   result.errors.some(e => e.code === 'MISSING_REQUIRED_SECTION');

    results.push({
      name: 'Reject Missing PRIMARY',
      passed,
      message: passed
        ? 'Correctly rejected policy without PRIMARY section'
        : 'Should have rejected missing PRIMARY section',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 4: Missing EXCLUDE (should fail)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.INVALID_MISSING_EXCLUDE);
    const passed = !result.success &&
                   result.errors.some(e => e.code === 'MISSING_REQUIRED_SECTION');

    results.push({
      name: 'Reject Missing EXCLUDE',
      passed,
      message: passed
        ? 'Correctly rejected policy without EXCLUDE section'
        : 'Should have rejected missing EXCLUDE section',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 5: Executive in PRIMARY (should fail lint)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.INVALID_EXECUTIVE_IN_PRIMARY);
    const passed = !result.success &&
                   result.errors.some(e => e.code === 'EXECUTIVE_IN_TARGET_ROLES');

    results.push({
      name: 'Reject Executive in PRIMARY',
      passed,
      message: passed
        ? 'Correctly rejected executive titles in PRIMARY section'
        : 'Should have rejected CEO/Managing Director in PRIMARY',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 6: Parentheses in role (should fail)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.INVALID_PARENTHESES);
    const passed = !result.success &&
                   result.errors.some(e => e.code === 'INVALID_ROLE_FORMAT');

    results.push({
      name: 'Reject Parentheses in Role',
      passed,
      message: passed
        ? 'Correctly rejected role with parentheses'
        : 'Should have rejected "Project Manager (Infrastructure only)"',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 7: No bullet format (should fail)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.INVALID_NO_BULLET);
    const passed = !result.success &&
                   result.errors.some(e => e.code === 'INVALID_LIST_FORMAT');

    results.push({
      name: 'Reject Non-Bullet Format',
      passed,
      message: passed
        ? 'Correctly rejected lines without bullet prefix'
        : 'Should have rejected lines not starting with "- "',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 8: Unknown section (should fail)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.INVALID_UNKNOWN_SECTION);
    const passed = !result.success &&
                   result.errors.some(e => e.code === 'UNKNOWN_SECTION');

    results.push({
      name: 'Reject Unknown Section',
      passed,
      message: passed
        ? 'Correctly rejected unknown section "TARGETS:"'
        : 'Should have rejected unknown section',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 9: DSL format detection
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const isDSL = isDSLFormat(FIXTURES.VALID_WORKING_CAPITAL);
    const isNotDSL = !isDSLFormat(FIXTURES.LEGACY_FREE_TEXT);

    results.push({
      name: 'DSL Format Detection',
      passed: isDSL && isNotDSL,
      message: isDSL && isNotDSL
        ? 'Correctly identified DSL vs free text'
        : `DSL detection failed: isDSL=${isDSL}, isNotDSL=${isNotDSL}`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 10: Legacy free text suggestion
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const suggested = suggestDSLFromFreeText(FIXTURES.LEGACY_FREE_TEXT);
    const hasRequiredSections = suggested.includes('PRIMARY:') &&
                                 suggested.includes('EXCLUDE:');

    results.push({
      name: 'Legacy to DSL Suggestion',
      passed: hasRequiredSections,
      message: hasRequiredSections
        ? 'Generated suggested DSL from free text'
        : 'Failed to generate DSL suggestion',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 11: IPR structure validation
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result = compilePolicyDSL(FIXTURES.VALID_WORKING_CAPITAL);
    const ipr = result.ipr!;

    const hasCorrectStructure =
      ipr.version === '2.0' &&
      ipr.scope.entity === 'company_contact' &&
      ipr.scope.geo_enforcement === 'discovery_region_to_apollo' &&
      Array.isArray(ipr.target_roles.primary) &&
      Array.isArray(ipr.target_roles.secondary) &&
      Array.isArray(ipr.target_roles.fallback) &&
      Array.isArray(ipr.skip_rules.exclusions) &&
      ipr.metadata.source_format === 'dsl' &&
      ipr.metadata.policy_hash.length === 8;

    results.push({
      name: 'IPR Structure Validation',
      passed: hasCorrectStructure,
      message: hasCorrectStructure
        ? 'IPR has correct structure for runtime'
        : 'IPR structure is invalid',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST 12: Determinism check (same input = same output)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const result1 = compilePolicyDSL(FIXTURES.VALID_MINIMAL);
    const result2 = compilePolicyDSL(FIXTURES.VALID_MINIMAL);

    const isDeterministic =
      result1.ipr!.metadata.policy_hash === result2.ipr!.metadata.policy_hash &&
      JSON.stringify(result1.ipr!.target_roles) === JSON.stringify(result2.ipr!.target_roles);

    results.push({
      name: 'Determinism Check',
      passed: isDeterministic,
      message: isDeterministic
        ? 'Same input produces identical output (deterministic)'
        : 'Parser is not deterministic!',
    });
  }

  return results;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('  POLICY DSL COMPILER - TEST HARNESS');
  console.log('═'.repeat(70));
  console.log('');

  const results = runTests();

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
    console.log('');

    if (result.passed) passed++;
    else failed++;
  }

  console.log('─'.repeat(70));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('═'.repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

main();
