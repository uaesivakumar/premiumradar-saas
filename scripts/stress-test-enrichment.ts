/**
 * Stress Test Script for Enrichment API
 *
 * Tests the real Apollo + SERP integration with actual API calls.
 * Run with: npx tsx scripts/stress-test-enrichment.ts
 */

const BASE_URL = process.env.BASE_URL || 'https://premiumradar-saas-staging-191599223867.us-central1.run.app';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: unknown;
}

async function runTest(name: string, testFn: () => Promise<unknown>): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const data = await testFn();
    return {
      name,
      success: true,
      duration: Date.now() - startTime,
      data,
    };
  } catch (error) {
    return {
      name,
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Test 1: Enrichment Search API
async function testEnrichmentSearch() {
  const response = await fetch(`${BASE_URL}/api/enrichment/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vertical: 'banking',
      subVertical: 'employee-banking',
      region: 'UAE',
      regions: ['dubai', 'abu-dhabi'],
      limit: 5,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error || data.message}`);
  }

  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return {
    entitiesReturned: data.data?.entities?.length || 0,
    sourcesUsed: data.data?.dataQuality?.sourcesUsed || [],
    signalCount: data.data?.dataQuality?.signalCount || 0,
    sample: data.data?.entities?.[0],
  };
}

// Test 2: Single Entity Enrichment
async function testSingleEnrichment() {
  const response = await fetch(
    `${BASE_URL}/api/enrichment/search?entity=emirates.com&vertical=banking&subVertical=employee-banking&region=UAE`,
    { method: 'GET' }
  );

  const data = await response.json();

  if (!response.ok && response.status !== 404) {
    throw new Error(`HTTP ${response.status}: ${data.error || data.message}`);
  }

  return {
    found: data.success,
    entity: data.data?.name,
    score: data.data?.score,
    signalCount: data.data?.signals?.length || 0,
  };
}

// Test 3: Vertical Config Fetch
async function testVerticalConfig() {
  const response = await fetch(
    `${BASE_URL}/api/admin/vertical-config?vertical=banking&subVertical=employee-banking&region=UAE`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error || data.message}`);
  }

  return {
    configured: data.success,
    radarTarget: data.data?.radarTarget,
    signalTypes: data.data?.config?.allowedSignalTypes?.length || 0,
    enrichmentSources: data.data?.config?.enrichmentSources?.length || 0,
  };
}

// Test 4: API Integrations List
async function testIntegrationsList() {
  const response = await fetch(`${BASE_URL}/api/admin/integrations`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error || data.message}`);
  }

  return {
    integrations: data.data?.length || 0,
    providers: data.data?.map((i: { provider: string }) => i.provider) || [],
  };
}

// Test 5: Concurrent Requests
async function testConcurrentRequests() {
  const requests = Array(5).fill(null).map(() =>
    fetch(`${BASE_URL}/api/enrichment/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vertical: 'banking',
        subVertical: 'employee-banking',
        region: 'UAE',
        limit: 3,
      }),
    }).then(r => r.json())
  );

  const results = await Promise.all(requests);
  const successes = results.filter(r => r.success).length;

  return {
    totalRequests: 5,
    successes,
    failures: 5 - successes,
  };
}

// Main test runner
async function main() {
  console.log('='.repeat(60));
  console.log('ENRICHMENT API STRESS TEST');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));
  console.log();

  const tests = [
    { name: 'Vertical Config Fetch', fn: testVerticalConfig },
    { name: 'API Integrations List', fn: testIntegrationsList },
    { name: 'Enrichment Search (5 entities)', fn: testEnrichmentSearch },
    { name: 'Single Entity Enrichment', fn: testSingleEnrichment },
    { name: 'Concurrent Requests (5x)', fn: testConcurrentRequests },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`Running: ${test.name}...`);
    const result = await runTest(test.name, test.fn);
    results.push(result);

    const status = result.success ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} (${result.duration}ms)`);

    if (result.success && result.data) {
      console.log(`  Data: ${JSON.stringify(result.data, null, 2).split('\n').map(l => '    ' + l).join('\n')}`);
    }

    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }

    console.log();
  }

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
