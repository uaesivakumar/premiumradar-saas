/**
 * Tenant Isolation Types
 *
 * Types for multi-tenant data isolation and security.
 */

// Re-export shared types from workspace
export type {
  Tenant,
  TenantStatus,
  TenantQuotas,
  IsolationLevel,
  DataRegion,
  ApiKey,
  ApiKeyStatus,
  ActivityLog,
  ActivityAction,
} from '../workspace/types';

// ============================================================
// TENANT CONTEXT
// ============================================================

export interface TenantContext {
  tenantId: string;
  workspaceId: string;
  userId: string;
  isolationLevel: import('../workspace/types').IsolationLevel;
  region: import('../workspace/types').DataRegion;
  permissions: string[];
}

// ============================================================
// ISOLATION POLICY
// ============================================================

export interface IsolationPolicy {
  id: string;
  name: string;
  rules: IsolationRule[];
  priority: number;
  enabled: boolean;
}

export interface IsolationRule {
  resource: ResourceType;
  action: 'allow' | 'deny';
  conditions: IsolationCondition[];
}

export type ResourceType =
  | 'companies'
  | 'contacts'
  | 'outreach'
  | 'analytics'
  | 'exports'
  | 'api_keys'
  | 'settings';

export interface IsolationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'matches';
  value: string | string[];
}

// ============================================================
// RATE LIMITING
// ============================================================

export interface RateLimitConfig {
  tenantId: string;
  limits: RateLimitRule[];
  burstAllowed: boolean;
  burstMultiplier: number;
}

export interface RateLimitRule {
  endpoint: string;
  windowMs: number;
  maxRequests: number;
  skipFailedRequests: boolean;
}

export interface RateLimitStatus {
  tenantId: string;
  endpoint: string;
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}

// ============================================================
// ACTIVITY BOUNDARY
// ============================================================

export interface ActivityBoundary {
  tenantId: string;
  boundaries: BoundaryRule[];
  alertThresholds: AlertThreshold[];
}

export interface BoundaryRule {
  metric: BoundaryMetric;
  limit: number;
  period: 'hour' | 'day' | 'week' | 'month';
  action: 'warn' | 'block' | 'notify';
}

export type BoundaryMetric =
  | 'api_calls'
  | 'exports'
  | 'searches'
  | 'outreach_sent'
  | 'storage_mb'
  | 'active_users';

export interface AlertThreshold {
  metric: BoundaryMetric;
  warningPercent: number;
  criticalPercent: number;
  notifyEmails: string[];
}

// ============================================================
// TENANT QUERY CONTEXT
// ============================================================

export interface TenantQueryOptions {
  tenantId: string;
  includeDeleted?: boolean;
  bypassCache?: boolean;
  auditLog?: boolean;
}

export interface TenantQueryResult<T> {
  data: T;
  tenantId: string;
  cached: boolean;
  queryTime: number;
}
