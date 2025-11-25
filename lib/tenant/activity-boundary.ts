/**
 * Activity Boundary
 *
 * Enforces usage boundaries and alerts for tenant activity.
 */

import type {
  ActivityBoundary,
  BoundaryRule,
  BoundaryMetric,
  AlertThreshold,
} from './types';
import { getTenantContext } from './tenant-context';

// ============================================================
// DEFAULT BOUNDARIES BY PLAN
// ============================================================

export const PLAN_BOUNDARIES: Record<string, BoundaryRule[]> = {
  free: [
    { metric: 'api_calls', limit: 1000, period: 'day', action: 'block' },
    { metric: 'exports', limit: 10, period: 'month', action: 'block' },
    { metric: 'searches', limit: 100, period: 'day', action: 'block' },
    { metric: 'outreach_sent', limit: 50, period: 'month', action: 'block' },
    { metric: 'storage_mb', limit: 100, period: 'month', action: 'warn' },
    { metric: 'active_users', limit: 2, period: 'month', action: 'block' },
  ],
  starter: [
    { metric: 'api_calls', limit: 10000, period: 'day', action: 'warn' },
    { metric: 'exports', limit: 100, period: 'month', action: 'warn' },
    { metric: 'searches', limit: 1000, period: 'day', action: 'warn' },
    { metric: 'outreach_sent', limit: 500, period: 'month', action: 'warn' },
    { metric: 'storage_mb', limit: 1000, period: 'month', action: 'warn' },
    { metric: 'active_users', limit: 5, period: 'month', action: 'block' },
  ],
  professional: [
    { metric: 'api_calls', limit: 100000, period: 'day', action: 'notify' },
    { metric: 'exports', limit: 1000, period: 'month', action: 'notify' },
    { metric: 'searches', limit: 10000, period: 'day', action: 'notify' },
    { metric: 'outreach_sent', limit: 5000, period: 'month', action: 'notify' },
    { metric: 'storage_mb', limit: 10000, period: 'month', action: 'warn' },
    { metric: 'active_users', limit: 20, period: 'month', action: 'warn' },
  ],
  enterprise: [
    { metric: 'api_calls', limit: 1000000, period: 'day', action: 'notify' },
    { metric: 'exports', limit: 10000, period: 'month', action: 'notify' },
    { metric: 'searches', limit: 100000, period: 'day', action: 'notify' },
    { metric: 'outreach_sent', limit: 50000, period: 'month', action: 'notify' },
    { metric: 'storage_mb', limit: 100000, period: 'month', action: 'notify' },
    { metric: 'active_users', limit: 100, period: 'month', action: 'notify' },
  ],
};

export const DEFAULT_ALERT_THRESHOLDS: AlertThreshold[] = [
  { metric: 'api_calls', warningPercent: 80, criticalPercent: 95, notifyEmails: [] },
  { metric: 'exports', warningPercent: 70, criticalPercent: 90, notifyEmails: [] },
  { metric: 'searches', warningPercent: 80, criticalPercent: 95, notifyEmails: [] },
  { metric: 'outreach_sent', warningPercent: 70, criticalPercent: 90, notifyEmails: [] },
  { metric: 'storage_mb', warningPercent: 80, criticalPercent: 95, notifyEmails: [] },
  { metric: 'active_users', warningPercent: 80, criticalPercent: 100, notifyEmails: [] },
];

// ============================================================
// ACTIVITY TRACKING (In-memory for demo)
// ============================================================

interface ActivityCounter {
  count: number;
  periodStart: Date;
}

const activityStore = new Map<string, ActivityCounter>();

/**
 * Get period start date
 */
function getPeriodStart(period: BoundaryRule['period']): Date {
  const now = new Date();

  switch (period) {
    case 'hour':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const dayOfWeek = now.getDay();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return now;
  }
}

/**
 * Get activity key
 */
function getActivityKey(tenantId: string, metric: BoundaryMetric, period: string): string {
  return `${tenantId}:${metric}:${period}`;
}

// ============================================================
// BOUNDARY CHECKING
// ============================================================

