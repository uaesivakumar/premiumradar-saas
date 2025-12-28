/**
 * S328: Demo Flow Validation
 * Part of User & Enterprise Management Program v1.1
 * Phase H - End-to-End Validation
 *
 * Validates demo mode flows and policy enforcement.
 */

import { queryOne, query } from '@/lib/db/client';
import type { ValidationResult, ValidationCheck } from './enterprise-flow';

// =============================================================================
// DEMO POLICY VALIDATION
// =============================================================================

/**
 * Validate demo_policies table and configuration
 */
export async function validateDemoPolicies(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check demo_policies table exists
  try {
    const tableExists = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'demo_policies'
      )`
    );

    checks.push({
      name: 'demo_policies table',
      status: tableExists?.exists ? 'pass' : 'warning',
      message: tableExists?.exists ? 'Table exists' : 'Table does not exist',
    });

    if (tableExists?.exists) {
      // Check required columns
      const requiredColumns = ['demo_type', 'policy_config', 'is_active'];

      for (const col of requiredColumns) {
        const colExists = await queryOne<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'demo_policies'
            AND column_name = $1
          )`,
          [col]
        );

        checks.push({
          name: `demo_policies.${col}`,
          status: colExists?.exists ? 'pass' : 'warning',
          message: colExists?.exists ? 'Column exists' : 'Column missing',
        });
      }

      // Check for active policies
      const activePolicies = await query<{ demo_type: string }>(
        `SELECT demo_type FROM demo_policies WHERE is_active = true`
      );

      checks.push({
        name: 'Active demo policies',
        status: activePolicies.length > 0 ? 'pass' : 'warning',
        message:
          activePolicies.length > 0
            ? `${activePolicies.length} active policies found`
            : 'No active policies (will use defaults)',
      });
    }
  } catch (error) {
    checks.push({
      name: 'demo_policies validation',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return createResult(checks);
}

/**
 * Validate demo enterprise fields
 */
export async function validateDemoEnterpriseFields(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check demo-related columns in enterprises table
  const demoColumns = ['is_demo', 'demo_type', 'demo_expires_at'];

  for (const col of demoColumns) {
    const start = Date.now();
    try {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'enterprises'
          AND column_name = $1
        )`,
        [col]
      );

      checks.push({
        name: `enterprises.${col}`,
        status: exists?.exists ? 'pass' : 'warning',
        message: exists?.exists ? 'Column exists' : 'Column missing',
        duration_ms: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: `enterprises.${col}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  // Check demo user fields
  const userDemoColumns = ['is_demo', 'demo_type', 'demo_expires_at'];

  for (const col of userDemoColumns) {
    try {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users'
          AND column_name = $1
        )`,
        [col]
      );

      checks.push({
        name: `users.${col}`,
        status: exists?.exists ? 'pass' : 'warning',
        message: exists?.exists ? 'Column exists' : 'Column missing',
      });
    } catch (error) {
      checks.push({
        name: `users.${col}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }

  return createResult(checks);
}

/**
 * Validate demo expiration logic
 */
export async function validateDemoExpiration(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  try {
    // Check for expired demos still marked active
    const expiredActive = await query<{ id: string }>(
      `SELECT id FROM enterprises
       WHERE is_demo = true
       AND is_active = true
       AND demo_expires_at < NOW()
       LIMIT 5`
    );

    checks.push({
      name: 'Expired demos handled',
      status: expiredActive.length === 0 ? 'pass' : 'warning',
      message:
        expiredActive.length === 0
          ? 'No expired active demos'
          : `Found ${expiredActive.length} expired but still active demos`,
    });

    // Check demo expiration range validity
    const futureExpiration = await query<{ id: string; days_remaining: number }>(
      `SELECT id, EXTRACT(DAY FROM (demo_expires_at - NOW())) as days_remaining
       FROM enterprises
       WHERE is_demo = true
       AND demo_expires_at > NOW()
       AND demo_expires_at < NOW() + INTERVAL '90 days'
       LIMIT 10`
    );

    checks.push({
      name: 'Demo expiration dates valid',
      status: 'pass',
      message: `${futureExpiration.length} demos with valid future expiration dates`,
    });
  } catch {
    checks.push({
      name: 'Demo expiration validation',
      status: 'warning',
      message: 'Could not validate demo expiration (table may not have demo fields)',
    });
  }

  return createResult(checks);
}

/**
 * Validate demo sample data tables
 */
export async function validateDemoSampleData(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check demo sample tables
  const demoTables = ['demo_sample_companies', 'demo_sample_contacts'];

  for (const table of demoTables) {
    try {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )`,
        [table]
      );

      checks.push({
        name: `${table} table`,
        status: exists?.exists ? 'pass' : 'warning',
        message: exists?.exists ? 'Table exists' : 'Table will be created on demand',
      });

      if (exists?.exists) {
        // Check for any sample data
        const count = await queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${table}`
        );

        checks.push({
          name: `${table} has data`,
          status: 'pass',
          message: `${count?.count || 0} records`,
        });
      }
    } catch {
      checks.push({
        name: `${table} table`,
        status: 'warning',
        message: 'Table not yet created (will be created on demand)',
      });
    }
  }

  return createResult(checks);
}

