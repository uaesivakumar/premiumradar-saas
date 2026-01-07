/**
 * S368: PII Encryption Performance Benchmark
 *
 * Measures encryption/decryption overhead.
 * Target: <10ms per operation.
 *
 * Usage:
 *   npx tsx scripts/benchmark-pii-encryption.ts
 */

import { piiVault } from '../lib/security/pii-vault';

interface BenchmarkResult {
  operation: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
}

async function runBenchmark(
  name: string,
  iterations: number,
  fn: () => Promise<void>
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < 10; i++) {
    await fn();
  }

  // Benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  const totalMs = times.reduce((a, b) => a + b, 0);
  const avgMs = totalMs / iterations;
  const minMs = Math.min(...times);
  const maxMs = Math.max(...times);
  const opsPerSec = 1000 / avgMs;

  return {
    operation: name,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    opsPerSec,
  };
}

async function main() {
  const ITERATIONS = 1000;
  const testTenantId = 'benchmark-tenant';
  const testEmail = 'john.smith@examplecorp.com';
  const testPhone = '+1 (555) 123-4567';
  const testName = 'John Alexander Smith III';

  console.log('========================================');
  console.log('S368: PII ENCRYPTION PERFORMANCE BENCHMARK');
  console.log('========================================');
  console.log(`Iterations: ${ITERATIONS}`);
  console.log(`Target: <10ms per operation`);
  console.log('');

  // Verify configuration
  const configCheck = await piiVault.verifyConfiguration();
  if (!configCheck.valid) {
    console.error('ERROR: PII Vault not configured');
    process.exit(1);
  }

  const results: BenchmarkResult[] = [];

  // Benchmark: Encrypt email
  console.log('Running: Encrypt email...');
  results.push(await runBenchmark('Encrypt email', ITERATIONS, async () => {
    await piiVault.encrypt(testTenantId, testEmail);
  }));

  // Benchmark: Decrypt email
  const encryptedEmail = await piiVault.encrypt(testTenantId, testEmail);
  console.log('Running: Decrypt email...');
  results.push(await runBenchmark('Decrypt email', ITERATIONS, async () => {
    await piiVault.decrypt(testTenantId, encryptedEmail);
  }));

  // Benchmark: Hash email
  console.log('Running: Hash email...');
  results.push(await runBenchmark('Hash email', ITERATIONS, async () => {
    piiVault.hashEmail(testEmail);
  }));

  // Benchmark: Encrypt phone
  console.log('Running: Encrypt phone...');
  results.push(await runBenchmark('Encrypt phone', ITERATIONS, async () => {
    await piiVault.encrypt(testTenantId, testPhone);
  }));

  // Benchmark: Hash phone
  console.log('Running: Hash phone...');
  results.push(await runBenchmark('Hash phone', ITERATIONS, async () => {
    piiVault.hashPhone(testPhone);
  }));

  // Benchmark: Encrypt name
  console.log('Running: Encrypt name...');
  results.push(await runBenchmark('Encrypt name', ITERATIONS, async () => {
    await piiVault.encrypt(testTenantId, testName);
  }));

  // Benchmark: Encrypt all PII (typical lead)
  console.log('Running: Encrypt all PII (typical lead)...');
  results.push(await runBenchmark('Encrypt all PII', ITERATIONS, async () => {
    await piiVault.encryptFields(testTenantId, {
      email: testEmail,
      phone: testPhone,
      name: testName,
    });
  }));

  // Benchmark: Decrypt all PII (typical lead)
  const encryptedAll = await piiVault.encryptFields(testTenantId, {
    email: testEmail,
    phone: testPhone,
    name: testName,
  });
  console.log('Running: Decrypt all PII (typical lead)...');
  results.push(await runBenchmark('Decrypt all PII', ITERATIONS, async () => {
    await piiVault.decryptFields(testTenantId, encryptedAll);
  }));

  // Benchmark: Generate dedup hashes
  console.log('Running: Generate dedup hashes...');
  results.push(await runBenchmark('Generate dedup hashes', ITERATIONS, async () => {
    piiVault.generateDedupHashes({
      email: testEmail,
      phone: testPhone,
      name: testName,
    });
  }));

  // Print results
  console.log('');
  console.log('========================================');
  console.log('BENCHMARK RESULTS');
  console.log('========================================');
  console.log('');
  console.log('| Operation            | Avg (ms) | Min (ms) | Max (ms) | Ops/sec |');
  console.log('|----------------------|----------|----------|----------|---------|');

  let allUnderTarget = true;
  for (const result of results) {
    const status = result.avgMs < 10 ? '' : ' ⚠️';
    if (result.avgMs >= 10) {
      allUnderTarget = false;
    }
    console.log(
      `| ${result.operation.padEnd(20)} | ${result.avgMs.toFixed(3).padStart(8)} | ${result.minMs.toFixed(3).padStart(8)} | ${result.maxMs.toFixed(3).padStart(8)} | ${result.opsPerSec.toFixed(0).padStart(7)} |${status}`
    );
  }

  console.log('');
  console.log('========================================');
  if (allUnderTarget) {
    console.log('PERFORMANCE: ✅ PASSED');
    console.log('All operations under 10ms target.');
  } else {
    console.log('PERFORMANCE: ⚠️ WARNING');
    console.log('Some operations exceed 10ms target.');
  }
  console.log('========================================');

  // Calculate overhead for typical operations
  const encryptAllResult = results.find(r => r.operation === 'Encrypt all PII');
  const decryptAllResult = results.find(r => r.operation === 'Decrypt all PII');

  console.log('');
  console.log('LATENCY IMPACT ON LEAD OPERATIONS:');
  console.log(`  Intake (encrypt): +${encryptAllResult?.avgMs.toFixed(2) || 'N/A'}ms`);
  console.log(`  Display (decrypt): +${decryptAllResult?.avgMs.toFixed(2) || 'N/A'}ms`);
  console.log('');
}

main().catch(console.error);
