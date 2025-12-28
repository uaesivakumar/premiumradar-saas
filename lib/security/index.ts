/**
 * Integrated Security Pipeline (Sprint S1 Complete)
 *
 * Combines all Sprint S1 components into a unified security layer:
 * 1. Input Sanitization (prompt firewall)
 * 2. Jailbreak detection
 * 3. RAG isolation
 * 4. Output leakage filter
 * 5. LLM guardrails
 * 6. Public persona mask
 *
 * This is the ONLY way to process user inputs and AI responses safely.
 */

import { sanitizePrompt, SanitizationResult } from './prompt-firewall';
import { isolateQuery, validateResponse, IsolationResult } from './rag-isolation';
import { filterOutput, FilterResult } from './output-filter';
import { applyGuardrails, wrapQueryWithSafety, GuardrailResult } from './llm-guardrails';

export interface SecureQueryRequest {
  userInput: string;
  namespace?: string; // For RAG queries
  queryContext?: string; // Additional context for guardrails
}

export interface SecureQueryResult {
  approved: boolean;
  processedInput?: {
    sanitized: string;
    systemPrompt: string;
    userQuery: string;
  };
  blockReason?: string;
  securityReport: {
    inputSanitization: SanitizationResult;
    ragIsolation: IsolationResult;
    overallThreatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface SecureResponseResult {
  approved: boolean;
  safeResponse: string;
  securityReport: {
    outputFilter: FilterResult;
    guardrails: GuardrailResult;
    overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Integrated Security Pipeline
 */
class SecurityPipeline {
  /**
   * Process user input through all security layers
   * Returns processed input ready for LLM, or blocks if unsafe
   */
  secureQuery(request: SecureQueryRequest): SecureQueryResult {
    const { userInput, namespace, queryContext } = request;

    // Layer 1: Prompt Firewall (Input Sanitization + Jailbreak Detection)
    const sanitizationResult = sanitizePrompt(userInput);

    // Block if critical threat detected
    if (sanitizationResult.isBlocked) {
      return {
        approved: false,
        blockReason: sanitizationResult.blockReason,
        securityReport: {
          inputSanitization: sanitizationResult,
          ragIsolation: {
            isAllowed: false,
            rewrittenQuery: '',
            blockedReason: 'Blocked at sanitization layer',
            appliedFilters: [],
          },
          overallThreatLevel: sanitizationResult.threatLevel,
        },
      };
    }

    // Layer 2: RAG Isolation
    const isolationResult = isolateQuery(sanitizationResult.sanitizedInput, namespace);

    // Block if RAG isolation fails
    if (!isolationResult.isAllowed) {
      return {
        approved: false,
        blockReason: isolationResult.blockedReason,
        securityReport: {
          inputSanitization: sanitizationResult,
          ragIsolation: isolationResult,
          overallThreatLevel: 'high',
        },
      };
    }

    // Layer 3: Wrap with safety guardrails
    const { systemPrompt, userQuery } = wrapQueryWithSafety(isolationResult.rewrittenQuery);

    // Calculate overall threat level
    const overallThreatLevel = this.calculateOverallThreatLevel([
      sanitizationResult.threatLevel,
      'none', // RAG isolation passed
    ]);

    return {
      approved: true,
      processedInput: {
        sanitized: isolationResult.rewrittenQuery,
        systemPrompt,
        userQuery,
      },
      securityReport: {
        inputSanitization: sanitizationResult,
        ragIsolation: isolationResult,
        overallThreatLevel,
      },
    };
  }

  /**
   * Process LLM response through all security layers
   * Returns safe response ready to send to user, or blocks if leakage detected
   */
  secureResponse(llmResponse: string, queryContext?: string): SecureResponseResult {
    // Layer 1: Output Leakage Filter
    const filterResult = filterOutput(llmResponse);

    // Layer 2: LLM Guardrails + Persona Mask
    const guardrailResult = applyGuardrails(
      filterResult.filteredOutput,
      queryContext
    );

    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(
      filterResult.severity,
      guardrailResult.violationsDetected.length
    );

    // Determine final approved status
    const approved = filterResult.isClean && guardrailResult.approved;

    return {
      approved,
      safeResponse: approved ? guardrailResult.maskedResponse : '',
      securityReport: {
        outputFilter: filterResult,
        guardrails: guardrailResult,
        overallRisk,
      },
    };
  }

  /**
   * Full pipeline: Process query AND response
   * Use this for complete request/response cycle
   */
  async secureConversation(
    userInput: string,
    llmFunction: (systemPrompt: string, userQuery: string) => Promise<string>,
    options?: {
      namespace?: string;
      queryContext?: string;
    }
  ): Promise<{
    success: boolean;
    response?: string;
    error?: string;
    securityReport: {
      query: SecureQueryResult['securityReport'];
      response?: SecureResponseResult['securityReport'];
    };
  }> {
    // Step 1: Secure the input query
    const queryResult = this.secureQuery({
      userInput,
      namespace: options?.namespace,
      queryContext: options?.queryContext,
    });

    if (!queryResult.approved) {
      return {
        success: false,
        error: queryResult.blockReason || 'Security check failed',
        securityReport: {
          query: queryResult.securityReport,
        },
      };
    }

    try {
      // Step 2: Call LLM with secured input
      const llmResponse = await llmFunction(
        queryResult.processedInput!.systemPrompt,
        queryResult.processedInput!.userQuery
      );

      // Step 3: Secure the output response
      const responseResult = this.secureResponse(llmResponse, options?.queryContext);

      if (!responseResult.approved) {
        return {
          success: false,
          error: 'Response failed security validation',
          securityReport: {
            query: queryResult.securityReport,
            response: responseResult.securityReport,
          },
        };
      }

      return {
        success: true,
        response: responseResult.safeResponse,
        securityReport: {
          query: queryResult.securityReport,
          response: responseResult.securityReport,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LLM call failed',
        securityReport: {
          query: queryResult.securityReport,
        },
      };
    }
  }

  /**
   * Calculate overall threat level from multiple layers
   */
  private calculateOverallThreatLevel(
    levels: Array<'none' | 'low' | 'medium' | 'high' | 'critical'>
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (levels.includes('critical')) return 'critical';
    if (levels.includes('high')) return 'high';
    if (levels.includes('medium')) return 'medium';
    if (levels.includes('low')) return 'low';
    return 'none';
  }

  /**
   * Calculate overall risk from output filtering
   */
  private calculateOverallRisk(
    filterSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical',
    violationCount: number
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (filterSeverity === 'critical' || violationCount >= 5) return 'critical';
    if (filterSeverity === 'high' || violationCount >= 3) return 'high';
    if (filterSeverity === 'medium' || violationCount >= 2) return 'medium';
    if (filterSeverity === 'low' || violationCount >= 1) return 'low';
    return 'none';
  }

  /**
   * Get combined security statistics from all layers
   */
  getSecurityStatistics(): {
    totalThreatsBlocked: number;
    totalLeaksRedacted: number;
    threatBreakdown: Record<string, number>;
    leakBreakdown: Record<string, number>;
  } {
    // This would aggregate stats from all security layers
    // For now, returning placeholder structure
    return {
      totalThreatsBlocked: 0,
      totalLeaksRedacted: 0,
      threatBreakdown: {},
      leakBreakdown: {},
    };
  }
}

// Singleton instance
export const securityPipeline = new SecurityPipeline();

// Re-export individual components for advanced use cases
export {
  // Prompt Firewall
  sanitizePrompt,
  createPromptFirewall,
  type SanitizationResult,
  type PromptFirewallConfig,
} from './prompt-firewall';

export {
  // RAG Isolation
  isolateQuery,
  validateResponse,
  createSafeContext,
  createRAGIsolation,
  type IsolationResult,
  type RAGIsolationConfig,
} from './rag-isolation';

export {
  // Output Filter
  filterOutput,
  strictFilterOutput,
  createOutputFilter,
  type FilterResult,
  type OutputFilterConfig,
} from './output-filter';

export {
  // LLM Guardrails
  applyGuardrails,
  wrapQueryWithSafety,
  generateSafeResponse,
  createLLMGuardrails,
  type GuardrailResult,
  type GuardrailConfig,
} from './llm-guardrails';

/**
 * Convenience functions for common use cases
 */

// Quick query validation
export function isQuerySafe(input: string): boolean {
  const result = securityPipeline.secureQuery({ userInput: input });
  return result.approved;
}

// Quick response validation
export function isResponseSafe(output: string): boolean {
  const result = securityPipeline.secureResponse(output);
  return result.approved;
}

// Process full conversation
export async function secureConversation(
  userInput: string,
  llmFunction: (systemPrompt: string, userQuery: string) => Promise<string>,
  options?: {
    namespace?: string;
    queryContext?: string;
  }
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  const result = await securityPipeline.secureConversation(userInput, llmFunction, options);
  return {
    success: result.success,
    response: result.response,
    error: result.error,
  };
}

// =============================================================================
// Enterprise Security (S321-S325)
// =============================================================================

// Enterprise Audit (S322)
export {
  logAuditEvent,
  getAuditLogs,
  audit,
} from './enterprise-audit';

export type {
  AuditEventType,
  AuditSeverity,
  AuditEntry,
  AuditLogOptions,
} from './enterprise-audit';

// Enterprise Guards (S323)
export {
  getGuardContext,
  hasRoleLevel,
  requireAuth,
  requireRole,
  requireEnterprise,
  requireEnterpriseAccess,
  requireWorkspaceAccess,
  requireEnterpriseAdmin,
  requireSuperAdmin,
  requireNonDemo,
  requireActiveEnterprise,
  canManageUsers,
  canManageWorkspaces,
  canAccessEnterpriseSettings,
  canExportData,
  runGuards,
  guards,
} from './enterprise-guards';

export type {
  EnterpriseRole,
  GuardContext,
  GuardResult,
} from './enterprise-guards';

// Session Security (S324)
export {
  getSessionConfig,
  createSessionRecord,
  validateSession,
  updateSessionActivity,
  invalidateSession,
  invalidateAllUserSessions,
  invalidateAllEnterpriseSessions,
  getUserActiveSessions,
  cleanupExpiredSessions,
  checkSuspiciousActivity,
  recordSuspiciousActivity,
  sessionSecurity,
} from './enterprise-session';

export type {
  SessionInfo,
  SessionSecurityConfig,
} from './enterprise-session';

// Permission Matrix (S325)
export {
  hasPermission,
  getPermissionConditions,
  getRolePermissions,
  canAccessResource,
  getAllowedActions,
  roleContains,
  getAdditionalPermissions,
  getPermissionSummary,
  getAccessibleResources,
  getRoleFeatureFlags,
  permissions,
} from './permission-matrix';

export type {
  ResourceType,
  ActionType,
  Permission,
  PermissionCondition,
  PermissionCheckResult,
} from './permission-matrix';