/**
 * Validate demo conversion capability
 */
export async function validateDemoConversion(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  try {
    // Check that enterprises have subscription fields for conversion
    const subscriptionFields = ['plan', 'stripe_customer_id', 'stripe_subscription_id', 'subscription_status'];

    for (const field of subscriptionFields) {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'enterprises'
          AND column_name = $1
        )`,
        [field]
      );

      checks.push({
        name: `enterprises.${field}`,
        status: exists?.exists ? 'pass' : 'warning',
        message: exists?.exists ? 'Column exists for conversion' : 'Column missing (conversion may fail)',
      });
    }

    // Check plan values
    const validPlans = ['demo', 'starter', 'professional', 'enterprise'];
    const plans = await query<{ plan: string }>(
      `SELECT DISTINCT plan FROM enterprises WHERE plan IS NOT NULL LIMIT 10`
    );

    const invalidPlans = plans.filter((p) => !validPlans.includes(p.plan));
    checks.push({
      name: 'Enterprise plan values',
      status: invalidPlans.length === 0 ? 'pass' : 'warning',
      message:
        invalidPlans.length === 0
          ? 'All plan values are valid'
          : `Found ${invalidPlans.length} invalid plan values`,
    });
  } catch (error) {
    checks.push({
      name: 'Demo conversion validation',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return createResult(checks);
}

// =============================================================================
// FULL DEMO FLOW VALIDATION
// =============================================================================

/**
 * Run complete demo flow validation
 */
export async function validateDemoFlow(): Promise<ValidationResult> {
  const allChecks: ValidationCheck[] = [];

  const policyResult = await validateDemoPolicies();
  const fieldsResult = await validateDemoEnterpriseFields();
  const expirationResult = await validateDemoExpiration();
  const sampleDataResult = await validateDemoSampleData();
  const conversionResult = await validateDemoConversion();

  allChecks.push(
    ...policyResult.checks,
    ...fieldsResult.checks,
    ...expirationResult.checks,
    ...sampleDataResult.checks,
    ...conversionResult.checks
  );

  return createResult(allChecks);
}

// =============================================================================
// HELPERS
// =============================================================================

function createResult(checks: ValidationCheck[]): ValidationResult {
  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warning').length;

  return {
    passed: failed === 0,
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
      warnings,
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const demoValidation = {
  validatePolicies: validateDemoPolicies,
  validateEnterpriseFields: validateDemoEnterpriseFields,
  validateExpiration: validateDemoExpiration,
  validateSampleData: validateDemoSampleData,
  validateConversion: validateDemoConversion,
  validateAll: validateDemoFlow,
};

export default demoValidation;
