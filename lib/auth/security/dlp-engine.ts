/**
 * DLP Engine - Sprint S49
 * Data Loss Prevention for enterprise security
 *
 * Features:
 * - PII detection
 * - Sensitive data monitoring
 * - Bulk export controls
 * - Real-time violation logging
 */

import {
  DLPPolicy,
  DLPRule,
  DLPRuleType,
  DLPAction,
  DLPViolation,
} from './types';

// Default DLP policies
const DEFAULT_DLP_POLICIES: DLPPolicy[] = [
  {
    id: 'dlp_default',
    name: 'Default Enterprise DLP',
    enabled: true,
    rules: [
      {
        id: 'pii_email',
        type: 'pii_detection',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        enabled: true,
      },
      {
        id: 'pii_phone',
        type: 'pii_detection',
        pattern: '\\+?[1-9]\\d{1,14}|\\(\\d{3}\\)\\s*\\d{3}-\\d{4}',
        enabled: true,
      },
      {
        id: 'bulk_export',
        type: 'bulk_export',
        threshold: 1000, // More than 1000 records
        enabled: true,
      },
      {
        id: 'download_limit',
        type: 'download_limit',
        threshold: 10, // Max 10 exports per day
        enabled: true,
      },
    ],
    actions: ['log', 'warn'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// In-memory store for policies and violations (use database in production)
const policyStore = new Map<string, DLPPolicy[]>();
const violationStore: DLPViolation[] = [];
const exportCountStore = new Map<string, { count: number; date: string }>();

/**
 * Get DLP policies for a tenant
 */
export function getDLPPolicies(tenantId: string): DLPPolicy[] {
  return policyStore.get(tenantId) || DEFAULT_DLP_POLICIES;
}

/**
 * Set DLP policies for a tenant
 */
export function setDLPPolicies(tenantId: string, policies: DLPPolicy[]): void {
  policyStore.set(tenantId, policies);
}

/**
 * Check content against DLP rules
 */
export function checkDLP(
  tenantId: string,
  userId: string,
  content: string | Record<string, unknown>,
  action: string
): { allowed: boolean; violations: DLPViolation[] } {
  const policies = getDLPPolicies(tenantId);
  const violations: DLPViolation[] = [];
  let blocked = false;

  for (const policy of policies) {
    if (!policy.enabled) continue;

    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      const violation = evaluateRule(rule, content, action, tenantId, userId);

      if (violation) {
        violations.push(violation);

        // Determine if we should block
        if (policy.actions.includes('block')) {
          blocked = true;
          violation.blocked = true;
        }

        // Store violation
        violationStore.push(violation);
      }
    }
  }

  return {
    allowed: !blocked,
    violations,
  };
}

/**
 * Evaluate a single DLP rule
 */
function evaluateRule(
  rule: DLPRule,
  content: string | Record<string, unknown>,
  action: string,
  tenantId: string,
  userId: string
): DLPViolation | null {
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

  switch (rule.type) {
    case 'pii_detection':
      if (rule.pattern) {
        const regex = new RegExp(rule.pattern, 'gi');
        const matches = contentStr.match(regex);
        if (matches && matches.length > 0) {
          return createViolation(tenantId, userId, rule, action, {
            matchCount: matches.length,
            pattern: rule.pattern,
          });
        }
      }
      break;

    case 'sensitive_keywords':
      if (rule.pattern) {
        const keywords = rule.pattern.split(',').map(k => k.trim().toLowerCase());
        const lower = contentStr.toLowerCase();
        const found = keywords.filter(k => lower.includes(k));
        if (found.length > 0) {
          return createViolation(tenantId, userId, rule, action, {
            matchedKeywords: found,
          });
        }
      }
      break;

    case 'bulk_export':
      if (rule.threshold && typeof content === 'object') {
        const recordCount = Array.isArray(content) ? content.length : 1;
        if (recordCount > rule.threshold) {
          return createViolation(tenantId, userId, rule, action, {
            recordCount,
            threshold: rule.threshold,
          });
        }
      }
      break;

    case 'download_limit':
      if (rule.threshold) {
        const key = `${tenantId}:${userId}`;
        const today = new Date().toISOString().split('T')[0];
        const current = exportCountStore.get(key);

        if (current && current.date === today) {
          if (current.count >= rule.threshold) {
            return createViolation(tenantId, userId, rule, action, {
              currentCount: current.count,
              dailyLimit: rule.threshold,
            });
          }
          current.count++;
        } else {
          exportCountStore.set(key, { count: 1, date: today });
        }
      }
      break;
  }

  return null;
}

/**
 * Create a DLP violation record
 */
function createViolation(
  tenantId: string,
  userId: string,
  rule: DLPRule,
  action: string,
  data: Record<string, unknown>
): DLPViolation {
  return {
    id: `dlp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId,
    userId,
    ruleId: rule.id,
    ruleType: rule.type,
    action,
    data,
    blocked: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get DLP violations for a tenant
 */
export function getDLPViolations(
  tenantId: string,
  options?: {
    userId?: string;
    ruleType?: DLPRuleType;
    startDate?: string;
    endDate?: string;
    blocked?: boolean;
  }
): DLPViolation[] {
  let violations = violationStore.filter(v => v.tenantId === tenantId);

  if (options?.userId) {
    violations = violations.filter(v => v.userId === options.userId);
  }

  if (options?.ruleType) {
    violations = violations.filter(v => v.ruleType === options.ruleType);
  }

  if (options?.startDate) {
    violations = violations.filter(v => v.timestamp >= options.startDate!);
  }

  if (options?.endDate) {
    violations = violations.filter(v => v.timestamp <= options.endDate!);
  }

  if (options?.blocked !== undefined) {
    violations = violations.filter(v => v.blocked === options.blocked);
  }

  return violations;
}

/**
 * Check if export is allowed
 */
export function checkExportAllowed(
  tenantId: string,
  userId: string,
  recordCount: number
): { allowed: boolean; reason?: string } {
  const result = checkDLP(tenantId, userId, { records: recordCount }, 'export');

  if (!result.allowed) {
    const violation = result.violations[0];
    return {
      allowed: false,
      reason: `DLP policy violation: ${violation.ruleType}`,
    };
  }

  return { allowed: true };
}

/**
 * Sanitize content by removing sensitive data
 */
export function sanitizeContent(
  content: string,
  rules: DLPRule[]
): string {
  let sanitized = content;

  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern) continue;

    if (rule.type === 'pii_detection') {
      const regex = new RegExp(rule.pattern, 'gi');
      sanitized = sanitized.replace(regex, '[REDACTED]');
    }
  }

  return sanitized;
}

/**
 * Create custom DLP policy
 */
export function createDLPPolicy(
  tenantId: string,
  name: string,
  rules: DLPRule[],
  actions: DLPAction[]
): DLPPolicy {
  const policy: DLPPolicy = {
    id: `dlp_${Date.now()}`,
    name,
    enabled: true,
    rules,
    actions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = policyStore.get(tenantId) || [];
  policyStore.set(tenantId, [...existing, policy]);

  return policy;
}

export default {
  getDLPPolicies,
  setDLPPolicies,
  checkDLP,
  getDLPViolations,
  checkExportAllowed,
  sanitizeContent,
  createDLPPolicy,
};
