/**
 * Isolation Policy Engine
 *
 * Enforces data isolation policies between tenants.
 */

import type {
  IsolationPolicy,
  IsolationRule,
  IsolationCondition,
  ResourceType,
} from './types';
import { getTenantContext } from './tenant-context';

// ============================================================
// DEFAULT POLICIES
// ============================================================

export const DEFAULT_ISOLATION_POLICIES: IsolationPolicy[] = [
  {
    id: 'pol_default_tenant_isolation',
    name: 'Default Tenant Isolation',
    priority: 100,
    enabled: true,
    rules: [
      {
        resource: 'companies',
        action: 'allow',
        conditions: [{ field: 'tenant_id', operator: 'equals', value: '{{tenant_id}}' }],
      },
      {
        resource: 'contacts',
        action: 'allow',
        conditions: [{ field: 'tenant_id', operator: 'equals', value: '{{tenant_id}}' }],
      },
      {
        resource: 'outreach',
        action: 'allow',
        conditions: [{ field: 'tenant_id', operator: 'equals', value: '{{tenant_id}}' }],
      },
      {
        resource: 'analytics',
        action: 'allow',
        conditions: [{ field: 'tenant_id', operator: 'equals', value: '{{tenant_id}}' }],
      },
      {
        resource: 'exports',
        action: 'allow',
        conditions: [{ field: 'tenant_id', operator: 'equals', value: '{{tenant_id}}' }],
      },
      {
        resource: 'api_keys',
        action: 'allow',
        conditions: [{ field: 'tenant_id', operator: 'equals', value: '{{tenant_id}}' }],
      },
      {
        resource: 'settings',
        action: 'allow',
        conditions: [{ field: 'tenant_id', operator: 'equals', value: '{{tenant_id}}' }],
      },
    ],
  },
  {
    id: 'pol_region_restriction',
    name: 'Regional Data Restriction',
    priority: 90,
    enabled: true,
    rules: [
      {
        resource: 'companies',
        action: 'allow',
        conditions: [{ field: 'data_region', operator: 'in', value: ['{{region}}', 'global'] }],
      },
    ],
  },
];

// ============================================================
// POLICY ENGINE
// ============================================================

/**
 * Check if action is allowed by isolation policies
 */
export function isActionAllowed(
  resource: ResourceType,
  record: Record<string, unknown>,
  policies: IsolationPolicy[] = DEFAULT_ISOLATION_POLICIES
): boolean {
  const context = getTenantContext();
  if (!context) return false;

  // Sort policies by priority (higher first)
  const sortedPolicies = [...policies]
    .filter((p) => p.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const policy of sortedPolicies) {
    for (const rule of policy.rules) {
      if (rule.resource !== resource) continue;

      const conditionsMet = rule.conditions.every((condition) =>
        evaluateCondition(condition, record, context)
      );

      if (conditionsMet) {
        return rule.action === 'allow';
      }
    }
  }

  // Default deny if no policy matches
  return false;
}

/**
 * Evaluate a single isolation condition
 */
function evaluateCondition(
  condition: IsolationCondition,
  record: Record<string, unknown>,
  context: { tenantId: string; region: string }
): boolean {
  const fieldValue = record[condition.field];
  let conditionValue = condition.value;

  // Replace template variables
  if (typeof conditionValue === 'string') {
    conditionValue = conditionValue
      .replace('{{tenant_id}}', context.tenantId)
      .replace('{{region}}', context.region);
  } else if (Array.isArray(conditionValue)) {
    conditionValue = conditionValue.map((v) =>
      v.replace('{{tenant_id}}', context.tenantId).replace('{{region}}', context.region)
    );
  }

  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue;

    case 'not_equals':
      return fieldValue !== conditionValue;

    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue as string);

    case 'not_in':
      return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue as string);

    case 'matches':
      if (typeof fieldValue !== 'string' || typeof conditionValue !== 'string') {
        return false;
      }
      return new RegExp(conditionValue).test(fieldValue);

    default:
      return false;
  }
}

/**
 * Filter records by isolation policies
 */
export function filterByIsolation<T extends Record<string, unknown>>(
  records: T[],
  resource: ResourceType,
  policies: IsolationPolicy[] = DEFAULT_ISOLATION_POLICIES
): T[] {
  return records.filter((record) => isActionAllowed(resource, record, policies));
}

/**
 * Add tenant context to a new record
 */
export function addTenantContext<T extends Record<string, unknown>>(record: T): T {
  const context = getTenantContext();
  if (!context) {
    throw new Error('Cannot add tenant context: no context set');
  }

  return {
    ...record,
    tenant_id: context.tenantId,
    workspace_id: context.workspaceId,
    data_region: context.region,
    created_by: context.userId,
  };
}

/**
 * Create tenant-scoped WHERE clause for database queries
 */
export function getTenantWhereClause(): { tenant_id: string; workspace_id: string } {
  const context = getTenantContext();
  if (!context) {
    throw new Error('Cannot create WHERE clause: no tenant context');
  }

  return {
    tenant_id: context.tenantId,
    workspace_id: context.workspaceId,
  };
}

/**
 * Validate record belongs to current tenant
 */
export function validateTenantOwnership(record: { tenant_id?: string }): boolean {
  const context = getTenantContext();
  if (!context) return false;
  return record.tenant_id === context.tenantId;
}
