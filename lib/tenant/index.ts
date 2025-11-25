/**
 * Tenant Isolation Module
 *
 * Multi-tenant data isolation and security.
 */

// Types
export type {
  TenantContext,
  IsolationPolicy,
  IsolationRule,
  IsolationCondition,
  ResourceType,
  RateLimitConfig,
  RateLimitRule,
  RateLimitStatus,
  ActivityBoundary,
  BoundaryRule,
  BoundaryMetric,
  AlertThreshold,
  TenantQueryOptions,
  TenantQueryResult,
} from './types';

// Re-export workspace types
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

// Tenant Context
export {
  setTenantContext,
  getTenantContext,
  clearTenantContext,
  requireTenantContext,
  createTenantContext,
  withTenantContext,
  createTenantQueryOptions,
  hasTenantPermission,
  getTenantRegion,
  getTenantIsolationLevel,
} from './tenant-context';

// Isolation Policy
export {
  DEFAULT_ISOLATION_POLICIES,
  isActionAllowed,
  filterByIsolation,
  addTenantContext,
  getTenantWhereClause,
  validateTenantOwnership,
} from './isolation-policy';

// API Keys
export {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  createApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
  getApiKeyById,
  apiKeyHasPermission,
  API_KEY_SCOPE_PRESETS,
} from './api-keys';

// Rate Limiting
export {
  DEFAULT_RATE_LIMITS,
  checkRateLimit,
  consumeRateLimit,
  getRateLimitHeaders,
  resetTenantRateLimits,
  getAllRateLimitStatus,
  rateLimitMiddleware,
} from './rate-limiter';

// Activity Boundaries
export {
  PLAN_BOUNDARIES,
  DEFAULT_ALERT_THRESHOLDS,
  checkBoundary,
  trackActivity,
  isActivityAllowed,
  getAllBoundaryStatus,
  resetActivityCounters,
  getUsageSummary,
} from './activity-boundary';
