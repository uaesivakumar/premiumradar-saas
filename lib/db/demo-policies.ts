/**
 * S294: Demo Policy Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Config-driven demo behavior - NO HARDCODING.
 * All demo limits and behavior come from demo_policies table.
 */

import { query, queryOne, insert } from './client';

// ============================================================
// TYPES
// ============================================================

export type DemoPolicyScope = 'INDIVIDUAL_REAL' | 'INDIVIDUAL_SYSTEM' | 'ENTERPRISE';

export interface DemoPolicy {
  id: string;
  name: string;
  scope: DemoPolicyScope;

  // Duration limits
  max_duration_days: number | null;
  idle_expiry_hours: number | null;

  // User limits
  max_users: number | null;

  // Action limits
  max_actions_per_day: number | null;
  max_discoveries_per_day: number | null;

  // Feature limits
  allow_exports: boolean;
  allow_automation: boolean;
  allow_api_access: boolean;

  // Metadata
  is_active: boolean;
  priority: number;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDemoPolicyInput {
  name: string;
  scope: DemoPolicyScope;
  max_duration_days?: number;
  idle_expiry_hours?: number;
  max_users?: number;
  max_actions_per_day?: number;
  max_discoveries_per_day?: number;
  allow_exports?: boolean;
  allow_automation?: boolean;
  allow_api_access?: boolean;
  priority?: number;
  created_by?: string;
}

export interface UpdateDemoPolicyInput {
  name?: string;
  max_duration_days?: number | null;
  idle_expiry_hours?: number | null;
  max_users?: number | null;
  max_actions_per_day?: number | null;
  max_discoveries_per_day?: number | null;
  allow_exports?: boolean;
  allow_automation?: boolean;
  allow_api_access?: boolean;
  is_active?: boolean;
  priority?: number;
}

export interface DemoEvaluationResult {
  is_allowed: boolean;
  policy: DemoPolicy | null;
  denial_reason?: string;
  expires_at?: Date;
  actions_remaining?: number;
  discoveries_remaining?: number;
}

// ============================================================
// DEMO POLICY CRUD
// ============================================================

/**
 * Create a new demo policy
 */
export async function createDemoPolicy(input: CreateDemoPolicyInput): Promise<DemoPolicy> {
  return insert<DemoPolicy>(
    `INSERT INTO demo_policies (
      name, scope,
      max_duration_days, idle_expiry_hours, max_users,
      max_actions_per_day, max_discoveries_per_day,
      allow_exports, allow_automation, allow_api_access,
      priority, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      input.name,
      input.scope,
      input.max_duration_days || null,
      input.idle_expiry_hours || null,
      input.max_users || null,
      input.max_actions_per_day || null,
      input.max_discoveries_per_day || null,
      input.allow_exports ?? false,
      input.allow_automation ?? false,
      input.allow_api_access ?? false,
      input.priority || 0,
      input.created_by || null,
    ]
  );
}

/**
 * Get demo policy by ID
 */
export async function getDemoPolicyById(policyId: string): Promise<DemoPolicy | null> {
  return queryOne<DemoPolicy>(
    'SELECT * FROM demo_policies WHERE id = $1',
    [policyId]
  );
}

/**
 * Get active policies for a scope (ordered by priority)
 */
export async function getPoliciesForScope(scope: DemoPolicyScope): Promise<DemoPolicy[]> {
  return query<DemoPolicy>(
    `SELECT * FROM demo_policies
     WHERE scope = $1 AND is_active = true
     ORDER BY priority DESC`,
    [scope]
  );
}

/**
 * Get highest priority policy for a scope
 */
export async function getActivePolicy(scope: DemoPolicyScope): Promise<DemoPolicy | null> {
  return queryOne<DemoPolicy>(
    `SELECT * FROM demo_policies
     WHERE scope = $1 AND is_active = true
     ORDER BY priority DESC
     LIMIT 1`,
    [scope]
  );
}

/**
 * Update demo policy
 */
export async function updateDemoPolicy(
  policyId: string,
  input: UpdateDemoPolicyInput
): Promise<DemoPolicy | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.max_duration_days !== undefined) {
    fields.push(`max_duration_days = $${paramIndex++}`);
    values.push(input.max_duration_days);
  }
  if (input.idle_expiry_hours !== undefined) {
    fields.push(`idle_expiry_hours = $${paramIndex++}`);
    values.push(input.idle_expiry_hours);
  }
  if (input.max_users !== undefined) {
    fields.push(`max_users = $${paramIndex++}`);
    values.push(input.max_users);
  }
  if (input.max_actions_per_day !== undefined) {
    fields.push(`max_actions_per_day = $${paramIndex++}`);
    values.push(input.max_actions_per_day);
  }
  if (input.max_discoveries_per_day !== undefined) {
    fields.push(`max_discoveries_per_day = $${paramIndex++}`);
    values.push(input.max_discoveries_per_day);
  }
  if (input.allow_exports !== undefined) {
    fields.push(`allow_exports = $${paramIndex++}`);
    values.push(input.allow_exports);
  }
  if (input.allow_automation !== undefined) {
    fields.push(`allow_automation = $${paramIndex++}`);
    values.push(input.allow_automation);
  }
  if (input.allow_api_access !== undefined) {
    fields.push(`allow_api_access = $${paramIndex++}`);
    values.push(input.allow_api_access);
  }
  if (input.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(input.is_active);
  }
  if (input.priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`);
    values.push(input.priority);
  }

