/**
 * S327: Multi-Workspace Flow Validation
 * Part of User & Enterprise Management Program v1.1
 * Phase H - End-to-End Validation
 *
 * Validates multi-workspace scenarios and data isolation.
 */

import { queryOne, query } from '@/lib/db/client';
import type { ValidationResult, ValidationCheck } from './enterprise-flow';

// =============================================================================
// WORKSPACE ISOLATION VALIDATION
// =============================================================================

/**
 * Validate workspace data isolation
 */
export async function validateWorkspaceIsolation(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check that workspace-scoped tables have workspace_id column
  const workspaceScopedTables = [
    'discoveries',
    'campaigns',
    'templates',
    'evidence_packs',
  ];

  for (const table of workspaceScopedTables) {
    const start = Date.now();
    try {
      // First check if table exists
      const tableExists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )`,
        [table]
      );

      if (!tableExists?.exists) {
        checks.push({
          name: `Table ${table} exists`,
          status: 'warning',
          message: 'Table does not exist yet',
          duration_ms: Date.now() - start,
        });
        continue;
      }

      // Check for workspace_id or enterprise_id column
      const hasWorkspaceId = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1
          AND column_name IN ('workspace_id', 'enterprise_id')
        )`,
        [table]
      );

      checks.push({
        name: `${table} has isolation column`,
        status: hasWorkspaceId?.exists ? 'pass' : 'warning',
        message: hasWorkspaceId?.exists
          ? 'Has workspace/enterprise scope column'
          : 'Missing isolation column',
        duration_ms: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: `${table} isolation check`,
        status: 'fail',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        duration_ms: Date.now() - start,
      });
    }
  }

  return createResult(checks);
}

/**
 * Validate workspace member relationships
 */
export async function validateWorkspaceMembers(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check workspace_members table structure
  try {
    const tableExists = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'workspace_members'
      )`
    );

    checks.push({
      name: 'workspace_members table',
      status: tableExists?.exists ? 'pass' : 'warning',
      message: tableExists?.exists ? 'Table exists' : 'Table does not exist',
    });

    if (tableExists?.exists) {
      // Check required columns
      const requiredColumns = ['workspace_id', 'user_id', 'role', 'joined_at'];

      for (const col of requiredColumns) {
        const colExists = await queryOne<{ exists: boolean }>(
          `SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'workspace_members'
            AND column_name = $1
          )`,
          [col]
        );

        checks.push({
          name: `workspace_members.${col}`,
          status: colExists?.exists ? 'pass' : 'warning',
          message: colExists?.exists ? 'Column exists' : 'Column missing',
        });
      }

      // Check unique constraint on (workspace_id, user_id)
      const uniqueExists = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM pg_indexes
          WHERE tablename = 'workspace_members'
          AND indexdef LIKE '%workspace_id%'
          AND indexdef LIKE '%user_id%'
        )`
      );

      checks.push({
        name: 'workspace_members unique index',
        status: uniqueExists?.exists ? 'pass' : 'warning',
        message: uniqueExists?.exists
          ? 'Unique index exists'
          : 'May need unique index on (workspace_id, user_id)',
      });
    }
  } catch (error) {
    checks.push({
      name: 'workspace_members validation',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return createResult(checks);
}

/**
 * Validate default workspace logic
 */
export async function validateDefaultWorkspace(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  try {
    // Check that is_default column exists
    const isDefaultExists = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'workspaces'
        AND column_name = 'is_default'
      )`
    );

    checks.push({
      name: 'workspaces.is_default column',
      status: isDefaultExists?.exists ? 'pass' : 'warning',
      message: isDefaultExists?.exists ? 'Column exists' : 'Column missing',
    });

    if (isDefaultExists?.exists) {
      // Check for enterprises with multiple default workspaces (data issue)
      const multipleDefaults = await query<{ enterprise_id: string; count: string }>(
        `SELECT enterprise_id, COUNT(*) as count
         FROM workspaces
         WHERE is_default = true
         GROUP BY enterprise_id
         HAVING COUNT(*) > 1
         LIMIT 5`
      );

      checks.push({
        name: 'Single default workspace per enterprise',
        status: multipleDefaults.length === 0 ? 'pass' : 'warning',
        message:
          multipleDefaults.length === 0
            ? 'All enterprises have at most one default workspace'
            : `Found ${multipleDefaults.length} enterprises with multiple defaults`,
      });
    }
  } catch (error) {
    checks.push({
      name: 'Default workspace validation',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return createResult(checks);
}

/**
 * Validate workspace switching capability
 */
export async function validateWorkspaceSwitching(): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];

  // Check that users can be associated with workspaces
  try {
    const userWorkspaceCol = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'workspace_id'
      )`
    );

    checks.push({
      name: 'users.workspace_id column',
      status: userWorkspaceCol?.exists ? 'pass' : 'warning',
      message: userWorkspaceCol?.exists
        ? 'Users can have workspace assignment'
        : 'Missing workspace assignment column',
    });

    // Check workspace FK relationship
    const workspaceFk = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'users'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'workspaces'
      )`
    );

    checks.push({
      name: 'users FK to workspaces',
      status: workspaceFk?.exists ? 'pass' : 'warning',
      message: workspaceFk?.exists ? 'Foreign key exists' : 'Foreign key may be missing',
    });
  } catch (error) {
    checks.push({
      name: 'Workspace switching validation',
      status: 'fail',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    });
  }

  return createResult(checks);
}

// =============================================================================
// FULL MULTI-WORKSPACE VALIDATION
// =============================================================================

/**
 * Run complete multi-workspace validation
 */
export async function validateMultiWorkspaceFlow(): Promise<ValidationResult> {
  const allChecks: ValidationCheck[] = [];

  const isolationResult = await validateWorkspaceIsolation();
  const membersResult = await validateWorkspaceMembers();
  const defaultResult = await validateDefaultWorkspace();
  const switchingResult = await validateWorkspaceSwitching();

  allChecks.push(
    ...isolationResult.checks,
    ...membersResult.checks,
    ...defaultResult.checks,
    ...switchingResult.checks
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

export const multiWorkspaceValidation = {
  validateIsolation: validateWorkspaceIsolation,
  validateMembers: validateWorkspaceMembers,
  validateDefault: validateDefaultWorkspace,
  validateSwitching: validateWorkspaceSwitching,
  validateAll: validateMultiWorkspaceFlow,
};

export default multiWorkspaceValidation;
