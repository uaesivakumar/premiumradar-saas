/**
 * S290: Workspace Database Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Real PostgreSQL operations for workspaces.
 * Each enterprise can have multiple workspaces.
 */

import { query, queryOne, insert, getPool } from './client';

// ============================================================
// TYPES
// ============================================================

export type WorkspaceStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface Workspace {
  workspace_id: string;
  enterprise_id: string;
  name: string;
  sub_vertical_id: string;
  status: WorkspaceStatus;
  created_at: Date;
  updated_at: Date;

  // Optional fields
  slug?: string;
  is_default?: boolean;
  settings?: Record<string, unknown>;
}

export interface WorkspaceWithSubVertical extends Workspace {
  sub_vertical?: {
    id: string;
    key: string;
    name: string;
    vertical_id: string;
  };
}

export interface CreateWorkspaceInput {
  enterprise_id: string;
  name: string;
  sub_vertical_id: string;
  slug?: string;
  is_default?: boolean;
  settings?: Record<string, unknown>;
}

export interface UpdateWorkspaceInput {
  name?: string;
  sub_vertical_id?: string;
  slug?: string;
  is_default?: boolean;
  settings?: Record<string, unknown>;
  status?: WorkspaceStatus;
}

// ============================================================
// WORKSPACE CRUD OPERATIONS
// ============================================================

/**
 * Create a new workspace
 */
export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  // If this is the first workspace or marked as default, ensure no other defaults exist
  if (input.is_default) {
    await query(
      'UPDATE workspaces SET is_default = false WHERE enterprise_id = $1',
      [input.enterprise_id]
    );
  }

  const result = await insert<Workspace>(
    `INSERT INTO workspaces (
      enterprise_id, name, sub_vertical_id, slug, is_default, settings
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      input.enterprise_id,
      input.name,
      input.sub_vertical_id,
      input.slug || null,
      input.is_default || false,
      input.settings ? JSON.stringify(input.settings) : '{}',
    ]
  );
  return result;
}

/**
 * Get workspace by ID
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  return queryOne<Workspace>(
    'SELECT * FROM workspaces WHERE workspace_id = $1',
    [workspaceId]
  );
}

/**
 * Get workspace with sub-vertical info
 */
export async function getWorkspaceWithSubVertical(workspaceId: string): Promise<WorkspaceWithSubVertical | null> {
  const result = await queryOne<WorkspaceWithSubVertical & {
    sv_id: string;
    sv_key: string;
    sv_name: string;
    sv_vertical_id: string;
  }>(
    `SELECT w.*,
            sv.id as sv_id, sv.key as sv_key, sv.name as sv_name, sv.vertical_id as sv_vertical_id
     FROM workspaces w
     LEFT JOIN os_sub_verticals sv ON w.sub_vertical_id = sv.id
     WHERE w.workspace_id = $1`,
    [workspaceId]
  );

  if (!result) return null;

  return {
    ...result,
    sub_vertical: result.sv_id ? {
      id: result.sv_id,
      key: result.sv_key,
      name: result.sv_name,
      vertical_id: result.sv_vertical_id,
    } : undefined,
  };
}

/**
 * Get workspace by slug within an enterprise
 */
export async function getWorkspaceBySlug(
  enterpriseId: string,
  slug: string
): Promise<Workspace | null> {
  return queryOne<Workspace>(
    'SELECT * FROM workspaces WHERE enterprise_id = $1 AND slug = $2 AND status = $3',
    [enterpriseId, slug, 'ACTIVE']
  );
}

/**
 * Get default workspace for an enterprise
 */
export async function getDefaultWorkspace(enterpriseId: string): Promise<Workspace | null> {
  return queryOne<Workspace>(
    'SELECT * FROM workspaces WHERE enterprise_id = $1 AND is_default = true AND status = $2',
    [enterpriseId, 'ACTIVE']
  );
}

/**
 * Update workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput
): Promise<Workspace | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.sub_vertical_id !== undefined) {
    fields.push(`sub_vertical_id = $${paramIndex++}`);
    values.push(input.sub_vertical_id);
  }
  if (input.slug !== undefined) {
    fields.push(`slug = $${paramIndex++}`);
    values.push(input.slug);
  }
  if (input.is_default !== undefined) {
    fields.push(`is_default = $${paramIndex++}`);
    values.push(input.is_default);
  }
  if (input.settings !== undefined) {
    fields.push(`settings = $${paramIndex++}`);
    values.push(JSON.stringify(input.settings));
  }
  if (input.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(input.status);
  }

  if (fields.length === 0) {
    return getWorkspaceById(workspaceId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(workspaceId);

  // If setting as default, clear other defaults
  if (input.is_default) {
    const workspace = await getWorkspaceById(workspaceId);
    if (workspace) {
      await query(
        'UPDATE workspaces SET is_default = false WHERE enterprise_id = $1 AND workspace_id != $2',
        [workspace.enterprise_id, workspaceId]
      );
    }
  }

  return queryOne<Workspace>(
    `UPDATE workspaces SET ${fields.join(', ')} WHERE workspace_id = $${paramIndex} RETURNING *`,
    values
  );
}

/**
 * Soft delete workspace (set status to DELETED)
 */
export async function deleteWorkspace(workspaceId: string): Promise<Workspace | null> {
  return queryOne<Workspace>(
    `UPDATE workspaces SET status = 'DELETED', updated_at = NOW() WHERE workspace_id = $1 RETURNING *`,
    [workspaceId]
  );
}

// ============================================================
// ENTERPRISE WORKSPACE OPERATIONS
// ============================================================

/**
 * List workspaces for an enterprise
 */
export async function listEnterpriseWorkspaces(
  enterpriseId: string,
  options?: {
    includeDeleted?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ workspaces: Workspace[]; total: number }> {
  const conditions: string[] = ['enterprise_id = $1'];
  const values: unknown[] = [enterpriseId];
  let paramIndex = 2;

  if (!options?.includeDeleted) {
    conditions.push(`status != 'DELETED'`);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM workspaces WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult?.count || '0', 10);

  // Get paginated results
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const workspaces = await query<Workspace>(
    `SELECT * FROM workspaces WHERE ${whereClause}
     ORDER BY is_default DESC, created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  return { workspaces, total };
}

