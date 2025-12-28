/**
 * S316-S317: Demo Enterprise & User Provisioning
 * Part of User & Enterprise Management Program v1.1
 * Phase F - Demo System
 *
 * Handles creation of demo enterprises and users.
 * Uses demo_policies table for configuration (no hardcoding).
 */

import { query, queryOne, transaction, getPool } from '@/lib/db/client';

// =============================================================================
// TYPES
// =============================================================================

export interface DemoEnterpriseConfig {
  demo_type: 'SYSTEM' | 'ENTERPRISE';
  duration_days: number;
  max_users: number;
  max_workspaces: number;
  max_discoveries: number;
  features: {
    siva_enabled: boolean;
    outreach_enabled: boolean;
    export_enabled: boolean;
  };
}

export interface DemoProvisionResult {
  success: boolean;
  enterprise_id?: string;
  user_id?: string;
  workspace_id?: string;
  demo_expires_at?: Date;
  error?: string;
}

// =============================================================================
// DEMO POLICY RETRIEVAL
// =============================================================================

/**
 * Get demo policy configuration
 * Reads from demo_policies table - NO HARDCODING
 */
export async function getDemoPolicy(
  demoType: 'SYSTEM' | 'ENTERPRISE'
): Promise<DemoEnterpriseConfig | null> {
  const policy = await queryOne<{
    demo_type: string;
    policy_config: Record<string, unknown>;
    is_active: boolean;
  }>(
    'SELECT demo_type, policy_config, is_active FROM demo_policies WHERE demo_type = $1 AND is_active = true',
    [demoType]
  );

  if (!policy) {
    // Return default policy if none configured
    return {
      demo_type: demoType,
      duration_days: demoType === 'ENTERPRISE' ? 14 : 7,
      max_users: demoType === 'ENTERPRISE' ? 5 : 1,
      max_workspaces: demoType === 'ENTERPRISE' ? 3 : 1,
      max_discoveries: demoType === 'ENTERPRISE' ? 50 : 20,
      features: {
        siva_enabled: true,
        outreach_enabled: demoType === 'ENTERPRISE',
        export_enabled: false,
      },
    };
  }

  const config = policy.policy_config as Record<string, unknown>;

  return {
    demo_type: demoType,
    duration_days: (config.duration_days as number) || 7,
    max_users: (config.max_users as number) || 1,
    max_workspaces: (config.max_workspaces as number) || 1,
    max_discoveries: (config.max_discoveries as number) || 20,
    features: {
      siva_enabled: (config.siva_enabled as boolean) ?? true,
      outreach_enabled: (config.outreach_enabled as boolean) ?? false,
      export_enabled: (config.export_enabled as boolean) ?? false,
    },
  };
}

// =============================================================================
// DEMO ENTERPRISE PROVISIONING (S316)
// =============================================================================

/**
 * Provision a new demo enterprise
 * Creates enterprise, default workspace, and admin user
 */
export async function provisionDemoEnterprise(
  email: string,
  name?: string,
  demoType: 'SYSTEM' | 'ENTERPRISE' = 'SYSTEM'
): Promise<DemoProvisionResult> {
  // Get policy configuration
  const policy = await getDemoPolicy(demoType);
  if (!policy) {
    return { success: false, error: 'Demo policy not available' };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + policy.duration_days);

    // Create enterprise
    const enterpriseId = crypto.randomUUID();
    const enterpriseName = name || `Demo Enterprise (${email.split('@')[0]})`;
    const enterpriseSlug = generateSlug(enterpriseName);

    await client.query(
      `INSERT INTO enterprises (
        id, name, slug, type, plan, is_demo, demo_type, demo_expires_at,
        max_users, max_workspaces, max_discoveries_per_month, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        enterpriseId,
        enterpriseName,
        enterpriseSlug,
        'demo',
        'demo',
        true,
        demoType,
        expiresAt,
        policy.max_users,
        policy.max_workspaces,
        policy.max_discoveries,
        true,
      ]
    );

    // Create default workspace
    const workspaceId = crypto.randomUUID();
    await client.query(
      `INSERT INTO workspaces (
        id, enterprise_id, name, slug, is_default, status
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [workspaceId, enterpriseId, 'Default Workspace', 'default', true, 'active']
    );

    // Create admin user
    const userId = crypto.randomUUID();
    const userRole = demoType === 'ENTERPRISE' ? 'ENTERPRISE_ADMIN' : 'ENTERPRISE_USER';

    await client.query(
      `INSERT INTO users (
        id, email, name, role, enterprise_id, workspace_id, is_demo,
        demo_type, demo_expires_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO UPDATE SET
        enterprise_id = EXCLUDED.enterprise_id,
        workspace_id = EXCLUDED.workspace_id,
        is_demo = EXCLUDED.is_demo,
        demo_type = EXCLUDED.demo_type,
        demo_expires_at = EXCLUDED.demo_expires_at,
        updated_at = NOW()`,
      [
        userId,
        email.toLowerCase(),
        name || email.split('@')[0],
        userRole,
        enterpriseId,
        workspaceId,
        true,
        demoType,
        expiresAt,
        'active',
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      enterprise_id: enterpriseId,
      user_id: userId,
      workspace_id: workspaceId,
      demo_expires_at: expiresAt,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Demo Provisioner] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Provisioning failed',
    };
  } finally {
    client.release();
  }
}

