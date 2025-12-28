/**
 * S289: Enterprise Database Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Real PostgreSQL operations for enterprises.
 * Replaces tenant-based operations where applicable.
 */

import { query, queryOne, insert, getPool } from './client';

// ============================================================
// TYPES
// ============================================================

export type EnterpriseStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type EnterpriseType = 'REAL' | 'DEMO';
export type EnterprisePlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Enterprise {
  enterprise_id: string;
  name: string;
  type: EnterpriseType;
  region: string;
  status: EnterpriseStatus;
  created_at: Date;
  updated_at: Date;

  // Optional fields
  domain?: string;
  industry?: string;
  plan?: EnterprisePlan;

  // Stripe integration
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: string;

  // Limits
  max_users?: number;
  max_workspaces?: number;
  max_discoveries_per_month?: number;

  // Demo
  demo_expires_at?: Date;

  // Metadata
  metadata?: Record<string, unknown>;

  // Migration tracking
  legacy_tenant_id?: string;
}

export interface CreateEnterpriseInput {
  name: string;
  region?: string;
  type?: EnterpriseType;
  domain?: string;
  industry?: string;
  plan?: EnterprisePlan;
  max_users?: number;
  max_workspaces?: number;
  max_discoveries_per_month?: number;
  demo_expires_at?: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdateEnterpriseInput {
  name?: string;
  region?: string;
  status?: EnterpriseStatus;
  domain?: string;
  industry?: string;
  plan?: EnterprisePlan;
  max_users?: number;
  max_workspaces?: number;
  max_discoveries_per_month?: number;
  demo_expires_at?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================
// ENTERPRISE CRUD OPERATIONS
// ============================================================

/**
 * Create a new enterprise
 */
export async function createEnterprise(input: CreateEnterpriseInput): Promise<Enterprise> {
  const result = await insert<Enterprise>(
    `INSERT INTO enterprises (
      name, region, type, domain, industry, plan,
      max_users, max_workspaces, max_discoveries_per_month,
      demo_expires_at, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      input.name,
      input.region || 'UAE',
      input.type || 'REAL',
      input.domain || null,
      input.industry || null,
      input.plan || 'free',
      input.max_users || 5,
      input.max_workspaces || 3,
      input.max_discoveries_per_month || 100,
      input.demo_expires_at || null,
      input.metadata ? JSON.stringify(input.metadata) : '{}',
    ]
  );
  return result;
}

/**
 * Get enterprise by ID
 */
export async function getEnterpriseById(enterpriseId: string): Promise<Enterprise | null> {
  return queryOne<Enterprise>(
    'SELECT * FROM enterprises WHERE enterprise_id = $1',
    [enterpriseId]
  );
}

/**
 * Get enterprise by domain
 */
export async function getEnterpriseByDomain(domain: string): Promise<Enterprise | null> {
  return queryOne<Enterprise>(
    'SELECT * FROM enterprises WHERE domain = $1 AND status = $2',
    [domain, 'ACTIVE']
  );
}

/**
 * Get enterprise by legacy tenant ID (for migration)
 */
export async function getEnterpriseByLegacyTenantId(tenantId: string): Promise<Enterprise | null> {
  return queryOne<Enterprise>(
    'SELECT * FROM enterprises WHERE legacy_tenant_id = $1',
    [tenantId]
  );
}

/**
 * Update enterprise
 */
export async function updateEnterprise(
  enterpriseId: string,
  input: UpdateEnterpriseInput
): Promise<Enterprise | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.region !== undefined) {
    fields.push(`region = $${paramIndex++}`);
    values.push(input.region);
  }
  if (input.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(input.status);
  }
  if (input.domain !== undefined) {
    fields.push(`domain = $${paramIndex++}`);
    values.push(input.domain);
  }
  if (input.industry !== undefined) {
    fields.push(`industry = $${paramIndex++}`);
    values.push(input.industry);
  }
  if (input.plan !== undefined) {
    fields.push(`plan = $${paramIndex++}`);
    values.push(input.plan);
  }
  if (input.max_users !== undefined) {
    fields.push(`max_users = $${paramIndex++}`);
    values.push(input.max_users);
  }
  if (input.max_workspaces !== undefined) {
    fields.push(`max_workspaces = $${paramIndex++}`);
    values.push(input.max_workspaces);
  }
  if (input.max_discoveries_per_month !== undefined) {
    fields.push(`max_discoveries_per_month = $${paramIndex++}`);
    values.push(input.max_discoveries_per_month);
  }
  if (input.demo_expires_at !== undefined) {
    fields.push(`demo_expires_at = $${paramIndex++}`);
    values.push(input.demo_expires_at);
  }
  if (input.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(input.metadata));
  }

  if (fields.length === 0) {
    return getEnterpriseById(enterpriseId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(enterpriseId);

  return queryOne<Enterprise>(
    `UPDATE enterprises SET ${fields.join(', ')} WHERE enterprise_id = $${paramIndex} RETURNING *`,
    values
  );
}

/**
 * Soft delete enterprise (set status to DELETED)
 */
export async function deleteEnterprise(enterpriseId: string): Promise<Enterprise | null> {
  return queryOne<Enterprise>(
    `UPDATE enterprises SET status = 'DELETED', updated_at = NOW() WHERE enterprise_id = $1 RETURNING *`,
    [enterpriseId]
  );
}

/**
 * List enterprises with optional filters
 */
export async function listEnterprises(options: {
  status?: EnterpriseStatus;
  type?: EnterpriseType;
  plan?: EnterprisePlan;
  limit?: number;
  offset?: number;
}): Promise<{ enterprises: Enterprise[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (options.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(options.status);
  }
  if (options.type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(options.type);
  }
  if (options.plan) {
    conditions.push(`plan = $${paramIndex++}`);
    values.push(options.plan);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM enterprises ${whereClause}`,
    values
  );
  const total = parseInt(countResult?.count || '0', 10);

  // Get paginated results
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  const enterprises = await query<Enterprise>(
    `SELECT * FROM enterprises ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  return { enterprises, total };
}

// ============================================================
// ENTERPRISE USER OPERATIONS
// ============================================================

/**
 * Get users in an enterprise
 */
export async function getEnterpriseUsers(enterpriseId: string): Promise<Array<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  workspace_id: string | null;
  is_demo: boolean;
  created_at: Date;
  last_login_at: Date | null;
}>> {
  return query(
    `SELECT id, email, name, role, workspace_id, is_demo, created_at, last_login_at
     FROM users
     WHERE enterprise_id = $1
     ORDER BY created_at DESC`,
    [enterpriseId]
  );
}

/**
 * Count users in an enterprise
 */
export async function countEnterpriseUsers(enterpriseId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE enterprise_id = $1',
    [enterpriseId]
  );
  return parseInt(result?.count || '0', 10);
}

/**
 * Check if enterprise has capacity for more users
 */
export async function hasUserCapacity(enterpriseId: string): Promise<boolean> {
  const enterprise = await getEnterpriseById(enterpriseId);
  if (!enterprise) return false;

  const userCount = await countEnterpriseUsers(enterpriseId);
  return userCount < (enterprise.max_users || 5);
}

// ============================================================
// ENTERPRISE SUBSCRIPTION OPERATIONS
// ============================================================

/**
 * Update enterprise Stripe customer ID
 */
export async function updateEnterpriseStripeCustomer(
  enterpriseId: string,
  stripeCustomerId: string
): Promise<Enterprise | null> {
  return queryOne<Enterprise>(
    `UPDATE enterprises SET stripe_customer_id = $2, updated_at = NOW() WHERE enterprise_id = $1 RETURNING *`,
    [enterpriseId, stripeCustomerId]
  );
}

/**
 * Update enterprise subscription
 */
export async function updateEnterpriseSubscription(
  enterpriseId: string,
  update: {
    plan: EnterprisePlan;
    subscription_status: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
  }
): Promise<Enterprise | null> {
  const fields: string[] = ['plan = $2', 'subscription_status = $3', 'updated_at = NOW()'];
  const values: unknown[] = [enterpriseId, update.plan, update.subscription_status];
  let paramIndex = 4;

  if (update.stripe_subscription_id !== undefined) {
    fields.push(`stripe_subscription_id = $${paramIndex++}`);
    values.push(update.stripe_subscription_id);
  }

  if (update.stripe_customer_id !== undefined) {
    fields.push(`stripe_customer_id = $${paramIndex++}`);
    values.push(update.stripe_customer_id);
  }

  return queryOne<Enterprise>(
    `UPDATE enterprises SET ${fields.join(', ')} WHERE enterprise_id = $1 RETURNING *`,
    values
  );
}

/**
 * Get enterprise by Stripe customer ID
 */
export async function getEnterpriseByStripeCustomerId(stripeCustomerId: string): Promise<Enterprise | null> {
  return queryOne<Enterprise>(
    'SELECT * FROM enterprises WHERE stripe_customer_id = $1',
    [stripeCustomerId]
  );
}

/**
 * Get enterprise by Stripe subscription ID
 */
export async function getEnterpriseByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Enterprise | null> {
  return queryOne<Enterprise>(
    'SELECT * FROM enterprises WHERE stripe_subscription_id = $1',
    [stripeSubscriptionId]
  );
}

// ============================================================
// ENTERPRISE DEMO OPERATIONS
// ============================================================

/**
 * Create a demo enterprise
 */
export async function createDemoEnterprise(
  name: string,
  expiresInDays: number = 14
): Promise<Enterprise> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return createEnterprise({
    name,
    type: 'DEMO',
    plan: 'free',
    demo_expires_at: expiresAt,
  });
}

/**
 * Check if demo enterprise is expired
 */
export function isDemoExpired(enterprise: Enterprise): boolean {
  if (enterprise.type !== 'DEMO') return false;
  if (!enterprise.demo_expires_at) return false;
  return new Date() > new Date(enterprise.demo_expires_at);
}

/**
 * Get expired demo enterprises
 */
export async function getExpiredDemoEnterprises(): Promise<Enterprise[]> {
  return query<Enterprise>(
    `SELECT * FROM enterprises
     WHERE type = 'DEMO'
     AND status = 'ACTIVE'
     AND demo_expires_at IS NOT NULL
     AND demo_expires_at < NOW()`,
    []
  );
}

/**
 * Cleanup expired demo enterprises (soft delete)
 */
export async function cleanupExpiredDemoEnterprises(): Promise<number> {
  const result = await query<{ enterprise_id: string }>(
    `UPDATE enterprises
     SET status = 'DELETED', updated_at = NOW()
     WHERE type = 'DEMO'
     AND status = 'ACTIVE'
     AND demo_expires_at IS NOT NULL
     AND demo_expires_at < NOW()
     RETURNING enterprise_id`,
    []
  );
  return result.length;
}

// ============================================================
// ENTERPRISE STATISTICS
// ============================================================

/**
 * Get enterprise statistics
 */
export async function getEnterpriseStats(enterpriseId: string): Promise<{
  userCount: number;
  workspaceCount: number;
  discoveriesThisMonth: number;
  isAtUserLimit: boolean;
  isAtWorkspaceLimit: boolean;
}> {
  const enterprise = await getEnterpriseById(enterpriseId);
  if (!enterprise) {
    throw new Error('Enterprise not found');
  }

  // Get user count
  const userCountResult = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE enterprise_id = $1',
    [enterpriseId]
  );
  const userCount = parseInt(userCountResult?.count || '0', 10);

  // Get workspace count
  const workspaceCountResult = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM workspaces WHERE enterprise_id = $1',
    [enterpriseId]
  );
  const workspaceCount = parseInt(workspaceCountResult?.count || '0', 10);

  // Get discoveries this month (simplified - would need proper discoveries tracking)
  const discoveriesThisMonth = 0; // TODO: Implement when discoveries table exists

  return {
    userCount,
    workspaceCount,
    discoveriesThisMonth,
    isAtUserLimit: userCount >= (enterprise.max_users || 5),
    isAtWorkspaceLimit: workspaceCount >= (enterprise.max_workspaces || 3),
  };
}

// ============================================================
// MIGRATION HELPERS
// ============================================================

/**
 * Get or create enterprise for a domain (for signup)
 */
export async function getOrCreateEnterpriseForDomain(
  domain: string,
  companyName: string
): Promise<Enterprise> {
  // Try to find existing enterprise
  const existing = await getEnterpriseByDomain(domain);
  if (existing) return existing;

  // Create new enterprise
  return createEnterprise({
    name: companyName || domain,
    domain,
    plan: 'free',
  });
}

/**
 * Migrate tenant to enterprise (one-time migration)
 */
export async function migrateTenantToEnterprise(tenantId: string): Promise<Enterprise | null> {
  // Check if already migrated
  const existing = await getEnterpriseByLegacyTenantId(tenantId);
  if (existing) return existing;

  // Get tenant data
  const tenant = await queryOne<{
    id: string;
    name: string;
    domain: string | null;
    plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    subscription_status: string | null;
    max_users: number | null;
    max_discoveries_per_month: number | null;
    is_active: boolean | null;
    metadata: Record<string, unknown> | null;
  }>('SELECT * FROM tenants WHERE id = $1', [tenantId]);

  if (!tenant) return null;

  // Create enterprise from tenant
  const enterprise = await insert<Enterprise>(
    `INSERT INTO enterprises (
      name, region, type, domain, plan,
      stripe_customer_id, stripe_subscription_id, subscription_status,
      max_users, max_discoveries_per_month,
      status, metadata, legacy_tenant_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      tenant.name,
      'UAE', // Default region
      'REAL',
      tenant.domain,
      tenant.plan === 'solo' ? 'starter' : (tenant.plan || 'free'),
      tenant.stripe_customer_id,
      tenant.stripe_subscription_id,
      tenant.subscription_status || 'trialing',
      tenant.max_users || 5,
      tenant.max_discoveries_per_month || 100,
      tenant.is_active ? 'ACTIVE' : 'SUSPENDED',
      JSON.stringify(tenant.metadata || {}),
      tenantId,
    ]
  );

  return enterprise;
}

export default {
  // CRUD
  createEnterprise,
  getEnterpriseById,
  getEnterpriseByDomain,
  getEnterpriseByLegacyTenantId,
  updateEnterprise,
  deleteEnterprise,
  listEnterprises,

  // Users
  getEnterpriseUsers,
  countEnterpriseUsers,
  hasUserCapacity,

  // Subscription
  updateEnterpriseStripeCustomer,
  updateEnterpriseSubscription,
  getEnterpriseByStripeCustomerId,
  getEnterpriseByStripeSubscriptionId,

  // Demo
  createDemoEnterprise,
  isDemoExpired,
  getExpiredDemoEnterprises,
  cleanupExpiredDemoEnterprises,

  // Stats
  getEnterpriseStats,

  // Migration
  getOrCreateEnterpriseForDomain,
  migrateTenantToEnterprise,
};
