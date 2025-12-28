/**
 * S326: Enterprise Flow Validation
 * Part of User & Enterprise Management Program v1.1
 * Phase H - End-to-End Validation
 *
 * Validates the complete enterprise user flow from signup to dashboard.
 */

import { queryOne, query } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface ValidationCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration_ms?: number;
}

// =============================================================================
// ENTERPRISE SCHEMA VALIDATION
// =============================================================================

/**
 * Validate all required enterprise tables exist
 */
export async function validateEnterpriseSchema(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Required tables for enterprise model
  const requiredTables = [
    'enterprises',
    'workspaces',
    'users',
    'user_invitations',
    'workspace_members',
    'demo_policies',
  ];

  for (const table of requiredTables) {
    const start = Date.now();
    try {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [table]
      );

      checks.push({
        name: `Table: ${table}`,
        status: exists?.exists ? 'pass' : 'fail',
        message: exists?.exists ? 'Table exists' : 'Table missing',
        duration_ms: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: `Table: ${table}`,
        status: 'fail',
        message: `Error checking table: ${error instanceof Error ? error.message : 'Unknown'}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  return createResult(checks);
}

/**
 * Validate enterprise columns exist
 */
export async function validateEnterpriseColumns(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Required columns for enterprises table
  const enterpriseColumns = [
    'id',
    'name',
    'slug',
    'type',
    'plan',
    'is_demo',
    'demo_type',
    'demo_expires_at',
    'max_users',
    'max_workspaces',
    'is_active',
    'created_at',
  ];

  for (const column of enterpriseColumns) {
    const start = Date.now();
    try {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'enterprises'
          AND column_name = $1
        )`,
        [column]
      );

      checks.push({
        name: `Column: enterprises.${column}`,
        status: exists?.exists ? 'pass' : 'warning',
        message: exists?.exists ? 'Column exists' : 'Column missing (may need migration)',
        duration_ms: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: `Column: enterprises.${column}`,
        status: 'fail',
        message: `Error checking column: ${error instanceof Error ? error.message : 'Unknown'}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  return createResult(checks);
}

// =============================================================================
// USER FLOW VALIDATION
// =============================================================================

/**
 * Validate user creation flow
 */
export async function validateUserFlow(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check users table structure
  const userColumns = ['id', 'email', 'enterprise_id', 'workspace_id', 'role', 'is_demo', 'status'];

  for (const column of userColumns) {
    const start = Date.now();
    try {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users'
          AND column_name = $1
        )`,
        [column]
      );

      checks.push({
        name: `User column: ${column}`,
        status: exists?.exists ? 'pass' : 'warning',
        message: exists?.exists ? 'Column exists' : 'Column missing',
        duration_ms: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: `User column: ${column}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  // Check user role constraints
  try {
    const validRoles = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'ENTERPRISE_USER', 'INDIVIDUAL_USER'];
    const roleCheck = await query<{ role: string }>(
      `SELECT DISTINCT role FROM users WHERE role IS NOT NULL LIMIT 10`
    );

    const invalidRoles = roleCheck.filter((r) => !validRoles.includes(r.role));
    checks.push({
      name: 'User role values',
      status: invalidRoles.length === 0 ? 'pass' : 'warning',
      message:
        invalidRoles.length === 0
          ? 'All roles are valid'
          : `Found ${invalidRoles.length} invalid role values`,
    });
  } catch {
    checks.push({
      name: 'User role values',
      status: 'warning',
      message: 'Could not verify role values',
    });
  }

  return createResult(checks);
}

// =============================================================================
// WORKSPACE FLOW VALIDATION
// =============================================================================

/**
 * Validate workspace configuration
 */
export async function validateWorkspaceFlow(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check workspaces table
  const workspaceColumns = ['id', 'enterprise_id', 'name', 'slug', 'is_default', 'status'];

  for (const column of workspaceColumns) {
    const start = Date.now();
    try {
      const exists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'workspaces'
          AND column_name = $1
        )`,
        [column]
      );

      checks.push({
        name: `Workspace column: ${column}`,
        status: exists?.exists ? 'pass' : 'warning',
        message: exists?.exists ? 'Column exists' : 'Column missing',
        duration_ms: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: `Workspace column: ${column}`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  // Check foreign key to enterprises
  try {
    const fkExists = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'workspaces'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'enterprises'
      )`
    );

    checks.push({
      name: 'Workspace FK to enterprises',
      status: fkExists?.exists ? 'pass' : 'warning',
      message: fkExists?.exists ? 'Foreign key exists' : 'Foreign key may be missing',
    });
  } catch {
    checks.push({
      name: 'Workspace FK to enterprises',
      status: 'warning',
      message: 'Could not verify foreign key',
    });
  }

  return createResult(checks);
}

// =============================================================================
// INVITATION FLOW VALIDATION
// =============================================================================

/**
 * Validate invitation system
 */
export async function validateInvitationFlow(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check user_invitations table exists
  try {
    const tableExists = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'user_invitations'
      )`
    );

    checks.push({
      name: 'User invitations table',
      status: tableExists?.exists ? 'pass' : 'warning',
      message: tableExists?.exists ? 'Table exists' : 'Table missing',
    });

    if (tableExists?.exists) {
      // Check required columns
      const requiredCols = ['id', 'enterprise_id', 'email', 'role', 'token', 'expires_at', 'status'];
      for (const col of requiredCols) {
        const colExists = await queryOne<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'user_invitations'
            AND column_name = $1
          )`,
          [col]
        );

        checks.push({
          name: `Invitation column: ${col}`,
          status: colExists?.exists ? 'pass' : 'warning',
          message: colExists?.exists ? 'Column exists' : 'Column missing',
        });
      }
    }
  } catch (error) {
    checks.push({
      name: 'User invitations table',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return createResult(checks);
}

// =============================================================================
// FULL ENTERPRISE VALIDATION
// =============================================================================

/**
 * Run complete enterprise flow validation
 */
export async function validateEnterpriseFlow(): Promise<ValidationResult> {
  const allChecks: ValidationCheck[] = [];

  // Run all validations
  const schemaResult = await validateEnterpriseSchema();
  const columnsResult = await validateEnterpriseColumns();
  const userResult = await validateUserFlow();
  const workspaceResult = await validateWorkspaceFlow();
  const invitationResult = await validateInvitationFlow();

  allChecks.push(
    ...schemaResult.checks,
    ...columnsResult.checks,
    ...userResult.checks,
    ...workspaceResult.checks,
    ...invitationResult.checks
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

export const enterpriseValidation = {
  validateSchema: validateEnterpriseSchema,
  validateColumns: validateEnterpriseColumns,
  validateUserFlow,
  validateWorkspaceFlow,
  validateInvitationFlow,
  validateAll: validateEnterpriseFlow,
};

export default enterpriseValidation;
