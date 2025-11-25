/**
 * Tenant Context
 *
 * Manages tenant context for request-scoped isolation.
 */

import type { TenantContext, TenantQueryOptions } from './types';
import type { IsolationLevel, DataRegion } from '../workspace/types';

// AsyncLocalStorage for request-scoped tenant context
// In production, this would use Node.js AsyncLocalStorage
let currentContext: TenantContext | null = null;

/**
 * Set the tenant context for the current request
 */
export function setTenantContext(context: TenantContext): void {
  currentContext = context;
}

/**
 * Get the current tenant context
 */
export function getTenantContext(): TenantContext | null {
  return currentContext;
}

/**
 * Clear the tenant context (end of request)
 */
export function clearTenantContext(): void {
  currentContext = null;
}

/**
 * Require tenant context (throws if not set)
 */
export function requireTenantContext(): TenantContext {
  if (!currentContext) {
    throw new Error('Tenant context not set. Ensure middleware is configured.');
  }
  return currentContext;
}

/**
 * Create tenant context from user session
 */
export function createTenantContext(params: {
  tenantId: string;
  workspaceId: string;
  userId: string;
  isolationLevel?: IsolationLevel;
  region?: DataRegion;
  permissions?: string[];
}): TenantContext {
  return {
    tenantId: params.tenantId,
    workspaceId: params.workspaceId,
    userId: params.userId,
    isolationLevel: params.isolationLevel || 'shared',
    region: params.region || 'uae',
    permissions: params.permissions || [],
  };
}

/**
 * Execute function within tenant context
 */
export async function withTenantContext<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  const previousContext = currentContext;

  try {
    setTenantContext(context);
    return await fn();
  } finally {
    if (previousContext) {
      setTenantContext(previousContext);
    } else {
      clearTenantContext();
    }
  }
}

/**
 * Create query options with tenant isolation
 */
export function createTenantQueryOptions(
  overrides?: Partial<TenantQueryOptions>
): TenantQueryOptions {
  const context = requireTenantContext();

  return {
    tenantId: context.tenantId,
    includeDeleted: false,
    bypassCache: false,
    auditLog: true,
    ...overrides,
  };
}

/**
 * Check if current context has permission
 */
export function hasTenantPermission(permission: string): boolean {
  const context = getTenantContext();
  if (!context) return false;
  return context.permissions.includes(permission);
}

/**
 * Get data region for current tenant
 */
export function getTenantRegion(): DataRegion {
  const context = getTenantContext();
  return context?.region || 'uae';
}

/**
 * Get isolation level for current tenant
 */
export function getTenantIsolationLevel(): IsolationLevel {
  const context = getTenantContext();
  return context?.isolationLevel || 'shared';
}
