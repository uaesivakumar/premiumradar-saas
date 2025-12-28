/**
 * S323: Workspace Service
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Enterprise Service Layer
 *
 * Server-side service for workspace operations.
 */

import {
  getWorkspaceById,
  getWorkspaceWithSubVertical,
  getDefaultWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listEnterpriseWorkspaces,
  countEnterpriseWorkspaces,
  canCreateWorkspace,
  getOrCreateDefaultWorkspace,
  assignUserToWorkspace,
  removeUserFromWorkspace,
  getWorkspaceUsers,
  countWorkspaceUsers,
} from '@/lib/db/workspaces';
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceSummary } from './types';

export class WorkspaceService {
  /**
   * Get workspace by ID
   */
  static async getById(workspaceId: string): Promise<Workspace | null> {
    return getWorkspaceById(workspaceId);
  }

  /**
   * Get workspace with sub-vertical info
   */
  static async getWithSubVertical(workspaceId: string) {
    return getWorkspaceWithSubVertical(workspaceId);
  }

  /**
   * Get default workspace for an enterprise
   */
  static async getDefault(enterpriseId: string): Promise<Workspace | null> {
    return getDefaultWorkspace(enterpriseId);
  }

  /**
   * Create a new workspace
   */
  static async create(input: CreateWorkspaceInput): Promise<Workspace> {
    return createWorkspace(input);
  }

  /**
   * Update a workspace
   */
  static async update(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace | null> {
    return updateWorkspace(workspaceId, input);
  }

  /**
   * Delete (soft) a workspace
   */
  static async delete(workspaceId: string): Promise<Workspace | null> {
    return deleteWorkspace(workspaceId);
  }

  /**
   * List workspaces for an enterprise
   */
  static async listForEnterprise(
    enterpriseId: string,
    options?: { includeDeleted?: boolean; limit?: number; offset?: number }
  ): Promise<{ workspaces: Workspace[]; total: number }> {
    return listEnterpriseWorkspaces(enterpriseId, options);
  }

  /**
   * Get workspace summaries for an enterprise
   */
  static async getSummaries(enterpriseId: string): Promise<WorkspaceSummary[]> {
    const { workspaces } = await listEnterpriseWorkspaces(enterpriseId);

    const summaries: WorkspaceSummary[] = [];
    for (const workspace of workspaces) {
      const withSubVertical = await getWorkspaceWithSubVertical(workspace.workspace_id);
      const userCount = await countWorkspaceUsers(workspace.workspace_id);

      summaries.push({
        workspaceId: workspace.workspace_id,
        name: workspace.name,
        subVerticalKey: withSubVertical?.sub_vertical?.key || 'unknown',
        userCount,
        isDefault: workspace.is_default || false,
      });
    }

    return summaries;
  }

  /**
   * Count workspaces for an enterprise
   */
  static async countForEnterprise(enterpriseId: string): Promise<number> {
    return countEnterpriseWorkspaces(enterpriseId);
  }

  /**
   * Check if enterprise can create more workspaces
   */
  static async canCreate(enterpriseId: string): Promise<boolean> {
    return canCreateWorkspace(enterpriseId);
  }

  /**
   * Get or create default workspace
   */
  static async getOrCreateDefault(enterpriseId: string, subVerticalId: string): Promise<Workspace> {
    return getOrCreateDefaultWorkspace(enterpriseId, subVerticalId);
  }

  /**
   * Assign user to workspace
   */
  static async assignUser(userId: string, workspaceId: string): Promise<void> {
    return assignUserToWorkspace(userId, workspaceId);
  }

  /**
   * Remove user from workspace
   */
  static async removeUser(userId: string): Promise<void> {
    return removeUserFromWorkspace(userId);
  }

  /**
   * Get users in a workspace
   */
  static async getUsers(workspaceId: string) {
    return getWorkspaceUsers(workspaceId);
  }

  /**
   * Count users in a workspace
   */
  static async countUsers(workspaceId: string): Promise<number> {
    return countWorkspaceUsers(workspaceId);
  }
}

export default WorkspaceService;
