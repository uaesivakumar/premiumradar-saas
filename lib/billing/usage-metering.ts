/**
 * Usage Metering Service - Sprint S142.3
 *
 * Track and enforce usage limits per plan:
 * - siva_call
 * - discovery_run
 * - enrichment_lookup
 * - signal_fetch
 * - qtle_compute
 */

// ============================================================
// TYPES
// ============================================================

export type UsageType =
  | 'siva_call'
  | 'discovery_run'
  | 'enrichment_lookup'
  | 'signal_fetch'
  | 'qtle_compute';

export type PlanType = 'free' | 'starter' | 'professional' | 'enterprise';

export interface UsageLogEntry {
  id: string;
  user_id: string;
  tenant_id: string;
  usage_type: UsageType;
  quantity: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  tenant_id: string;
  period_start: string;
  period_end: string;
  usage: Record<UsageType, number>;
  limits: Record<UsageType, number>;
  remaining: Record<UsageType, number>;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  usage: number;
  limit: number;
  remaining: number;
  percentUsed: number;
}

// ============================================================
// PLAN LIMITS
// ============================================================

export const PLAN_LIMITS: Record<PlanType, Record<UsageType, number>> = {
  free: {
    siva_call: 100,
    discovery_run: 10,
    enrichment_lookup: 50,
    signal_fetch: 100,
    qtle_compute: 50,
  },
  starter: {
    siva_call: 1000,
    discovery_run: 100,
    enrichment_lookup: 500,
    signal_fetch: 1000,
    qtle_compute: 500,
  },
  professional: {
    siva_call: 10000,
    discovery_run: 1000,
    enrichment_lookup: 5000,
    signal_fetch: 10000,
    qtle_compute: 5000,
  },
  enterprise: {
    siva_call: -1, // Unlimited
    discovery_run: -1,
    enrichment_lookup: -1,
    signal_fetch: -1,
    qtle_compute: -1,
  },
};

// Alert thresholds (percentage)
const USAGE_ALERT_THRESHOLDS = {
  WARNING: 80,
  CRITICAL: 95,
};

// In-memory store (use database in production)
const usageLog: UsageLogEntry[] = [];

// ============================================================
// USAGE LOGGING
// ============================================================

/**
 * Log a usage event
 */
export function logUsage(
  userId: string,
  tenantId: string,
  usageType: UsageType,
  quantity: number = 1,
  metadata?: Record<string, unknown>
): UsageLogEntry {
  const entry: UsageLogEntry = {
    id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    tenant_id: tenantId,
    usage_type: usageType,
    quantity,
    timestamp: new Date().toISOString(),
    metadata,
  };

  usageLog.push(entry);

  // In production: Insert into database
  // await db.usage_log.create(entry)

  return entry;
}

/**
 * Get usage for a tenant in current billing period
 */
export function getTenantUsage(
  tenantId: string,
  periodStart?: Date,
  periodEnd?: Date
): Record<UsageType, number> {
  // Default to current month
  const start = periodStart || getMonthStart();
  const end = periodEnd || new Date();

  const usage: Record<UsageType, number> = {
    siva_call: 0,
    discovery_run: 0,
    enrichment_lookup: 0,
    signal_fetch: 0,
    qtle_compute: 0,
  };

  for (const entry of usageLog) {
    if (entry.tenant_id !== tenantId) continue;

    const entryDate = new Date(entry.timestamp);
    if (entryDate < start || entryDate > end) continue;

    usage[entry.usage_type] += entry.quantity;
  }

  return usage;
}

/**
 * Get user usage in current billing period
 */
export function getUserUsage(
  userId: string,
  periodStart?: Date,
  periodEnd?: Date
): Record<UsageType, number> {
  const start = periodStart || getMonthStart();
  const end = periodEnd || new Date();

  const usage: Record<UsageType, number> = {
    siva_call: 0,
    discovery_run: 0,
    enrichment_lookup: 0,
    signal_fetch: 0,
    qtle_compute: 0,
  };

  for (const entry of usageLog) {
    if (entry.user_id !== userId) continue;

    const entryDate = new Date(entry.timestamp);
    if (entryDate < start || entryDate > end) continue;

    usage[entry.usage_type] += entry.quantity;
  }

  return usage;
}

// ============================================================
// USAGE ENFORCEMENT
// ============================================================

/**
 * Check if usage is allowed based on plan limits
 */
export function checkUsageAllowed(
  tenantId: string,
  plan: PlanType,
  usageType: UsageType,
  quantity: number = 1
): UsageCheckResult {
  const limit = PLAN_LIMITS[plan][usageType];
  const currentUsage = getTenantUsage(tenantId)[usageType];

  // Unlimited (-1) always allowed
  if (limit === -1) {
    return {
      allowed: true,
      usage: currentUsage,
      limit: -1,
      remaining: -1,
      percentUsed: 0,
    };
  }

  const projectedUsage = currentUsage + quantity;
  const remaining = limit - currentUsage;
  const percentUsed = (currentUsage / limit) * 100;

  if (projectedUsage > limit) {
    return {
      allowed: false,
      reason: `Usage limit exceeded. Current: ${currentUsage}, Limit: ${limit}`,
      usage: currentUsage,
      limit,
      remaining: Math.max(0, remaining),
      percentUsed,
    };
  }

  return {
    allowed: true,
    usage: currentUsage,
    limit,
    remaining,
    percentUsed,
  };
}

