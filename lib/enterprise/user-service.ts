/**
 * S323: Enterprise User Service
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Enterprise Service Layer
 *
 * Server-side service for enterprise user operations.
 */

import { query, queryOne } from '@/lib/db/client';
import { getEnterpriseUsers, countEnterpriseUsers, hasUserCapacity } from '@/lib/db/enterprises';
import { assignUserToWorkspace, removeUserFromWorkspace } from '@/lib/db/workspaces';
import type { EnterpriseRole, EnterpriseUser } from './types';

export class EnterpriseUserService {
  /**
   * Get all users in an enterprise
   */
  static async getUsers(enterpriseId: string): Promise<EnterpriseUser[]> {
    const users = await getEnterpriseUsers(enterpriseId);
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as EnterpriseRole,
      enterpriseId,
      workspaceId: u.workspace_id,
      isDemo: u.is_demo,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
    }));
  }

  /**
   * Count users in an enterprise
   */
  static async countUsers(enterpriseId: string): Promise<number> {
    return countEnterpriseUsers(enterpriseId);
  }

  /**
   * Check if enterprise can add more users
   */
  static async canAddUser(enterpriseId: string): Promise<boolean> {
    return hasUserCapacity(enterpriseId);
  }

  /**
   * Update user role
   */
  static async updateRole(userId: string, role: EnterpriseRole): Promise<void> {
    await query(
      'UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1',
      [userId, role]
    );
  }

  /**
   * Move user to a different workspace
   */
  static async moveToWorkspace(userId: string, workspaceId: string): Promise<void> {
    return assignUserToWorkspace(userId, workspaceId);
  }

  /**
   * Remove user from workspace (but keep in enterprise)
   */
  static async removeFromWorkspace(userId: string): Promise<void> {
    return removeUserFromWorkspace(userId);
  }

  /**
   * Remove user from enterprise entirely
   */
  static async removeFromEnterprise(userId: string): Promise<void> {
    await query(
      'UPDATE users SET enterprise_id = NULL, workspace_id = NULL, is_active = false, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Get user by ID with enterprise context
   */
  static async getUser(userId: string): Promise<EnterpriseUser | null> {
    const user = await queryOne<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      enterprise_id: string | null;
      workspace_id: string | null;
      is_demo: boolean;
      created_at: Date;
      last_login_at: Date | null;
    }>(
      'SELECT id, email, name, role, enterprise_id, workspace_id, is_demo, created_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );

    if (!user || !user.enterprise_id) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as EnterpriseRole,
      enterpriseId: user.enterprise_id,
      workspaceId: user.workspace_id,
      isDemo: user.is_demo,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    };
  }

  /**
   * Check if user is enterprise admin
   */
  static async isEnterpriseAdmin(userId: string, enterpriseId: string): Promise<boolean> {
    const user = await queryOne<{ role: string; enterprise_id: string }>(
      'SELECT role, enterprise_id FROM users WHERE id = $1',
      [userId]
    );

    if (!user || user.enterprise_id !== enterpriseId) return false;

    return user.role === 'ENTERPRISE_ADMIN' || user.role === 'SUPER_ADMIN';
  }

  /**
   * Check if user belongs to enterprise
   */
  static async belongsToEnterprise(userId: string, enterpriseId: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND enterprise_id = $2) as exists',
      [userId, enterpriseId]
    );
    return result?.exists || false;
  }

  /**
   * Check if user belongs to workspace
   */
  static async belongsToWorkspace(userId: string, workspaceId: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND workspace_id = $2) as exists',
      [userId, workspaceId]
    );
    return result?.exists || false;
  }
}

export default EnterpriseUserService;