export interface BoundaryCheckResult {
  metric: BoundaryMetric;
  current: number;
  limit: number;
  percentage: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
  action: BoundaryRule['action'];
  period: BoundaryRule['period'];
}

/**
 * Check activity against boundaries
 */
export function checkBoundary(
  metric: BoundaryMetric,
  plan: string = 'starter'
): BoundaryCheckResult | null {
  const context = getTenantContext();
  if (!context) return null;

  const boundaries = PLAN_BOUNDARIES[plan] || PLAN_BOUNDARIES.starter;
  const rule = boundaries.find((b) => b.metric === metric);

  if (!rule) return null;

  const periodStart = getPeriodStart(rule.period);
  const key = getActivityKey(context.tenantId, metric, periodStart.toISOString());

  const counter = activityStore.get(key);
  const current = counter?.count || 0;
  const percentage = (current / rule.limit) * 100;

  // Determine status
  let status: BoundaryCheckResult['status'] = 'ok';
  const threshold = DEFAULT_ALERT_THRESHOLDS.find((t) => t.metric === metric);

  if (percentage >= 100) {
    status = 'exceeded';
  } else if (threshold && percentage >= threshold.criticalPercent) {
    status = 'critical';
  } else if (threshold && percentage >= threshold.warningPercent) {
    status = 'warning';
  }

  return {
    metric,
    current,
    limit: rule.limit,
    percentage,
    status,
    action: rule.action,
    period: rule.period,
  };
}

/**
 * Track activity increment
 */
export function trackActivity(
  metric: BoundaryMetric,
  increment: number = 1,
  plan: string = 'starter'
): BoundaryCheckResult | null {
  const context = getTenantContext();
  if (!context) return null;

  const boundaries = PLAN_BOUNDARIES[plan] || PLAN_BOUNDARIES.starter;
  const rule = boundaries.find((b) => b.metric === metric);

  if (!rule) return null;

  const periodStart = getPeriodStart(rule.period);
  const key = getActivityKey(context.tenantId, metric, periodStart.toISOString());

  let counter = activityStore.get(key);

  if (!counter || counter.periodStart.getTime() !== periodStart.getTime()) {
    counter = { count: 0, periodStart };
  }

  counter.count += increment;
  activityStore.set(key, counter);

  return checkBoundary(metric, plan);
}

/**
 * Check if activity is allowed
 */
export function isActivityAllowed(metric: BoundaryMetric, plan: string = 'starter'): boolean {
  const result = checkBoundary(metric, plan);

  if (!result) return true;

  if (result.status === 'exceeded' && result.action === 'block') {
    return false;
  }

  return true;
}

/**
 * Get all boundary status for tenant
 */
export function getAllBoundaryStatus(plan: string = 'starter'): BoundaryCheckResult[] {
  const metrics: BoundaryMetric[] = [
    'api_calls',
    'exports',
    'searches',
    'outreach_sent',
    'storage_mb',
    'active_users',
  ];

  return metrics
    .map((metric) => checkBoundary(metric, plan))
    .filter((result): result is BoundaryCheckResult => result !== null);
}

/**
 * Reset activity counters for tenant (admin function)
 */
export function resetActivityCounters(tenantId: string): void {
  const keysToDelete: string[] = [];

  for (const key of activityStore.keys()) {
    if (key.startsWith(`${tenantId}:`)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => activityStore.delete(key));
}

/**
 * Get usage summary for tenant
 */
export function getUsageSummary(plan: string = 'starter'): {
  totalMetrics: number;
  atWarning: number;
  atCritical: number;
  exceeded: number;
  status: 'healthy' | 'warning' | 'critical';
} {
  const statuses = getAllBoundaryStatus(plan);

  const totalMetrics = statuses.length;
  const atWarning = statuses.filter((s) => s.status === 'warning').length;
  const atCritical = statuses.filter((s) => s.status === 'critical').length;
  const exceeded = statuses.filter((s) => s.status === 'exceeded').length;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (exceeded > 0 || atCritical > 0) {
    status = 'critical';
  } else if (atWarning > 0) {
    status = 'warning';
  }

  return { totalMetrics, atWarning, atCritical, exceeded, status };
}
