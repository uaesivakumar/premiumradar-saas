/**
 * Overage Alerts
 * Sprint S57: Billing, Plans & Feature Flags
 *
 * Monitor usage and trigger alerts when approaching or exceeding limits.
 */

import type { PlanTier, UsageMetric } from './types';
import { getCurrentUsage, getUsageSummary } from './metered-usage';

// ============================================================
// ALERT TYPES
// ============================================================

export type AlertLevel = 'warning' | 'critical' | 'exceeded';
export type AlertResource = UsageMetric | 'seats';

export interface OverageAlert {
  id: string;
  workspaceId: string;
  resource: AlertResource;
  level: AlertLevel;
  currentUsage: number;
  limit: number;
  percentage: number;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  notificationSent: boolean;
  notificationSentAt?: Date;
}

export interface AlertThreshold {
  level: AlertLevel;
  percentage: number;
  message: string;
}

// ============================================================
// ALERT THRESHOLDS
// ============================================================

export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { level: 'warning', percentage: 80, message: 'Approaching usage limit' },
  { level: 'critical', percentage: 95, message: 'Very close to usage limit' },
  { level: 'exceeded', percentage: 100, message: 'Usage limit exceeded' },
];

// ============================================================
// ALERT STORE (In-memory for demo)
// ============================================================

const alertStore = new Map<string, OverageAlert[]>();

/**
 * Get alerts key for workspace
 */
function getAlertsKey(workspaceId: string): string {
  return `alerts:${workspaceId}`;
}

/**
 * Get all alerts for a workspace
 */
export function getWorkspaceAlerts(workspaceId: string): OverageAlert[] {
  const key = getAlertsKey(workspaceId);
  return alertStore.get(key) || [];
}

/**
 * Get active (unacknowledged) alerts
 */
export function getActiveAlerts(workspaceId: string): OverageAlert[] {
  return getWorkspaceAlerts(workspaceId).filter((a) => !a.acknowledged);
}

/**
 * Create a new alert
 */
