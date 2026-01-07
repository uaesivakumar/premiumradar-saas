/**
 * S368: PII Encryption Validation Script
 *
 * F1 Re-validation Test
 * Verifies that no plain-text PII exists in the database.
 *
 * Usage:
 *   npx tsx scripts/validate-pii-encryption.ts
 *
 * Exit codes:
 *   0 = PASS (no plain-text PII found)
 *   1 = FAIL (plain-text PII detected)
 */

import { query, queryOne } from '../lib/db/client';
import { piiVault } from '../lib/security/pii-vault';

interface ValidationResult {
  test: string;
  passed: boolean;
  details: string;
}

async function validatePIIEncryption(): Promise<boolean> {
  const results: ValidationResult[] = [];

  console.log('========================================');
  console.log('S368: PII ENCRYPTION VALIDATION (F1)');
  console.log('========================================');
  console.log('');

  // Test 1: Check PII vault configuration
  console.log('Test 1: PII Vault Configuration...');
  try {
    const configCheck = await piiVault.verifyConfiguration();
    results.push({
      test: 'PII Vault Configuration',
      passed: configCheck.valid,
      details: configCheck.valid
        ? 'Encryption key configured and working'
        : `Error: ${configCheck.error}`,
    });
  } catch (error) {
    results.push({
      test: 'PII Vault Configuration',
      passed: false,
      details: `Exception: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  // Test 2: Check for plain-text email column
  console.log('Test 2: Plain-text email column...');
  const emailColumnCheck = await queryOne<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads'
      AND column_name = 'contact_email'
      AND data_type IN ('text', 'character varying')
    ) as exists
  `);
  results.push({
    test: 'Plain-text email column removed',
    passed: !emailColumnCheck?.exists,
    details: emailColumnCheck?.exists
      ? 'FAIL: contact_email column still exists'
      : 'contact_email column removed',
  });

  // Test 3: Check for plain-text phone column
  console.log('Test 3: Plain-text phone column...');
  const phoneColumnCheck = await queryOne<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads'
      AND column_name = 'contact_phone'
      AND data_type IN ('text', 'character varying')
    ) as exists
  `);
  results.push({
    test: 'Plain-text phone column removed',
    passed: !phoneColumnCheck?.exists,
    details: phoneColumnCheck?.exists
      ? 'FAIL: contact_phone column still exists'
      : 'contact_phone column removed',
  });

  // Test 4: Check for plain-text name column
  console.log('Test 4: Plain-text name column...');
  const nameColumnCheck = await queryOne<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads'
      AND column_name = 'contact_name'
      AND data_type IN ('text', 'character varying')
    ) as exists
  `);
  results.push({
    test: 'Plain-text name column removed',
    passed: !nameColumnCheck?.exists,
    details: nameColumnCheck?.exists
      ? 'FAIL: contact_name column still exists'
      : 'contact_name column removed',
  });

  // Test 5: Check encrypted columns exist
  console.log('Test 5: Encrypted columns exist...');
  const encryptedColumnsCheck = await query<{ column_name: string }>(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name LIKE 'contact_%_encrypted'
  `);
  const encryptedColumns = encryptedColumnsCheck.map(c => c.column_name);
  const expectedColumns = ['contact_email_encrypted', 'contact_phone_encrypted', 'contact_name_encrypted'];
  const hasAllEncryptedColumns = expectedColumns.every(c => encryptedColumns.includes(c));
  results.push({
    test: 'Encrypted columns exist',
    passed: hasAllEncryptedColumns,
    details: hasAllEncryptedColumns
      ? `Found: ${encryptedColumns.join(', ')}`
      : `Missing: ${expectedColumns.filter(c => !encryptedColumns.includes(c)).join(', ')}`,
  });

  // Test 6: Check hash columns exist
  console.log('Test 6: Hash columns exist...');
  const hashColumnsCheck = await query<{ column_name: string }>(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name LIKE 'contact_%_hash'
  `);
  const hashColumns = hashColumnsCheck.map(c => c.column_name);
  const expectedHashColumns = ['contact_email_hash', 'contact_phone_hash', 'contact_name_hash'];
  const hasAllHashColumns = expectedHashColumns.every(c => hashColumns.includes(c));
  results.push({
    test: 'Hash columns exist',
    passed: hasAllHashColumns,
    details: hasAllHashColumns
      ? `Found: ${hashColumns.join(', ')}`
      : `Missing: ${expectedHashColumns.filter(c => !hashColumns.includes(c)).join(', ')}`,
  });

  // Test 7: Check all leads are encrypted
  console.log('Test 7: All leads encrypted...');
  const unencryptedCount = await queryOne<{ count: string }>(`
    SELECT COUNT(*) as count FROM leads WHERE pii_encrypted = false
  `);
  const unencrypted = parseInt(unencryptedCount?.count || '0');
  results.push({
    test: 'All leads encrypted',
    passed: unencrypted === 0,
    details: unencrypted === 0
      ? 'All leads have pii_encrypted = true'
      : `FAIL: ${unencrypted} leads still have pii_encrypted = false`,
  });

  // Test 8: Verify encryption format (sample check)
  console.log('Test 8: Encryption format valid...');
  const sampleLead = await queryOne<{ contact_email_encrypted: string }>(`
    SELECT contact_email_encrypted FROM leads
    WHERE contact_email_encrypted IS NOT NULL
    LIMIT 1
  `);
  let formatValid = false;
  let formatDetails = 'No encrypted data to check';
  if (sampleLead?.contact_email_encrypted) {
    const parts = sampleLead.contact_email_encrypted.split(':');
    formatValid = parts.length === 4; // salt:iv:authTag:ciphertext
    formatDetails = formatValid
      ? 'Encryption format valid (salt:iv:authTag:ciphertext)'
      : `FAIL: Invalid format, expected 4 parts, got ${parts.length}`;
  }
  results.push({
    test: 'Encryption format valid',
    passed: formatValid || !sampleLead?.contact_email_encrypted,
    details: formatDetails,
  });

  // Test 9: Check no raw PII in any text column (sample)
  console.log('Test 9: No email patterns in non-PII columns...');
  const emailPatternCheck = await queryOne<{ count: string }>(`
    SELECT COUNT(*) as count FROM leads
    WHERE company ~ '@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
       OR role ~ '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
    LIMIT 10
  `);
  const emailLeaks = parseInt(emailPatternCheck?.count || '0');
  results.push({
    test: 'No email patterns in non-PII columns',
    passed: emailLeaks === 0,
    details: emailLeaks === 0
      ? 'No email patterns found in company or role columns'
      : `WARNING: Found ${emailLeaks} potential email leaks in other columns`,
  });

  // Print results
  console.log('');
  console.log('========================================');
  console.log('VALIDATION RESULTS');
  console.log('========================================');

  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.test}`);
    console.log(`       ${result.details}`);
    if (!result.passed) {
      allPassed = false;
    }
  }

  console.log('');
  console.log('========================================');
  if (allPassed) {
    console.log('F1 VALIDATION: ✅ PASSED');
    console.log('No plain-text PII detected.');
  } else {
    console.log('F1 VALIDATION: ❌ FAILED');
    console.log('Plain-text PII still exists.');
  }
  console.log('========================================');

  return allPassed;
}

// Run validation
validatePIIEncryption()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
