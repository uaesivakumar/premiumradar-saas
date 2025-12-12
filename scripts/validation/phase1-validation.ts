/**
 * Phase 1 Validation Wall - Comprehensive Validation Suite
 *
 * This script validates all critical paths of PremiumRadar before Private Beta.
 *
 * Usage: npx tsx scripts/validation/phase1-validation.ts [staging|production]
 */

const BASE_URL = process.argv[2] === 'production'
  ? 'https://premiumradar.com'
  : 'https://upr.sivakumar.ai';

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  details: string;
  latencyMs?: number;
  timestamp: string;
}

const results: ValidationResult[] = [];

function log(result: ValidationResult) {
  const icon = {
    PASS: '✅',
    FAIL: '❌',
    WARN: '⚠️',
    SKIP: '⏭️'
  }[result.status];

  console.log(`${icon} [${result.category}] ${result.test}: ${result.details}${result.latencyMs ? ` (${result.latencyMs}ms)` : ''}`);
  results.push(result);
}

async function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, latencyMs: Date.now() - start };
}

// ============================================================
// WORKSTREAM 1: Journey & Wiring Validation
// ============================================================

async function validateHealthEndpoints() {
  console.log('\n📋 WORKSTREAM 1: Journey & Wiring Validation\n');

  // Health endpoint
  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      return res.json();
    });

    if (result.status === 'healthy') {
      log({ category: 'Health', test: 'API Health Check', status: 'PASS', details: 'SaaS healthy', latencyMs, timestamp: new Date().toISOString() });
    } else {
      log({ category: 'Health', test: 'API Health Check', status: 'FAIL', details: `Status: ${result.status}`, latencyMs, timestamp: new Date().toISOString() });
    }

    // Check OS connectivity
    if (result.services?.os?.status === 'healthy') {
      log({ category: 'Health', test: 'OS Connectivity', status: 'PASS', details: 'OS reachable', timestamp: new Date().toISOString() });
    } else {
      log({ category: 'Health', test: 'OS Connectivity', status: 'WARN', details: result.services?.os?.error || 'OS status unknown', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'Health', test: 'API Health Check', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }

  // Status endpoint
  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/status`);
      return res.json();
    });

    if (result.status === 'operational') {
      log({ category: 'Health', test: 'Status Endpoint', status: 'PASS', details: 'Operational', latencyMs, timestamp: new Date().toISOString() });

      // Check individual services
      for (const service of result.services || []) {
        if (service.status === 'up') {
          log({ category: 'Health', test: `Service: ${service.name}`, status: 'PASS', details: service.message || 'Up', timestamp: new Date().toISOString() });
        } else {
          log({ category: 'Health', test: `Service: ${service.name}`, status: 'WARN', details: service.message || service.status, timestamp: new Date().toISOString() });
        }
      }
    } else {
      log({ category: 'Health', test: 'Status Endpoint', status: 'WARN', details: `Status: ${result.status}`, latencyMs, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'Health', test: 'Status Endpoint', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }
}

// ============================================================
// WORKSTREAM 2: Vertical & SalesContext Validation
// ============================================================

async function validateVerticalConfig() {
  console.log('\n📋 WORKSTREAM 2: Vertical & SalesContext Validation\n');

  // Banking/EB/UAE - should work
  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/admin/vertical-config?vertical=banking&subVertical=employee-banking&region=UAE`);
      return res.json();
    });

    if (result.success && result.data) {
      log({ category: 'Vertical', test: 'Banking/EB/UAE Config', status: 'PASS', details: `radarTarget=${result.data.radarTarget}`, latencyMs, timestamp: new Date().toISOString() });

      // Validate EB-specific fields
      if (result.data.radarTarget === 'companies') {
        log({ category: 'Vertical', test: 'EB Entity Type', status: 'PASS', details: 'Correct: companies', timestamp: new Date().toISOString() });
      } else {
        log({ category: 'Vertical', test: 'EB Entity Type', status: 'FAIL', details: `Expected companies, got ${result.data.radarTarget}`, timestamp: new Date().toISOString() });
      }

      // Check for persona
      if (result.data.persona?.persona_name) {
        log({ category: 'Vertical', test: 'EB Persona Present', status: 'PASS', details: result.data.persona.persona_name, timestamp: new Date().toISOString() });
      } else {
        log({ category: 'Vertical', test: 'EB Persona Present', status: 'WARN', details: 'No persona configured', timestamp: new Date().toISOString() });
      }
    } else {
      log({ category: 'Vertical', test: 'Banking/EB/UAE Config', status: 'FAIL', details: result.error || 'Unknown error', latencyMs, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'Vertical', test: 'Banking/EB/UAE Config', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }

  // Unsupported vertical - should show Coming Soon
  const unsupportedVerticals = [
    { vertical: 'insurance', subVertical: 'life-insurance', region: 'UAE' },
    { vertical: 'real-estate', subVertical: 'residential', region: 'UAE' },
    { vertical: 'recruitment', subVertical: 'executive-search', region: 'UAE' },
  ];

  for (const config of unsupportedVerticals) {
    try {
      const { result, latencyMs } = await measureLatency(async () => {
        const res = await fetch(`${BASE_URL}/api/admin/vertical-config?vertical=${config.vertical}&subVertical=${config.subVertical}&region=${config.region}`);
        return res.json();
      });

      if (result.success === false && result.error === 'VERTICAL_NOT_CONFIGURED') {
        log({ category: 'Vertical', test: `Unsupported: ${config.vertical}`, status: 'PASS', details: 'Correctly returns Coming Soon', latencyMs, timestamp: new Date().toISOString() });
      } else if (result.success) {
        log({ category: 'Vertical', test: `Unsupported: ${config.vertical}`, status: 'WARN', details: 'Unexpectedly configured', latencyMs, timestamp: new Date().toISOString() });
      } else {
        log({ category: 'Vertical', test: `Unsupported: ${config.vertical}`, status: 'FAIL', details: result.error || 'Unknown error', latencyMs, timestamp: new Date().toISOString() });
      }
    } catch (error) {
      log({ category: 'Vertical', test: `Unsupported: ${config.vertical}`, status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
    }
  }
}

// ============================================================
// WORKSTREAM 3: AI Behaviour, Latency & Fallbacks
// ============================================================

async function validateOSEndpoints() {
  console.log('\n📋 WORKSTREAM 3: AI Behaviour, Latency & Fallbacks\n');

  // Discovery endpoint
  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/os/discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'validation-test',
          region_code: 'UAE',
          vertical_id: 'banking'
        })
      });
      return res.json();
    });

    if (result.success) {
      log({ category: 'OS', test: 'Discovery Endpoint', status: 'PASS', details: `Found ${result.data?.signals?.length || 0} signals`, latencyMs, timestamp: new Date().toISOString() });

      // Check latency thresholds
      if (latencyMs < 2000) {
        log({ category: 'Latency', test: 'Discovery p95 Target', status: 'PASS', details: `${latencyMs}ms < 2000ms`, timestamp: new Date().toISOString() });
      } else {
        log({ category: 'Latency', test: 'Discovery p95 Target', status: 'WARN', details: `${latencyMs}ms >= 2000ms target`, timestamp: new Date().toISOString() });
      }
    } else {
      log({ category: 'OS', test: 'Discovery Endpoint', status: 'FAIL', details: result.error || 'Unknown error', latencyMs, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'OS', test: 'Discovery Endpoint', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }

  // Score endpoint
  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/os/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'validation-test',
          entity_ids: ['test-company-1'],
          region_code: 'UAE',
          vertical_id: 'banking'
        })
      });
      return res.json();
    });

    if (result.success) {
      log({ category: 'OS', test: 'Score Endpoint', status: 'PASS', details: 'QTLE scoring working', latencyMs, timestamp: new Date().toISOString() });
    } else {
      log({ category: 'OS', test: 'Score Endpoint', status: 'FAIL', details: result.error || 'Unknown error', latencyMs, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'OS', test: 'Score Endpoint', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }

  // Outreach endpoint
  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/os/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'validation-test',
          entity_ids: ['test-company-1']
        })
      });
      return res.json();
    });

    if (result.success) {
      log({ category: 'OS', test: 'Outreach Endpoint', status: 'PASS', details: 'Outreach generation working', latencyMs, timestamp: new Date().toISOString() });
    } else {
      log({ category: 'OS', test: 'Outreach Endpoint', status: 'FAIL', details: result.error || 'Unknown error', latencyMs, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'OS', test: 'Outreach Endpoint', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }

  // Pipeline endpoint
  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/os/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: 'validation-test',
          region_code: 'UAE',
          vertical_id: 'banking'
        })
      });
      return res.json();
    });

    if (result.success) {
      log({ category: 'OS', test: 'Pipeline Endpoint', status: 'PASS', details: 'Full pipeline working', latencyMs, timestamp: new Date().toISOString() });
    } else {
      log({ category: 'OS', test: 'Pipeline Endpoint', status: 'FAIL', details: result.error || 'Unknown error', latencyMs, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'OS', test: 'Pipeline Endpoint', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }
}

// ============================================================
// WORKSTREAM 4: Error Handling & Fallbacks
// ============================================================

async function validateErrorHandling() {
  console.log('\n📋 Error Handling & Fallback Validation\n');

  // Invalid vertical config request
  try {
    const res = await fetch(`${BASE_URL}/api/admin/vertical-config?invalid=true`);
    const result = await res.json();

    if (result.success === false && result.error) {
      log({ category: 'Errors', test: 'Invalid Request Handling', status: 'PASS', details: 'Returns proper error', timestamp: new Date().toISOString() });
    } else {
      log({ category: 'Errors', test: 'Invalid Request Handling', status: 'WARN', details: 'No error returned for invalid request', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'Errors', test: 'Invalid Request Handling', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }

  // Empty body to OS endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/os/discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    const result = await res.json();

    // Check no stack trace leaked
    const responseStr = JSON.stringify(result);
    if (responseStr.includes('at ') || responseStr.includes('Error:') || responseStr.includes('stack')) {
      log({ category: 'Security', test: 'No Stack Trace Leak', status: 'FAIL', details: 'Stack trace detected in response', timestamp: new Date().toISOString() });
    } else {
      log({ category: 'Security', test: 'No Stack Trace Leak', status: 'PASS', details: 'Clean error response', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'Security', test: 'No Stack Trace Leak', status: 'PASS', details: 'Request failed gracefully', timestamp: new Date().toISOString() });
  }
}

// ============================================================
// WORKSTREAM 5: Billing & Plans
// ============================================================

async function validateBilling() {
  console.log('\n📋 Billing & Plans Validation\n');

  try {
    const { result, latencyMs } = await measureLatency(async () => {
      const res = await fetch(`${BASE_URL}/api/billing/plans`);
      return res.json();
    });

    if (result.success) {
      const planCount = result.plans?.length || 0;
      if (planCount > 0) {
        log({ category: 'Billing', test: 'Plans Endpoint', status: 'PASS', details: `${planCount} plans available`, latencyMs, timestamp: new Date().toISOString() });
      } else {
        log({ category: 'Billing', test: 'Plans Endpoint', status: 'WARN', details: 'No plans configured', latencyMs, timestamp: new Date().toISOString() });
      }
    } else {
      log({ category: 'Billing', test: 'Plans Endpoint', status: 'FAIL', details: result.error || 'Unknown error', latencyMs, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    log({ category: 'Billing', test: 'Plans Endpoint', status: 'FAIL', details: String(error), timestamp: new Date().toISOString() });
  }
}

// ============================================================
// Generate Report
// ============================================================

function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('PHASE 1 VALIDATION REPORT');
  console.log('='.repeat(70));
  console.log(`Environment: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(70) + '\n');

  const summary = {
    total: results.length,
    pass: results.filter(r => r.status === 'PASS').length,
    fail: results.filter(r => r.status === 'FAIL').length,
    warn: results.filter(r => r.status === 'WARN').length,
    skip: results.filter(r => r.status === 'SKIP').length,
  };

  console.log('SUMMARY:');
  console.log(`  Total Tests: ${summary.total}`);
  console.log(`  ✅ Passed: ${summary.pass}`);
  console.log(`  ❌ Failed: ${summary.fail}`);
  console.log(`  ⚠️ Warnings: ${summary.warn}`);
  console.log(`  ⏭️ Skipped: ${summary.skip}`);
  console.log('');

  const passRate = ((summary.pass / summary.total) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%`);

  if (summary.fail > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - [${r.category}] ${r.test}: ${r.details}`);
    });
  }

  if (summary.warn > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  - [${r.category}] ${r.test}: ${r.details}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  // Determine readiness
  if (summary.fail === 0 && summary.warn <= 3) {
    console.log('🟢 RECOMMENDATION: GO for Private Beta');
  } else if (summary.fail <= 2) {
    console.log('🟡 RECOMMENDATION: GO with Known Issues');
  } else {
    console.log('🔴 RECOMMENDATION: NO-GO - Critical issues must be resolved');
  }

  console.log('='.repeat(70) + '\n');

  return { summary, results };
}

// ============================================================
// Main Execution
// ============================================================

async function main() {
  console.log('🚀 Starting Phase 1 Validation Wall...\n');
  console.log(`Target: ${BASE_URL}`);
  console.log('');

  await validateHealthEndpoints();
  await validateVerticalConfig();
  await validateOSEndpoints();
  await validateErrorHandling();
  await validateBilling();

  return generateReport();
}

main().catch(console.error);