/**
 * Count workspaces for an enterprise
 */
export async function countEnterpriseWorkspaces(enterpriseId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM workspaces WHERE enterprise_id = $1 AND status != 'DELETED'`,
    [enterpriseId]
  );
  return parseInt(result?.count || '0', 10);
}

/**
 * Check if enterprise can create more workspaces
 */
export async function canCreateWorkspace(enterpriseId: string): Promise<boolean> {
  // Get enterprise limits
  const enterprise = await queryOne<{ max_workspaces: number }>(
    'SELECT max_workspaces FROM enterprises WHERE enterprise_id = $1',
    [enterpriseId]
  );
  if (!enterprise) return false;

  const workspaceCount = await countEnterpriseWorkspaces(enterpriseId);
  return workspaceCount < (enterprise.max_workspaces || 3);
}

// ============================================================
// WORKSPACE USER OPERATIONS
// ============================================================

/**
 * Get users in a workspace
 */
export async function getWorkspaceUsers(workspaceId: string): Promise<Array<{
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_demo: boolean;
  created_at: Date;
  last_login_at: Date | null;
}>> {
  return query(
    `SELECT id, email, name, role, is_demo, created_at, last_login_at
     FROM users
     WHERE workspace_id = $1
     ORDER BY created_at DESC`,
    [workspaceId]
  );
}

/**
 * Count users in a workspace
 */
export async function countWorkspaceUsers(workspaceId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM users WHERE workspace_id = $1',
    [workspaceId]
  );
  return parseInt(result?.count || '0', 10);
}

/**
 * Assign user to workspace
 */
export async function assignUserToWorkspace(
  userId: string,
  workspaceId: string
): Promise<void> {
  await query(
    'UPDATE users SET workspace_id = $2 WHERE id = $1',
    [userId, workspaceId]
  );
}

/**
 * Remove user from workspace (but keep in enterprise)
 */
export async function removeUserFromWorkspace(userId: string): Promise<void> {
  await query(
    'UPDATE users SET workspace_id = NULL WHERE id = $1',
    [userId]
  );
}

// ============================================================
// WORKSPACE SETTINGS
// ============================================================

/**
 * Get workspace settings
 */
export async function getWorkspaceSettings(workspaceId: string): Promise<Record<string, unknown> | null> {
  const workspace = await getWorkspaceById(workspaceId);
  return workspace?.settings || null;
}

/**
 * Update workspace settings
 */
export async function updateWorkspaceSettings(
  workspaceId: string,
  settings: Record<string, unknown>
): Promise<Workspace | null> {
  return updateWorkspace(workspaceId, { settings });
}

/**
 * Merge workspace settings (partial update)
 */
export async function mergeWorkspaceSettings(
  workspaceId: string,
  partialSettings: Record<string, unknown>
): Promise<Workspace | null> {
  const current = await getWorkspaceSettings(workspaceId);
  const merged = { ...current, ...partialSettings };
  return updateWorkspace(workspaceId, { settings: merged });
}

// ============================================================
// DEFAULT WORKSPACE OPERATIONS
// ============================================================

/**
 * Create default workspace for a new enterprise
 */
export async function createDefaultWorkspace(
  enterpriseId: string,
  subVerticalId: string,
  name: string = 'Default Workspace'
): Promise<Workspace> {
  return createWorkspace({
    enterprise_id: enterpriseId,
    name,
    sub_vertical_id: subVerticalId,
    is_default: true,
  });
}

/**
 * Set workspace as default
 */
export async function setDefaultWorkspace(workspaceId: string): Promise<Workspace | null> {
  return updateWorkspace(workspaceId, { is_default: true });
}

/**
 * Get or create default workspace
 */
export async function getOrCreateDefaultWorkspace(
  enterpriseId: string,
  subVerticalId: string
): Promise<Workspace> {
  const existing = await getDefaultWorkspace(enterpriseId);
  if (existing) return existing;

  return createDefaultWorkspace(enterpriseId, subVerticalId);
}

// ============================================================
// WORKSPACE STATISTICS
// ============================================================

/**
 * Get workspace statistics
 */
export async function getWorkspaceStats(workspaceId: string): Promise<{
  userCount: number;
  isDefault: boolean;
  subVerticalKey: string | null;
}> {
  const workspace = await getWorkspaceWithSubVertical(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const userCount = await countWorkspaceUsers(workspaceId);

  return {
    userCount,
    isDefault: workspace.is_default || false,
    subVerticalKey: workspace.sub_vertical?.key || null,
  };
}

export default {
  // CRUD
  createWorkspace,
  getWorkspaceById,
  getWorkspaceWithSubVertical,
  getWorkspaceBySlug,
  getDefaultWorkspace,
  updateWorkspace,
  deleteWorkspace,

  // Enterprise operations
  listEnterpriseWorkspaces,
  countEnterpriseWorkspaces,
  canCreateWorkspace,

  // User operations
  getWorkspaceUsers,
  countWorkspaceUsers,
  assignUserToWorkspace,
  removeUserFromWorkspace,

  // Settings
  getWorkspaceSettings,
  updateWorkspaceSettings,
  mergeWorkspaceSettings,

  // Default workspace
  createDefaultWorkspace,
  setDefaultWorkspace,
  getOrCreateDefaultWorkspace,

  // Stats
  getWorkspaceStats,
};