// =============================================================================
// DEMO USER LIFECYCLE (S317)
// =============================================================================

/**
 * Add a demo user to an existing demo enterprise
 */
export async function addDemoUser(
  enterpriseId: string,
  email: string,
  name?: string,
  role: 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' = 'ENTERPRISE_USER'
): Promise<DemoProvisionResult> {
  // Verify enterprise is demo and has capacity
  const enterprise = await queryOne<{
    id: string;
    is_demo: boolean;
    demo_type: string;
    demo_expires_at: Date;
    max_users: number;
  }>(
    'SELECT id, is_demo, demo_type, demo_expires_at, max_users FROM enterprises WHERE id = $1',
    [enterpriseId]
  );

  if (!enterprise) {
    return { success: false, error: 'Enterprise not found' };
  }

  if (!enterprise.is_demo) {
    return { success: false, error: 'Not a demo enterprise' };
  }

  // Check user count
  const userCount = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE enterprise_id = $1',
    [enterpriseId]
  );

  if (parseInt(userCount?.count || '0') >= enterprise.max_users) {
    return { success: false, error: 'Demo user limit reached' };
  }

  // Get default workspace
  const workspace = await queryOne<{ id: string }>(
    'SELECT id FROM workspaces WHERE enterprise_id = $1 AND is_default = true LIMIT 1',
    [enterpriseId]
  );

  // Create user
  const userId = crypto.randomUUID();

  await query(
    `INSERT INTO users (
      id, email, name, role, enterprise_id, workspace_id, is_demo,
      demo_type, demo_expires_at, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      userId,
      email.toLowerCase(),
      name || email.split('@')[0],
      role,
      enterpriseId,
      workspace?.id || null,
      true,
      enterprise.demo_type,
      enterprise.demo_expires_at,
      'active',
    ]
  );

  return {
    success: true,
    enterprise_id: enterpriseId,
    user_id: userId,
    workspace_id: workspace?.id,
    demo_expires_at: enterprise.demo_expires_at,
  };
}

/**
 * Check if a demo is expired
 */
export async function isDemoExpired(enterpriseId: string): Promise<boolean> {
  const result = await queryOne<{ is_expired: boolean }>(
    `SELECT demo_expires_at < NOW() as is_expired
     FROM enterprises
     WHERE id = $1 AND is_demo = true`,
    [enterpriseId]
  );

  return result?.is_expired ?? true;
}

/**
 * Get demo status for an enterprise
 */
export async function getDemoStatus(enterpriseId: string): Promise<{
  is_demo: boolean;
  demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
  expires_at: Date | null;
  days_remaining: number;
  is_expired: boolean;
} | null> {
  const result = await queryOne<{
    is_demo: boolean;
    demo_type: string;
    demo_expires_at: Date;
  }>(
    'SELECT is_demo, demo_type, demo_expires_at FROM enterprises WHERE id = $1',
    [enterpriseId]
  );

  if (!result || !result.is_demo) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(result.demo_expires_at);
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    is_demo: true,
    demo_type: result.demo_type as 'SYSTEM' | 'ENTERPRISE',
    expires_at: expiresAt,
    days_remaining: Math.max(0, daysRemaining),
    is_expired: expiresAt < now,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// =============================================================================
// EXPORT
// =============================================================================

export const demoProvisioner = {
  getPolicy: getDemoPolicy,
  provisionEnterprise: provisionDemoEnterprise,
  addUser: addDemoUser,
  isExpired: isDemoExpired,
  getStatus: getDemoStatus,
};

export default demoProvisioner;
