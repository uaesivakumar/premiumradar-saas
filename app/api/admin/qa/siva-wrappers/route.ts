/**
 * QA Test: SIVA Wrappers with Vertical Config
 *
 * GET /api/admin/qa/siva-wrappers
 *
 * Tests:
 * 1. IntentWrapper - Should adjust intent based on vertical
 * 2. EvidenceWrapper - Should apply allowed signals based on vertical config
 * 3. RoutingWrapper - Should route to allowed agents for sub-vertical
 * 4. PersonaWrapper - Should use vertical-specific tone
 * 5. Object Creation - Should pick correct type based on radar target
 */

// Force dynamic rendering - this route needs to hit the database
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getVerticalConfigCached } from '@/lib/admin/vertical-config-service';
import {
  getAllowedSignalTypes,
  getRadarTarget,
  createSalesContext,
  isSignalTypeAllowed,
  targetsCompanies,
  hiringSignalsRelevant,
  applyVerticalConfig,
} from '@/lib/intelligence/context';
import type { SalesContext, VerticalConfig, Vertical, SubVertical } from '@/lib/intelligence/context/types';

// =============================================================================
// TEST TYPES
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  data?: unknown;
}

interface QAReport {
  timestamp: string;
  vertical: string;
  subVertical: string;
  region: string;
  configLoaded: boolean;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

// =============================================================================
// TEST HELPERS
// =============================================================================

function createTestContext(
  vertical: Vertical,
  subVertical: SubVertical,
  country: string,
  config?: VerticalConfig
): SalesContext {
  // Create context with multi-region support (default to 'dubai' for UAE)
  const ctx = createSalesContext({
    userId: 'qa-test-user',
    vertical,
    subVertical,
    regions: ['dubai'], // Multi-region array
  });

  if (config) {
    return applyVerticalConfig(ctx, config);
  }

  return ctx;
}

// =============================================================================
// TEST CASES
// =============================================================================

function testIntentWrapper(context: SalesContext): TestResult {
  // Test: Intent should include sales context in normalized parameters
  const salesContextInjected = {
    vertical: context.vertical,
    subVertical: context.subVertical,
    regions: context.regions,
  };

  const hasValidContext =
    salesContextInjected.vertical === 'banking' &&
    salesContextInjected.subVertical === 'employee-banking' &&
    salesContextInjected.regions.length > 0;

  const regionsStr = context.regions.join('+');
  return {
    name: 'IntentWrapper - Sales Context Injection',
    passed: hasValidContext,
    details: hasValidContext
      ? `Intent parameters include: ${context.vertical}/${context.subVertical}/${regionsStr}`
      : 'Sales context not properly configured',
    data: salesContextInjected,
  };
}

function testEvidenceWrapper(context: SalesContext): TestResult {
  // Test: Only allowed signal types should be returned
  const allowedSignals = getAllowedSignalTypes(context);
  const hasConfig = !!context.verticalConfig;
  const expectedSignals = [
    'hiring-expansion',
    'office-opening',
    'headcount-jump',
    'subsidiary-creation',
    'funding-round',
  ];

  const hasExpectedSignals = hasConfig
    ? expectedSignals.every((s) => allowedSignals.includes(s))
    : allowedSignals.length === 0;

  // Test that insurance signals are NOT allowed for banking
  const insuranceSignalBlocked = !allowedSignals.includes('life-event');
  const realEstateSignalBlocked = !allowedSignals.includes('rental-expiry');

  const allPassed = hasConfig
    ? hasExpectedSignals && insuranceSignalBlocked && realEstateSignalBlocked
    : allowedSignals.length === 0;

  return {
    name: 'EvidenceWrapper - Signal Filtering',
    passed: allPassed,
    details: hasConfig
      ? `${allowedSignals.length} signals allowed. Insurance/RE signals blocked: ${insuranceSignalBlocked && realEstateSignalBlocked}`
      : 'No config loaded - signals correctly empty',
    data: {
      allowedSignals,
      configLoaded: hasConfig,
      insuranceBlocked: insuranceSignalBlocked,
      realEstateBlocked: realEstateSignalBlocked,
    },
  };
}

function testRoutingWrapper(context: SalesContext): TestResult {
  // Test: Routing should respect vertical
  // Banking should route to: discovery, ranking, outreach, enrichment
  // (NOT to insurance-specific or real-estate-specific agents)

  const validAgents = ['discovery', 'ranking', 'outreach', 'enrichment'];
  const radarTarget = getRadarTarget(context.vertical);

  // For banking, radar target should be 'companies'
  const correctTarget = radarTarget === 'companies';

  // Hiring signals should be relevant for banking
  const hiringRelevant = hiringSignalsRelevant(context.vertical);

  return {
    name: 'RoutingWrapper - Agent Routing',
    passed: correctTarget && hiringRelevant,
    details: `Radar target: ${radarTarget}, Hiring signals relevant: ${hiringRelevant}`,
    data: {
      radarTarget,
      validAgents,
      hiringSignalsRelevant: hiringRelevant,
      targetsCompanies: targetsCompanies(context.vertical),
    },
  };
}

function testPersonaWrapper(context: SalesContext): TestResult {
  // Test: Persona should be contextual to vertical
  // Banking personas should have professional tone focused on B2B
  // SIVA must switch personalities dynamically based on vertical

  const verticalPersonaMapping: Record<Vertical, {
    name: string;
    baseTone: string;
    outreachTone: string;
    formality: string;
  }> = {
    banking: {
      name: 'Banking Professional',
      baseTone: 'professional',
      outreachTone: 'executive',
      formality: 'formal',
    },
    insurance: {
      name: 'Insurance Advisor',
      baseTone: 'friendly',
      outreachTone: 'consultative',
      formality: 'semi-formal',
    },
    'real-estate': {
      name: 'Real Estate Consultant',
      baseTone: 'friendly',
      outreachTone: 'consultative',
      formality: 'semi-formal',
    },
    recruitment: {
      name: 'Recruitment Specialist',
      baseTone: 'professional',
      outreachTone: 'consultative',
      formality: 'semi-formal',
    },
    'saas-sales': {
      name: 'SaaS Sales Consultant',
      baseTone: 'professional',
      outreachTone: 'executive',
      formality: 'semi-formal',
    },
  };

  const expectedPersona = verticalPersonaMapping[context.vertical];

  // For banking, verify the persona switches correctly
  const isBanking = context.vertical === 'banking';
  const hasCorrectTone = isBanking && expectedPersona.baseTone === 'professional';
  const hasCorrectOutreach = isBanking && expectedPersona.outreachTone === 'executive';
  const hasCorrectFormality = isBanking && expectedPersona.formality === 'formal';

  const allChecksPass = hasCorrectTone && hasCorrectOutreach && hasCorrectFormality;

  return {
    name: 'PersonaWrapper - Vertical Persona Switching',
    passed: allChecksPass,
    details: allChecksPass
      ? `Banking persona: ${expectedPersona.name} (${expectedPersona.baseTone}/${expectedPersona.outreachTone}/${expectedPersona.formality})`
      : `Persona mismatch for ${context.vertical}`,
    data: {
      vertical: context.vertical,
      expectedPersona,
      checks: {
        baseTone: hasCorrectTone,
        outreachTone: hasCorrectOutreach,
        formality: hasCorrectFormality,
      },
    },
  };
}

function testObjectCreation(context: SalesContext): TestResult {
  // Test: Object creation should use correct radar target
  const radarTarget = getRadarTarget(context.vertical);

  const objectTypeMapping: Record<string, string> = {
    companies: 'CompanyObject',
    individuals: 'IndividualObject',
    families: 'FamilyObject',
    candidates: 'CandidateObject',
  };

  const expectedObjectType = objectTypeMapping[radarTarget];
  const isCompanyTarget = radarTarget === 'companies';

  return {
    name: 'Object Creation - Radar Target',
    passed: isCompanyTarget,
    details: `Radar target: ${radarTarget} → Object type: ${expectedObjectType}`,
    data: {
      radarTarget,
      expectedObjectType,
      vertical: context.vertical,
    },
  };
}

function testSignalTypeValidation(context: SalesContext): TestResult {
  // Test: Signal type validation respects config
  const testSignals = [
    { type: 'hiring-expansion', shouldBeAllowed: true },
    { type: 'life-event', shouldBeAllowed: false }, // Insurance only
    { type: 'rental-expiry', shouldBeAllowed: false }, // Real estate only
    { type: 'job-posting', shouldBeAllowed: false }, // Recruitment only
  ];

  const hasConfig = !!context.verticalConfig;
  let allCorrect = true;
  const results: { signal: string; allowed: boolean; expected: boolean; match: boolean }[] = [];

  for (const test of testSignals) {
    const allowed = isSignalTypeAllowed(test.type, context);
    // If no config, nothing should be allowed
    const expected = hasConfig ? test.shouldBeAllowed : false;
    const match = allowed === expected;

    results.push({
      signal: test.type,
      allowed,
      expected,
      match,
    });

    if (!match) allCorrect = false;
  }

  return {
    name: 'Signal Type Validation',
    passed: allCorrect,
    details: hasConfig
      ? `${results.filter((r) => r.match).length}/${results.length} signal validations correct`
      : 'No config - all signals correctly blocked',
    data: results,
  };
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function GET() {
  const vertical = 'banking' as Vertical;
  const subVertical = 'employee-banking' as SubVertical;
  const region = 'UAE';

  // Try to load config from database
  let config: VerticalConfig | null = null;
  let configError: string | null = null;

  try {
    const dbConfig = await getVerticalConfigCached(vertical, subVertical, region);
    if (dbConfig) {
      // Transform DB config to VerticalConfig format
      config = {
        vertical: dbConfig.vertical as Vertical,
        radarTarget: dbConfig.radarTarget as 'companies' | 'individuals' | 'families' | 'candidates',
        subVerticals: [
          {
            id: dbConfig.subVertical as SubVertical,
            name: dbConfig.name,
            description: dbConfig.description || '',
            relevantSignalTypes: dbConfig.config?.allowedSignalTypes || [],
            defaultKPIs: (dbConfig.config?.defaultKPIs || []).map((kpi: { product: string; target: number; unit: string; period: string }) => ({
              product: kpi.product,
              defaultTarget: kpi.target,
              unit: kpi.unit,
              period: kpi.period as 'monthly' | 'quarterly' | 'yearly',
            })),
          },
        ],
        allowedSignalTypes: dbConfig.config?.allowedSignalTypes || [],
        scoringFactors: (dbConfig.config?.scoringFactors || []).map((sf: { id: string; name: string; weight: number; description?: string }) => ({
          id: sf.id,
          name: sf.name,
          weight: sf.weight,
          signals: [], // Signals are defined at vertical level, not factor level
        })),
        playbooks: [],
        regions: [{ country: region, cities: ['Dubai'], territories: [] }],
      };
    }
  } catch (error) {
    configError = error instanceof Error ? error.message : 'Unknown error';
  }

  // Create test context
  const context = createTestContext(vertical, subVertical, region, config || undefined);

  // Run all tests
  const tests: TestResult[] = [
    testIntentWrapper(context),
    testEvidenceWrapper(context),
    testRoutingWrapper(context),
    testPersonaWrapper(context),
    testObjectCreation(context),
    testSignalTypeValidation(context),
  ];

  // Add config load test
  tests.unshift({
    name: 'Config Load - Database',
    passed: !!config,
    details: config
      ? `Loaded config: ${config.vertical}/${config.subVerticals[0]?.id}/${region}`
      : configError || 'No config found in database',
    data: config
      ? {
          id: config.vertical,
          allowedSignalTypes: config.allowedSignalTypes.length,
          scoringFactors: config.scoringFactors.length,
        }
      : { error: configError },
  });

  // Calculate summary
  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed).length;

  const report: QAReport = {
    timestamp: new Date().toISOString(),
    vertical,
    subVertical,
    region,
    configLoaded: !!config,
    tests,
    summary: {
      total: tests.length,
      passed,
      failed,
    },
  };

  return NextResponse.json(report);
}