export function createAlert(
  workspaceId: string,
  resource: AlertResource,
  level: AlertLevel,
  currentUsage: number,
  limit: number
): OverageAlert {
  const percentage = limit > 0 ? Math.round((currentUsage / limit) * 100) : 0;
  const threshold = DEFAULT_THRESHOLDS.find((t) => t.level === level);

  const alert: OverageAlert = {
    id: `alert_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId,
    resource,
    level,
    currentUsage,
    limit,
    percentage,
    message: threshold?.message || `Usage at ${percentage}%`,
    createdAt: new Date(),
    acknowledged: false,
    notificationSent: false,
  };

  const key = getAlertsKey(workspaceId);
  const existing = alertStore.get(key) || [];

  // Don't create duplicate alerts for same resource/level
  const hasSimilar = existing.some(
    (a) => a.resource === resource && a.level === level && !a.acknowledged
  );
  if (hasSimilar) {
    return existing.find(
      (a) => a.resource === resource && a.level === level && !a.acknowledged
    )!;
  }

  alertStore.set(key, [...existing, alert]);
  return alert;
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(
  workspaceId: string,
  alertId: string,
  userId: string
): OverageAlert | null {
  const key = getAlertsKey(workspaceId);
  const alerts = alertStore.get(key) || [];
  const alertIndex = alerts.findIndex((a) => a.id === alertId);

  if (alertIndex === -1) return null;

  const updatedAlert: OverageAlert = {
    ...alerts[alertIndex],
    acknowledged: true,
    acknowledgedAt: new Date(),
    acknowledgedBy: userId,
  };

  alerts[alertIndex] = updatedAlert;
  alertStore.set(key, alerts);

  return updatedAlert;
}

/**
 * Mark alert as notification sent
 */
export function markNotificationSent(
  workspaceId: string,
  alertId: string
): OverageAlert | null {
  const key = getAlertsKey(workspaceId);
  const alerts = alertStore.get(key) || [];
  const alertIndex = alerts.findIndex((a) => a.id === alertId);

  if (alertIndex === -1) return null;

  const updatedAlert: OverageAlert = {
    ...alerts[alertIndex],
    notificationSent: true,
    notificationSentAt: new Date(),
  };

  alerts[alertIndex] = updatedAlert;
  alertStore.set(key, alerts);

  return updatedAlert;
}

// ============================================================
// USAGE MONITORING
// ============================================================

export interface UsageCheckResult {
  alerts: OverageAlert[];
  usage: Record<AlertResource, { current: number; limit: number; percentage: number }>;
}

/**
 * Check usage and create alerts if needed
 */
export function checkUsageAndAlert(
  workspaceId: string,
  tier: PlanTier,
  thresholds: AlertThreshold[] = DEFAULT_THRESHOLDS
): UsageCheckResult {
  const summary = getUsageSummary(workspaceId, tier);
  const newAlerts: OverageAlert[] = [];

  const usage: Record<AlertResource, { current: number; limit: number; percentage: number }> =
    {} as Record<AlertResource, { current: number; limit: number; percentage: number }>;

  // Check each metric
  const metrics: UsageMetric[] = ['api_calls', 'exports', 'searches', 'outreach_sent', 'storage_mb'];

  for (const metric of metrics) {
    const current = summary.metrics[metric];
    const limit = summary.limits[metric];
    const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;

    usage[metric] = { current, limit, percentage };

    // Check against thresholds
    for (const threshold of thresholds.sort((a, b) => b.percentage - a.percentage)) {
      if (percentage >= threshold.percentage) {
        const alert = createAlert(workspaceId, metric, threshold.level, current, limit);
        if (!alert.acknowledged) {
          newAlerts.push(alert);
        }
        break; // Only create highest-level alert
      }
    }
  }

  return { alerts: newAlerts, usage };
}

/**
 * Get usage summary with alert status
 */
export function getUsageWithAlerts(
  workspaceId: string,
  tier: PlanTier
): {
  usage: Record<AlertResource, { current: number; limit: number; percentage: number; status: AlertLevel | 'ok' }>;
  alerts: OverageAlert[];
} {
  const { alerts, usage } = checkUsageAndAlert(workspaceId, tier);

  const usageWithStatus: Record<AlertResource, { current: number; limit: number; percentage: number; status: AlertLevel | 'ok' }> =
    {} as Record<AlertResource, { current: number; limit: number; percentage: number; status: AlertLevel | 'ok' }>;

  for (const [resource, data] of Object.entries(usage)) {
    const alert = alerts.find((a) => a.resource === resource);
    usageWithStatus[resource as AlertResource] = {
      ...data,
      status: alert?.level || 'ok',
    };
  }

  return { usage: usageWithStatus, alerts: getActiveAlerts(workspaceId) };
}

// ============================================================
// NOTIFICATION HELPERS
// ============================================================

export interface AlertNotification {
  alert: OverageAlert;
  to: string[];
  subject: string;
  body: string;
}

/**
 * Generate notification for an alert
 */
export function generateAlertNotification(
  alert: OverageAlert,
  recipientEmails: string[],
  workspaceName: string
): AlertNotification {
  const resourceName = formatResourceName(alert.resource);
  const levelEmoji = alert.level === 'exceeded' ? '🚨' : alert.level === 'critical' ? '⚠️' : '📊';

  return {
    alert,
    to: recipientEmails,
    subject: `${levelEmoji} ${resourceName} usage alert for ${workspaceName}`,
    body: `
Your ${resourceName} usage has reached ${alert.percentage}% of your limit.

Current Usage: ${formatNumber(alert.currentUsage)}
Limit: ${formatNumber(alert.limit)}
Status: ${alert.level.toUpperCase()}

${alert.level === 'exceeded' ? 'Please upgrade your plan to continue using this feature without interruption.' : 'Consider upgrading your plan if you anticipate continued growth.'}

View your usage dashboard: https://app.premiumradar.com/settings/billing

Best regards,
The PremiumRadar Team
    `.trim(),
  };
}

/**
 * Format resource name for display
 */
function formatResourceName(resource: AlertResource): string {
  const names: Record<AlertResource, string> = {
    api_calls: 'API Calls',
    exports: 'Exports',
    searches: 'Searches',
    outreach_sent: 'Outreach Messages',
    storage_mb: 'Storage',
    seats: 'Team Seats',
  };
  return names[resource] || resource;
}

/**
 * Format number for display
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ============================================================
// CLEANUP
// ============================================================

/**
 * Clear all alerts for a workspace (for new billing period)
 */
export function clearAlerts(workspaceId: string): void {
  const key = getAlertsKey(workspaceId);
  alertStore.delete(key);
}

/**
 * Clear acknowledged alerts older than X days
 */
export function cleanupOldAlerts(workspaceId: string, daysOld: number = 30): void {
  const key = getAlertsKey(workspaceId);
  const alerts = alertStore.get(key) || [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const filtered = alerts.filter((a) => {
    if (!a.acknowledged) return true;
    return a.createdAt > cutoff;
  });

  alertStore.set(key, filtered);
}
