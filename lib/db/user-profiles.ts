/**
 * S298: User Profile Database Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Extended user profile operations for enterprise context.
 */

import { query, queryOne } from './client';
import { getEnterpriseById } from './enterprises';
import { getWorkspaceById } from './workspaces';
import { getDemoStatus } from './demo-policies';

// ============================================================
// TYPES
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar_url?: string;
  phone?: string;

  // Enterprise context
  enterprise_id: string | null;
  enterprise_name?: string;
  enterprise_type?: string;
  enterprise_plan?: string;

  // Workspace context
  workspace_id: string | null;
  workspace_name?: string;
  sub_vertical_id?: string;

  // Demo status
  is_demo: boolean;
  demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
  demo_expires_at: Date | null;
  demo_days_remaining: number | null;

  // Preferences
  preferences: UserPreferences;

  // Activity
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  locale?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar_url?: string;
  preferences?: Partial<UserPreferences>;
}

// ============================================================
// USER PROFILE OPERATIONS
// ============================================================

/**
 * Get full user profile with enterprise and workspace context
 */
export async function getFullUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await queryOne<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    phone: string | null;
    avatar_url: string | null;
    enterprise_id: string | null;
    workspace_id: string | null;
    is_demo: boolean;
    demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
    demo_expires_at: Date | null;
    preferences: Record<string, unknown> | null;
    last_login_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, email, name, role, phone, avatar_url,
            enterprise_id, workspace_id,
            is_demo, demo_type, demo_expires_at,
            preferences, last_login_at, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (!user) {
    return null;
  }

  // Get enterprise details
  let enterpriseName: string | undefined;
  let enterpriseType: string | undefined;
  let enterprisePlan: string | undefined;

  if (user.enterprise_id) {
    const enterprise = await getEnterpriseById(user.enterprise_id);
    if (enterprise) {
      enterpriseName = enterprise.name;
      enterpriseType = enterprise.type;
      enterprisePlan = enterprise.plan;
    }
  }

  // Get workspace details
  let workspaceName: string | undefined;
  let subVerticalId: string | undefined;

  if (user.workspace_id) {
    const workspace = await getWorkspaceById(user.workspace_id);
    if (workspace) {
      workspaceName = workspace.name;
      subVerticalId = workspace.sub_vertical_id;
    }
  }

  // Get demo status
  const demoStatus = await getDemoStatus(userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url || undefined,
    phone: user.phone || undefined,

    enterprise_id: user.enterprise_id,
    enterprise_name: enterpriseName,
    enterprise_type: enterpriseType,
    enterprise_plan: enterprisePlan,

    workspace_id: user.workspace_id,
    workspace_name: workspaceName,
    sub_vertical_id: subVerticalId,

    is_demo: user.is_demo,
    demo_type: user.demo_type,
    demo_expires_at: user.demo_expires_at,
    demo_days_remaining: demoStatus.days_remaining,

    preferences: (user.preferences || {}) as UserPreferences,

    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfile | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(input.phone);
  }
  if (input.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(input.avatar_url);
  }
  if (input.preferences !== undefined) {
    // Merge with existing preferences
    const currentPrefs = await getUserPreferences(userId);
    const mergedPrefs = { ...currentPrefs, ...input.preferences };
    fields.push(`preferences = $${paramIndex++}`);
    values.push(JSON.stringify(mergedPrefs));
  }

  if (fields.length === 0) {
    return getFullUserProfile(userId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  await queryOne(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );

  return getFullUserProfile(userId);
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const result = await queryOne<{ preferences: Record<string, unknown> | null }>(
    'SELECT preferences FROM users WHERE id = $1',
    [userId]
  );

  return (result?.preferences || {}) as UserPreferences;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await getUserPreferences(userId);
  const merged = { ...current, ...preferences };

  await query(
    'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(merged), userId]
  );

  return merged;
}

/**
 * Record user login
 */
export async function recordUserLogin(userId: string): Promise<void> {
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [userId]
  );
}

// ============================================================
// ENTERPRISE USER OPERATIONS
// ============================================================

/**
 * Get user's enterprise role
 */
export async function getUserEnterpriseRole(userId: string): Promise<{
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  enterpriseId: string | null;
}> {
  const user = await queryOne<{
    role: string;
    enterprise_id: string | null;
  }>(
    'SELECT role, enterprise_id FROM users WHERE id = $1',
    [userId]
  );

  if (!user) {
    return {
      role: 'INDIVIDUAL_USER',
      isAdmin: false,
      isSuperAdmin: false,
      enterpriseId: null,
    };
  }

  return {
    role: user.role,
    isAdmin: ['ENTERPRISE_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role),
    isSuperAdmin: user.role === 'SUPER_ADMIN',
    enterpriseId: user.enterprise_id,
  };
}

/**
 * Change user's workspace
 */
export async function changeUserWorkspace(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Verify workspace exists
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Update user's workspace
  await query(
    'UPDATE users SET workspace_id = $1, updated_at = NOW() WHERE id = $2',
    [workspaceId, userId]
  );

  return true;
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string): Promise<{
  totalDiscoveries: number;
  totalActions: number;
  lastActivity: Date | null;
}> {
  // For now, return mock data. Would need activity tracking tables.
  const user = await queryOne<{ last_login_at: Date | null }>(
    'SELECT last_login_at FROM users WHERE id = $1',
    [userId]
  );

  return {
    totalDiscoveries: 0, // TODO: Implement with activity tracking
    totalActions: 0,     // TODO: Implement with activity tracking
    lastActivity: user?.last_login_at || null,
  };
}

// ============================================================
// PROFILE VALIDATION
// ============================================================

/**
 * Validate profile update data
 */
export function validateProfileUpdate(input: UpdateProfileInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (input.name !== undefined && input.name.length > 255) {
    errors.push('Name must be less than 255 characters');
  }

  if (input.phone !== undefined) {
    // Basic phone validation
    const phoneRegex = /^[\d\s+\-()]+$/;
    if (!phoneRegex.test(input.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  if (input.avatar_url !== undefined) {
    try {
      new URL(input.avatar_url);
    } catch {
      errors.push('Invalid avatar URL');
    }
  }

  if (input.preferences?.theme) {
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(input.preferences.theme)) {
      errors.push('Invalid theme preference');
    }
  }

  return { valid: errors.length === 0, errors };
}

export default {
  // Profile
  getFullUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  recordUserLogin,

  // Enterprise role
  getUserEnterpriseRole,
  changeUserWorkspace,
  getUserActivitySummary,

  // Validation
  validateProfileUpdate,
};
