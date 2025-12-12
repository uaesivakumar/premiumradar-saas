/**
 * Phase 1 Validation Wall - Load Testing Suite
 *
 * Tests PremiumRadar under various load conditions:
 * - 10 concurrent users
 * - 50 concurrent users
 * - 100 concurrent users (spike test)
 *
 * Usage: npx tsx scripts/validation/load-test.ts [staging|production] [10|50|100]
 */

const BASE_URL = process.argv[2] === 'production'
  ? 'https://premiumradar.com'
  : 'https://upr.sivakumar.ai';

const CONCURRENCY = parseInt(process.argv[3] || '10', 10);

interface LoadTestResult {
  endpoint: string;
  method: string;
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  requestsPerSecond: number;
  errorRate: number;
  durationMs: number;
}

interface SingleRequestResult {
  success: boolean;
  latencyMs: number;
  statusCode: number;
  error?: string;
}

async function makeRequest(
  url: string,
  method: string = 'GET',
  body?: object
): Promise<SingleRequestResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const latencyMs = Date.now() - start;
    return {
      success: res.ok,
      latencyMs,
      statusCode: res.status,
    };
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      statusCode: 0,
      error: String(error),
    };
  }
}

async function runConcurrentRequests(
  url: string,
  method: string,
  body: object | undefined,
  concurrency: number,
  totalRequests: number
): Promise<SingleRequestResult[]> {
  const results: SingleRequestResult[] = [];
  const batches = Math.ceil(totalRequests / concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalRequests - batch * concurrency);
    const promises = Array(batchSize)
      .fill(null)
      .map(() => makeRequest(url, method, body));

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Progress indicator
    process.stdout.write(`\r  Progress: ${results.length}/${totalRequests} requests`);
  }
  process.stdout.write('\n');

  return results;
}

function calculateStats(results: SingleRequestResult[], endpoint: string, method: string, concurrency: number, durationMs: number): LoadTestResult {
  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b);
  const successful = results.filter(r => r.success).length;

  const p50Index = Math.floor(latencies.length * 0.5);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  return {
    endpoint,
    method,
    concurrency,
    totalRequests: results.length,
    successfulRequests: successful,
    failedRequests: results.length - successful,
    minLatencyMs: Math.min(...latencies),
    maxLatencyMs: Math.max(...latencies),
    avgLatencyMs: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
    p50LatencyMs: latencies[p50Index],
    p95LatencyMs: latencies[p95Index],
    p99LatencyMs: latencies[p99Index],
    requestsPerSecond: Math.round((results.length / durationMs) * 1000 * 10) / 10,
    errorRate: Math.round(((results.length - successful) / results.length) * 100 * 10) / 10,
    durationMs,
  };
}

async function runLoadTest(
  name: string,
  url: string,
  method: string = 'GET',
  body?: object
): Promise<LoadTestResult> {
  const totalRequests = CONCURRENCY * 10; // 10 rounds per concurrency level
  console.log(`\n🔥 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);
  console.log(`   Total Requests: ${totalRequests}`);

  const start = Date.now();
  const results = await runConcurrentRequests(url, method, body, CONCURRENCY, totalRequests);
  const durationMs = Date.now() - start;

  const stats = calculateStats(results, name, method, CONCURRENCY, durationMs);

  // Print results
  console.log(`\n   Results:`);
  console.log(`   ├─ Success Rate: ${100 - stats.errorRate}%`);
  console.log(`   ├─ Error Rate: ${stats.errorRate}%`);
  console.log(`   ├─ Requests/sec: ${stats.requestsPerSecond}`);
  console.log(`   ├─ Latency (min/avg/max): ${stats.minLatencyMs}/${stats.avgLatencyMs}/${stats.maxLatencyMs}ms`);
  console.log(`   └─ Latency (p50/p95/p99): ${stats.p50LatencyMs}/${stats.p95LatencyMs}/${stats.p99LatencyMs}ms`);

  // Check thresholds
  if (stats.errorRate > 1) {
    console.log(`   ⚠️  Error rate exceeds 1% target`);
  }
  if (stats.p95LatencyMs > 2000) {
    console.log(`   ⚠️  p95 latency exceeds 2000ms target`);
  }

  return stats;
}

async function main() {
  console.log('='.repeat(70));
  console.log('PHASE 1 VALIDATION - LOAD TEST');
  console.log('='.repeat(70));
  console.log(`Environment: ${BASE_URL}`);
  console.log(`Concurrency Level: ${CONCURRENCY}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const allResults: LoadTestResult[] = [];

  // Test 1: Health endpoint (baseline)
  allResults.push(await runLoadTest(
    'Health Check',
    `${BASE_URL}/api/health`
  ));

  // Test 2: Vertical Config (cached)
  allResults.push(await runLoadTest(
    'Vertical Config (Banking/EB/UAE)',
    `${BASE_URL}/api/admin/vertical-config?vertical=banking&subVertical=employee-banking&region=UAE`
  ));

  // Test 3: Discovery endpoint
  allResults.push(await runLoadTest(
    'Discovery API',
    `${BASE_URL}/api/os/discovery`,
    'POST',
    { tenant_id: 'load-test', region_code: 'UAE', vertical_id: 'banking' }
  ));

  // Test 4: Status endpoint
  allResults.push(await runLoadTest(
    'Status Check',
    `${BASE_URL}/api/status`
  ));

  // Summary Report
  console.log('\n' + '='.repeat(70));
  console.log('LOAD TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nConcurrency: ${CONCURRENCY} users\n`);

  console.log('| Endpoint                     | Success | p95 (ms) | RPS    | Status |');
  console.log('|------------------------------|---------|----------|--------|--------|');

  let allPass = true;
  for (const result of allResults) {
    const successRate = 100 - result.errorRate;
    const status = result.errorRate <= 1 && result.p95LatencyMs <= 2000 ? '✅ PASS' : '❌ FAIL';
    if (status.includes('FAIL')) allPass = false;

    const name = result.endpoint.padEnd(28).substring(0, 28);
    const success = `${successRate}%`.padStart(7);
    const p95 = `${result.p95LatencyMs}`.padStart(8);
    const rps = `${result.requestsPerSecond}`.padStart(6);

    console.log(`| ${name} | ${success} | ${p95} | ${rps} | ${status} |`);
  }

  console.log('\n' + '='.repeat(70));
  if (allPass) {
    console.log('🟢 LOAD TEST RESULT: PASS - All endpoints within thresholds');
  } else {
    console.log('🟡 LOAD TEST RESULT: ISSUES - Some endpoints exceeded thresholds');
  }
  console.log('='.repeat(70) + '\n');

  // Return results for further processing
  return allResults;
}

main().catch(console.error);