/**
 * Get full usage summary for a tenant
 */
export function getUsageSummary(
  tenantId: string,
  plan: PlanType
): UsageSummary {
  const periodStart = getMonthStart();
  const periodEnd = new Date();
  const usage = getTenantUsage(tenantId, periodStart, periodEnd);
  const limits = PLAN_LIMITS[plan];

  const remaining: Record<UsageType, number> = {
    siva_call: 0,
    discovery_run: 0,
    enrichment_lookup: 0,
    signal_fetch: 0,
    qtle_compute: 0,
  };

  for (const type of Object.keys(usage) as UsageType[]) {
    remaining[type] = limits[type] === -1 ? -1 : Math.max(0, limits[type] - usage[type]);
  }

  return {
    tenant_id: tenantId,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    usage,
    limits,
    remaining,
  };
}

// ============================================================
// USAGE ALERTS
// ============================================================

export interface UsageAlert {
  tenant_id: string;
  usage_type: UsageType;
  level: 'warning' | 'critical';
  percentUsed: number;
  message: string;
  timestamp: string;
}

/**
 * Check for usage alerts
 */
export function checkUsageAlerts(
  tenantId: string,
  plan: PlanType
): UsageAlert[] {
  const alerts: UsageAlert[] = [];
  const usage = getTenantUsage(tenantId);
  const limits = PLAN_LIMITS[plan];

  for (const type of Object.keys(usage) as UsageType[]) {
    const limit = limits[type];

    // Skip unlimited
    if (limit === -1) continue;

    const percentUsed = (usage[type] / limit) * 100;

    if (percentUsed >= USAGE_ALERT_THRESHOLDS.CRITICAL) {
      alerts.push({
        tenant_id: tenantId,
        usage_type: type,
        level: 'critical',
        percentUsed,
        message: `${type} usage is at ${percentUsed.toFixed(1)}% of limit`,
        timestamp: new Date().toISOString(),
      });
    } else if (percentUsed >= USAGE_ALERT_THRESHOLDS.WARNING) {
      alerts.push({
        tenant_id: tenantId,
        usage_type: type,
        level: 'warning',
        percentUsed,
        message: `${type} usage is at ${percentUsed.toFixed(1)}% of limit`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Get start of current month
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Format usage type for display
 */
export function formatUsageType(type: UsageType): string {
  const labels: Record<UsageType, string> = {
    siva_call: 'SIVA Calls',
    discovery_run: 'Discovery Runs',
    enrichment_lookup: 'Enrichment Lookups',
    signal_fetch: 'Signal Fetches',
    qtle_compute: 'QTLE Computations',
  };
  return labels[type];
}

/**
 * Get usage log entries (for audit)
 */
export function getUsageLog(
  filter?: {
    tenantId?: string;
    userId?: string;
    usageType?: UsageType;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100
): UsageLogEntry[] {
  let entries = [...usageLog];

  if (filter?.tenantId) {
    entries = entries.filter((e) => e.tenant_id === filter.tenantId);
  }

  if (filter?.userId) {
    entries = entries.filter((e) => e.user_id === filter.userId);
  }

  if (filter?.usageType) {
    entries = entries.filter((e) => e.usage_type === filter.usageType);
  }

  if (filter?.startDate) {
    entries = entries.filter((e) => new Date(e.timestamp) >= filter.startDate!);
  }

  if (filter?.endDate) {
    entries = entries.filter((e) => new Date(e.timestamp) <= filter.endDate!);
  }

  // Sort by timestamp descending
  entries.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return entries.slice(0, limit);
}

// ============================================================
// USAGE MIDDLEWARE HELPER
// ============================================================

/**
 * Track and check usage in one call (for API routes)
 */
export function trackAndCheckUsage(
  userId: string,
  tenantId: string,
  plan: PlanType,
  usageType: UsageType,
  quantity: number = 1
): UsageCheckResult & { logged?: boolean } {
  // Check if allowed first
  const check = checkUsageAllowed(tenantId, plan, usageType, quantity);

  if (!check.allowed) {
    return { ...check, logged: false };
  }

  // Log the usage
  logUsage(userId, tenantId, usageType, quantity);

  // Return updated check
  return {
    ...check,
    usage: check.usage + quantity,
    remaining: check.limit === -1 ? -1 : check.remaining - quantity,
    logged: true,
  };
}

export default {
  logUsage,
  getTenantUsage,
  getUserUsage,
  checkUsageAllowed,
  getUsageSummary,
  checkUsageAlerts,
  formatUsageType,
  getUsageLog,
  trackAndCheckUsage,
  PLAN_LIMITS,
};
