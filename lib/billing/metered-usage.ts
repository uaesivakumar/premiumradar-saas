/**
 * Metered Usage
 *
 * Track and report usage for metered billing (credits/requests).
 */

import { stripe } from './stripe-client';
import type { UsageRecord, UsageMetric, UsageSummary } from './types';
import { getPlanLimits } from './plans';
import type { PlanTier } from './types';

// ============================================================
// USAGE TRACKING (In-memory for demo)
// ============================================================

const usageStore = new Map<string, Map<UsageMetric, number>>();

/**
 * Get usage key for workspace + period
 */
function getUsageKey(workspaceId: string, period: Date): string {
  const year = period.getFullYear();
  const month = period.getMonth();
  return `${workspaceId}:${year}-${month}`;
}

/**
 * Record usage for a workspace
 */
export async function recordUsage(
  workspaceId: string,
  metric: UsageMetric,
  quantity: number,
  subscriptionItemId?: string
): Promise<UsageRecord> {
  const now = new Date();
  const key = getUsageKey(workspaceId, now);

  // Update local store
  if (!usageStore.has(key)) {
    usageStore.set(key, new Map());
  }
  const workspaceUsage = usageStore.get(key)!;
  const currentUsage = workspaceUsage.get(metric) || 0;
  workspaceUsage.set(metric, currentUsage + quantity);

  // If we have a subscription item, report to Stripe
  if (stripe && subscriptionItemId) {
    try {
      await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: Math.floor(now.getTime() / 1000),
        action: 'increment',
      });
    } catch (err) {
      console.error('Failed to report usage to Stripe:', err);
    }
  }

  const record: UsageRecord = {
    id: `usage_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    subscriptionItemId: subscriptionItemId || '',
    metric,
    quantity,
    timestamp: now,
    idempotencyKey: `${key}:${metric}:${now.getTime()}`,
  };

  return record;
}

/**
 * Get current usage for a workspace
 */
export function getCurrentUsage(
  workspaceId: string,
  metric: UsageMetric
): number {
  const key = getUsageKey(workspaceId, new Date());
  const workspaceUsage = usageStore.get(key);
  return workspaceUsage?.get(metric) || 0;
}

/**
 * Get usage summary for a workspace
 */
export function getUsageSummary(
  workspaceId: string,
  tier: PlanTier
): UsageSummary {
  const now = new Date();
  const key = getUsageKey(workspaceId, now);
  const workspaceUsage = usageStore.get(key);
  const limits = getPlanLimits(tier);

  const metrics: Record<UsageMetric, number> = {
    api_calls: workspaceUsage?.get('api_calls') || 0,
    exports: workspaceUsage?.get('exports') || 0,
    searches: workspaceUsage?.get('searches') || 0,
    outreach_sent: workspaceUsage?.get('outreach_sent') || 0,
    storage_mb: workspaceUsage?.get('storage_mb') || 0,
  };

  const limitMap: Record<UsageMetric, number> = {
    api_calls: limits.apiCalls,
    exports: limits.exports,
    searches: limits.searches,
    outreach_sent: limits.outreach,
    storage_mb: limits.storageMb,
  };

  return {
    workspaceId,
    period: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
    metrics,
    limits: limitMap,
  };
}

/**
 * Check if usage limit is exceeded
 */
export function isLimitExceeded(
  workspaceId: string,
  metric: UsageMetric,
  tier: PlanTier
): boolean {
  const summary = getUsageSummary(workspaceId, tier);
  return summary.metrics[metric] >= summary.limits[metric];
}

/**
 * Get usage percentage for a metric
 */
export function getUsagePercentage(
  workspaceId: string,
  metric: UsageMetric,
  tier: PlanTier
): number {
  const summary = getUsageSummary(workspaceId, tier);
  const used = summary.metrics[metric];
  const limit = summary.limits[metric];
  return limit > 0 ? Math.round((used / limit) * 100) : 0;
}

/**
 * Reset usage for a workspace (for testing)
 */
export function resetUsage(workspaceId: string): void {
  const now = new Date();
  const key = getUsageKey(workspaceId, now);
  usageStore.delete(key);
}

/**
 * Get all usage records for reporting
 */
export function getAllUsage(): Map<string, Map<UsageMetric, number>> {
  return new Map(usageStore);
}

// ============================================================
// USAGE MIDDLEWARE
// ============================================================

export interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  percentage: number;
  remainig: number;
}

/**
 * Check and track usage for an action
 */
export function checkAndTrackUsage(
  workspaceId: string,
  metric: UsageMetric,
  tier: PlanTier,
  quantity: number = 1
): UsageCheckResult {
  const summary = getUsageSummary(workspaceId, tier);
  const currentUsage = summary.metrics[metric];
  const limit = summary.limits[metric];
  const percentage = limit > 0 ? Math.round((currentUsage / limit) * 100) : 0;

  // Check if this action would exceed limit
  const wouldExceed = currentUsage + quantity > limit;

  if (!wouldExceed) {
    // Track the usage
    recordUsage(workspaceId, metric, quantity);
  }

  return {
    allowed: !wouldExceed,
    currentUsage: currentUsage + (wouldExceed ? 0 : quantity),
    limit,
    percentage,
    remainig: Math.max(0, limit - currentUsage - (wouldExceed ? 0 : quantity)),
  };
}
