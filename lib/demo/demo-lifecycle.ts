/**
 * S319-S320: Demo Expiration & Conversion
 * Part of User & Enterprise Management Program v1.1
 * Phase F - Demo System
 *
 * Handles demo expiration and conversion to paid plans.
 */

import { query, queryOne, transaction, getPool } from '@/lib/db/client';
import { getDemoStatus } from './demo-provisioner';
import { clearDemoSeedData } from './demo-seeder';

// =============================================================================
// TYPES
// =============================================================================

export interface DemoExpirationResult {
  enterprise_id: string;
  status: 'expired' | 'grace' | 'cleaned';
  days_overdue: number;
  action_taken: string;
}

export interface DemoConversionResult {
  success: boolean;
  enterprise_id: string;
  new_plan: string;
  error?: string;
}

export interface DemoCleanupStats {
  enterprises_checked: number;
  enterprises_expired: number;
  enterprises_cleaned: number;
  errors: string[];
}

// =============================================================================
// DEMO EXPIRATION HANDLING (S319)
// =============================================================================

/**
 * Check and handle expired demos
 * Called periodically by a cron job or background worker
 */
export async function handleExpiredDemos(): Promise<DemoCleanupStats> {
  const stats: DemoCleanupStats = {
    enterprises_checked: 0,
    enterprises_expired: 0,
    enterprises_cleaned: 0,
    errors: [],
  };

  try {
    // Find all expired demo enterprises
    const expiredDemos = await query<{
      id: string;
      name: string;
      demo_expires_at: Date;
      demo_type: string;
    }>(
      `SELECT id, name, demo_expires_at, demo_type
       FROM enterprises
       WHERE is_demo = true
         AND demo_expires_at < NOW()
         AND is_active = true
       ORDER BY demo_expires_at ASC
       LIMIT 100`
    );

    stats.enterprises_checked = expiredDemos.length;

    for (const enterprise of expiredDemos) {
      try {
        const result = await processExpiredDemo(enterprise.id, enterprise.demo_expires_at);

        if (result.status === 'expired') {
          stats.enterprises_expired++;
        } else if (result.status === 'cleaned') {
          stats.enterprises_cleaned++;
        }
      } catch (error) {
        stats.errors.push(
          `Failed to process ${enterprise.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return stats;
  } catch (error) {
    console.error('[Demo Lifecycle] Cleanup error:', error);
    stats.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return stats;
  }
}

/**
 * Process a single expired demo enterprise
 */
async function processExpiredDemo(
  enterpriseId: string,
  expiresAt: Date
): Promise<DemoExpirationResult> {
  const now = new Date();
  const daysOverdue = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));

  // Grace period: 7 days after expiration before cleanup
  const GRACE_PERIOD_DAYS = 7;
  // Cleanup threshold: 30 days after expiration to delete data
  const CLEANUP_THRESHOLD_DAYS = 30;

  if (daysOverdue <= GRACE_PERIOD_DAYS) {
    // In grace period - just mark as expired, don't delete anything
    await query(
      `UPDATE enterprises SET status = 'expired' WHERE id = $1`,
      [enterpriseId]
    );

    // Disable user logins
    await query(
      `UPDATE users SET status = 'suspended' WHERE enterprise_id = $1`,
      [enterpriseId]
    );

    return {
      enterprise_id: enterpriseId,
      status: 'grace',
      days_overdue: daysOverdue,
      action_taken: 'Marked as expired, users suspended',
    };
  } else if (daysOverdue <= CLEANUP_THRESHOLD_DAYS) {
    // Past grace period - mark as expired, notify user
    await query(
      `UPDATE enterprises SET status = 'expired', is_active = false WHERE id = $1`,
      [enterpriseId]
    );

    return {
      enterprise_id: enterpriseId,
      status: 'expired',
      days_overdue: daysOverdue,
      action_taken: 'Enterprise deactivated',
    };
  } else {
    // Past cleanup threshold - delete demo data
    await cleanupDemoEnterprise(enterpriseId);

    return {
      enterprise_id: enterpriseId,
      status: 'cleaned',
      days_overdue: daysOverdue,
      action_taken: 'Demo data cleaned up',
    };
  }
}

/**
 * Clean up demo enterprise data
 */
async function cleanupDemoEnterprise(enterpriseId: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clear demo seed data
    await clearDemoSeedData(enterpriseId);

    // Delete evidence packs
    await client.query('DELETE FROM evidence_packs WHERE enterprise_id = $1', [enterpriseId]);

    // Delete campaigns
    await client.query('DELETE FROM campaigns WHERE enterprise_id = $1', [enterpriseId]);

    // Delete templates
    await client.query('DELETE FROM templates WHERE enterprise_id = $1', [enterpriseId]);

    // Delete user invitations
    await client.query('DELETE FROM user_invitations WHERE enterprise_id = $1', [enterpriseId]);

    // Delete users
    await client.query('DELETE FROM users WHERE enterprise_id = $1', [enterpriseId]);

    // Delete workspaces
    await client.query('DELETE FROM workspaces WHERE enterprise_id = $1', [enterpriseId]);

    // Finally, delete enterprise
    await client.query('DELETE FROM enterprises WHERE id = $1', [enterpriseId]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// =============================================================================
// DEMO TO PAID CONVERSION (S320)
// =============================================================================

/**
 * Convert a demo enterprise to a paid plan
 */
export async function convertDemoToPaid(
  enterpriseId: string,
  newPlan: 'starter' | 'professional' | 'enterprise',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<DemoConversionResult> {
  // Verify it's a demo enterprise
  const status = await getDemoStatus(enterpriseId);

  if (!status?.is_demo) {
    return {
      success: false,
      enterprise_id: enterpriseId,
      new_plan: newPlan,
      error: 'Not a demo enterprise',
    };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get plan limits
    const planLimits = getPlanLimits(newPlan);

    // Update enterprise
    await client.query(
      `UPDATE enterprises SET
        is_demo = false,
        demo_type = NULL,
        demo_expires_at = NULL,
        plan = $2,
        type = 'paid',
        max_users = $3,
        max_workspaces = $4,
        max_discoveries_per_month = $5,
        stripe_customer_id = $6,
        stripe_subscription_id = $7,
        subscription_status = 'active',
        is_active = true,
        status = 'active',
        updated_at = NOW()
       WHERE id = $1`,
      [
        enterpriseId,
        newPlan,
        planLimits.max_users,
        planLimits.max_workspaces,
        planLimits.max_discoveries,
        stripeCustomerId || null,
        stripeSubscriptionId || null,
      ]
    );

    // Update users to remove demo flags
    await client.query(
      `UPDATE users SET
        is_demo = false,
        demo_type = NULL,
        demo_expires_at = NULL,
        status = 'active',
        updated_at = NOW()
       WHERE enterprise_id = $1`,
      [enterpriseId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      enterprise_id: enterpriseId,
      new_plan: newPlan,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Demo Lifecycle] Conversion error:', error);
    return {
      success: false,
      enterprise_id: enterpriseId,
      new_plan: newPlan,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  } finally {
    client.release();
  }
}

/**
 * Extend a demo's expiration date
 */
export async function extendDemo(
  enterpriseId: string,
  additionalDays: number
): Promise<{ success: boolean; new_expires_at?: Date; error?: string }> {
  const status = await getDemoStatus(enterpriseId);

  if (!status?.is_demo) {
    return { success: false, error: 'Not a demo enterprise' };
  }

  // Max extension is 30 days
  const maxExtension = 30;
  const daysToAdd = Math.min(additionalDays, maxExtension);

  const currentExpiry = status.expires_at || new Date();
  const newExpiry = new Date(
    Math.max(currentExpiry.getTime(), new Date().getTime()) + daysToAdd * 24 * 60 * 60 * 1000
  );

  await query(
    `UPDATE enterprises SET demo_expires_at = $2, updated_at = NOW() WHERE id = $1`,
    [enterpriseId, newExpiry]
  );

  await query(
    `UPDATE users SET demo_expires_at = $2, status = 'active', updated_at = NOW() WHERE enterprise_id = $1`,
    [enterpriseId, newExpiry]
  );

  return {
    success: true,
    new_expires_at: newExpiry,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

interface PlanLimits {
  max_users: number;
  max_workspaces: number;
  max_discoveries: number;
}

function getPlanLimits(plan: 'starter' | 'professional' | 'enterprise'): PlanLimits {
  switch (plan) {
    case 'starter':
      return { max_users: 5, max_workspaces: 3, max_discoveries: 100 };
    case 'professional':
      return { max_users: 20, max_workspaces: 10, max_discoveries: 500 };
    case 'enterprise':
      return { max_users: 100, max_workspaces: 50, max_discoveries: 2000 };
    default:
      return { max_users: 5, max_workspaces: 3, max_discoveries: 100 };
  }
}

// =============================================================================
// EXPORT
// =============================================================================

export const demoLifecycle = {
  handleExpiredDemos,
  convertToPaid: convertDemoToPaid,
  extend: extendDemo,
};

export default demoLifecycle;