  if (fields.length === 0) {
    return getDemoPolicyById(policyId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(policyId);

  return queryOne<DemoPolicy>(
    `UPDATE demo_policies SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

/**
 * Delete demo policy
 */
export async function deleteDemoPolicy(policyId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM demo_policies WHERE id = $1',
    [policyId]
  );
  return true;
}

/**
 * List all demo policies
 */
export async function listDemoPolicies(options?: {
  scope?: DemoPolicyScope;
  includeInactive?: boolean;
}): Promise<DemoPolicy[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (options?.scope) {
    conditions.push(`scope = $${paramIndex++}`);
    values.push(options.scope);
  }

  if (!options?.includeInactive) {
    conditions.push(`is_active = true`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return query<DemoPolicy>(
    `SELECT * FROM demo_policies ${whereClause} ORDER BY scope, priority DESC`,
    values
  );
}

// ============================================================
// DEMO POLICY EVALUATION
// ============================================================

/**
 * Evaluate demo policy for a user
 * This is the CORE function - all demo behavior flows through here
 */
export async function evaluateDemoPolicy(
  userId: string,
  action: 'discovery' | 'action' | 'export' | 'automation' | 'api_access'
): Promise<DemoEvaluationResult> {
  // Get user's demo context
  const user = await queryOne<{
    id: string;
    is_demo: boolean;
    demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
    demo_expires_at: Date | null;
    role: string;
    enterprise_id: string | null;
  }>(
    `SELECT id, is_demo, demo_type, demo_expires_at, role, enterprise_id FROM users WHERE id = $1`,
    [userId]
  );

  if (!user) {
    return {
      is_allowed: false,
      policy: null,
      denial_reason: 'User not found',
    };
  }

  // Not a demo user - always allowed
  if (!user.is_demo) {
    return {
      is_allowed: true,
      policy: null,
    };
  }

  // Determine policy scope
  let scope: DemoPolicyScope;
  if (user.demo_type === 'SYSTEM') {
    scope = 'INDIVIDUAL_SYSTEM';
  } else if (user.enterprise_id) {
    scope = 'ENTERPRISE';
  } else {
    scope = 'INDIVIDUAL_REAL';
  }

  // Get applicable policy
  const policy = await getActivePolicy(scope);

  if (!policy) {
    // No policy defined - deny by default for safety
    return {
      is_allowed: false,
      policy: null,
      denial_reason: 'No demo policy configured for this scope',
    };
  }

  // Check expiry
  if (user.demo_expires_at && new Date() > new Date(user.demo_expires_at)) {
    return {
      is_allowed: false,
      policy,
      denial_reason: 'Demo has expired',
    };
  }

  // Check feature-specific permissions
  if (action === 'export' && !policy.allow_exports) {
    return {
      is_allowed: false,
      policy,
      denial_reason: 'Exports are not allowed in demo mode',
    };
  }

  if (action === 'automation' && !policy.allow_automation) {
    return {
      is_allowed: false,
      policy,
      denial_reason: 'Automation is not allowed in demo mode',
    };
  }

  if (action === 'api_access' && !policy.allow_api_access) {
    return {
      is_allowed: false,
      policy,
      denial_reason: 'API access is not allowed in demo mode',
    };
  }

  // Check daily limits for actions/discoveries
  if ((action === 'action' || action === 'discovery') && policy.max_actions_per_day) {
    const actionsToday = await countUserActionsToday(userId);
    if (actionsToday >= policy.max_actions_per_day) {
      return {
        is_allowed: false,
        policy,
        denial_reason: 'Daily action limit reached',
        actions_remaining: 0,
      };
    }
  }

  if (action === 'discovery' && policy.max_discoveries_per_day) {
    const discoveriesToday = await countUserDiscoveriesToday(userId);
    if (discoveriesToday >= policy.max_discoveries_per_day) {
      return {
        is_allowed: false,
        policy,
        denial_reason: 'Daily discovery limit reached',
        discoveries_remaining: 0,
      };
    }
  }

  // Calculate remaining
  const actionsRemaining = policy.max_actions_per_day
    ? policy.max_actions_per_day - (await countUserActionsToday(userId))
    : undefined;

  const discoveriesRemaining = policy.max_discoveries_per_day
    ? policy.max_discoveries_per_day - (await countUserDiscoveriesToday(userId))
    : undefined;

  return {
    is_allowed: true,
    policy,
    expires_at: user.demo_expires_at || undefined,
    actions_remaining: actionsRemaining,
    discoveries_remaining: discoveriesRemaining,
  };
}

// ============================================================
// DEMO USAGE TRACKING
// ============================================================

/**
 * Count user actions today
 * Uses a simple counter table (would need to be created)
 */
async function countUserActionsToday(userId: string): Promise<number> {
  // For now, return 0 - would need demo_usage_tracking table
  // TODO: Implement with actual tracking table
  return 0;
}

/**
 * Count user discoveries today
 */
async function countUserDiscoveriesToday(userId: string): Promise<number> {
  // For now, return 0 - would need demo_usage_tracking table
  // TODO: Implement with actual tracking table
  return 0;
}

/**
 * Record a demo action (for tracking)
 */
export async function recordDemoAction(
  userId: string,
  actionType: 'discovery' | 'action' | 'export' | 'automation' | 'api_access'
): Promise<void> {
  // TODO: Implement with actual tracking table
  // For now, this is a no-op placeholder
  console.log(`[DEMO] Recording action: ${actionType} for user ${userId}`);
}

// ============================================================
// DEMO LIFECYCLE
// ============================================================

/**
 * Check if demo should be expired based on idle time
 */
export async function checkIdleExpiry(userId: string): Promise<boolean> {
  const user = await queryOne<{
    is_demo: boolean;
    demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
    last_login_at: Date | null;
    enterprise_id: string | null;
  }>(
    `SELECT is_demo, demo_type, last_login_at, enterprise_id FROM users WHERE id = $1`,
    [userId]
  );

  if (!user || !user.is_demo) {
    return false;
  }

  // Determine scope and get policy
  let scope: DemoPolicyScope;
  if (user.demo_type === 'SYSTEM') {
    scope = 'INDIVIDUAL_SYSTEM';
  } else if (user.enterprise_id) {
    scope = 'ENTERPRISE';
  } else {
    scope = 'INDIVIDUAL_REAL';
  }

  const policy = await getActivePolicy(scope);
  if (!policy || !policy.idle_expiry_hours) {
    return false;
  }

  // Check if idle too long
  if (!user.last_login_at) {
    return false;
  }

  const idleHours = (Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60);
  return idleHours > policy.idle_expiry_hours;
}

/**
 * Expire demo user
 */
export async function expireDemo(userId: string): Promise<void> {
  await query(
    `UPDATE users SET demo_expires_at = NOW() WHERE id = $1`,
    [userId]
  );
}

/**
 * Get demo status for a user
 */
export async function getDemoStatus(userId: string): Promise<{
  is_demo: boolean;
  demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
  expires_at: Date | null;
  is_expired: boolean;
  policy: DemoPolicy | null;
  days_remaining: number | null;
}> {
  const user = await queryOne<{
    is_demo: boolean;
    demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
    demo_expires_at: Date | null;
    enterprise_id: string | null;
  }>(
    `SELECT is_demo, demo_type, demo_expires_at, enterprise_id FROM users WHERE id = $1`,
    [userId]
  );

  if (!user) {
    return {
      is_demo: false,
      demo_type: null,
      expires_at: null,
      is_expired: false,
      policy: null,
      days_remaining: null,
    };
  }

  if (!user.is_demo) {
    return {
      is_demo: false,
      demo_type: null,
      expires_at: null,
      is_expired: false,
      policy: null,
      days_remaining: null,
    };
  }

  // Get applicable policy
  let scope: DemoPolicyScope;
  if (user.demo_type === 'SYSTEM') {
    scope = 'INDIVIDUAL_SYSTEM';
  } else if (user.enterprise_id) {
    scope = 'ENTERPRISE';
  } else {
    scope = 'INDIVIDUAL_REAL';
  }

  const policy = await getActivePolicy(scope);

  const isExpired = user.demo_expires_at ? new Date() > new Date(user.demo_expires_at) : false;

  let daysRemaining: number | null = null;
  if (user.demo_expires_at && !isExpired) {
    daysRemaining = Math.ceil(
      (new Date(user.demo_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    is_demo: true,
    demo_type: user.demo_type,
    expires_at: user.demo_expires_at,
    is_expired: isExpired,
    policy,
    days_remaining: daysRemaining,
  };
}

export default {
  // CRUD
  createDemoPolicy,
  getDemoPolicyById,
  getPoliciesForScope,
  getActivePolicy,
  updateDemoPolicy,
  deleteDemoPolicy,
  listDemoPolicies,

  // Evaluation
  evaluateDemoPolicy,
  recordDemoAction,

  // Lifecycle
  checkIdleExpiry,
  expireDemo,
  getDemoStatus,
};
