/**
 * Validation Module
 * Part of User & Enterprise Management Program v1.1
 * Phase H - End-to-End Validation
 *
 * Exports all validation functionality.
 */

// Enterprise Flow Validation (S326)
export {
  validateEnterpriseSchema,
  validateEnterpriseColumns,
  validateUserFlow,
  validateWorkspaceFlow,
  validateInvitationFlow,
  validateEnterpriseFlow,
  enterpriseValidation,
} from './enterprise-flow';

export type {
  ValidationResult,
  ValidationCheck,
} from './enterprise-flow';

// Multi-Workspace Flow Validation (S327)
export {
  validateWorkspaceIsolation,
  validateWorkspaceMembers,
  validateDefaultWorkspace,
  validateWorkspaceSwitching,
  validateMultiWorkspaceFlow,
  multiWorkspaceValidation,
} from './multi-workspace-flow';

// Demo Flow Validation (S328)
export {
  validateDemoPolicies,
  validateDemoEnterpriseFields,
  validateDemoExpiration,
  validateDemoSampleData,
  validateDemoConversion,
  validateDemoFlow,
  demoValidation,
} from './demo-flow';

// =============================================================================
// COMPLETE VALIDATION
// =============================================================================

import { validateEnterpriseFlow } from './enterprise-flow';
import { validateMultiWorkspaceFlow } from './multi-workspace-flow';
import { validateDemoFlow } from './demo-flow';
import type { ValidationResult, ValidationCheck } from './enterprise-flow';

/**
 * Run all validations for User & Enterprise Management Program
 */
export async function validateAllFlows(): Promise<{
  enterprise: ValidationResult;
  multiWorkspace: ValidationResult;
  demo: ValidationResult;
  overall: ValidationResult;
}> {
  const enterprise = await validateEnterpriseFlow();
  const multiWorkspace = await validateMultiWorkspaceFlow();
  const demo = await validateDemoFlow();

  // Combine all checks for overall result
  const allChecks: ValidationCheck[] = [
    ...enterprise.checks,
    ...multiWorkspace.checks,
    ...demo.checks,
  ];

  const passed = allChecks.filter((c) => c.status === 'pass').length;
  const failed = allChecks.filter((c) => c.status === 'fail').length;
  const warnings = allChecks.filter((c) => c.status === 'warning').length;

  const overall: ValidationResult = {
    passed: failed === 0,
    checks: allChecks,
    summary: {
      total: allChecks.length,
      passed,
      failed,
      warnings,
    },
  };

  return {
    enterprise,
    multiWorkspace,
    demo,
    overall,
  };
}

/**
 * Generate validation report
 */
export function generateValidationReport(results: Awaited<ReturnType<typeof validateAllFlows>>): string {
  const lines: string[] = [];

  lines.push('═'.repeat(70));
  lines.push('USER & ENTERPRISE MANAGEMENT - VALIDATION REPORT');
  lines.push('═'.repeat(70));
  lines.push('');

  // Overall summary
  lines.push('OVERALL RESULT: ' + (results.overall.passed ? '✅ PASSED' : '❌ FAILED'));
  lines.push(`Total Checks: ${results.overall.summary.total}`);
  lines.push(`  Passed: ${results.overall.summary.passed}`);
  lines.push(`  Failed: ${results.overall.summary.failed}`);
  lines.push(`  Warnings: ${results.overall.summary.warnings}`);
  lines.push('');

  // Section results
  const sections = [
    { name: 'Enterprise Flow', result: results.enterprise },
    { name: 'Multi-Workspace Flow', result: results.multiWorkspace },
    { name: 'Demo Flow', result: results.demo },
  ];

  for (const section of sections) {
    lines.push('─'.repeat(70));
    lines.push(`${section.name}: ${section.result.passed ? '✅' : '❌'}`);
    lines.push(`  Passed: ${section.result.summary.passed}/${section.result.summary.total}`);

    // Show failures and warnings
    const issues = section.result.checks.filter((c) => c.status !== 'pass');
    if (issues.length > 0) {
      for (const issue of issues) {
        const icon = issue.status === 'fail' ? '❌' : '⚠️';
        lines.push(`  ${icon} ${issue.name}: ${issue.message}`);
      }
    }
  }

  lines.push('─'.repeat(70));
  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// CERTIFICATION (S329)
// =============================================================================

export {
  runCertification,
  isCertified,
  certification,
} from './certification';

export type {
  CertificationResult,
  ModuleStatus,
} from './certification';
