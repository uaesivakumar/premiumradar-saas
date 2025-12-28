'use client';

/**
 * S323: Enterprise Hooks
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Enterprise Service Layer
 *
 * React hooks for enterprise operations.
 */

import { useState, useCallback } from 'react';
import { useEnterpriseContext } from './context';
import type { EnterpriseUser, WorkspaceSummary, EnterpriseRole } from './types';

// Hook for managing enterprise users
export function useEnterpriseUsers() {
  const { context, canManageUsers } = useEnterpriseContext();
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!context?.enterpriseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enterprise/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [context?.enterpriseId]);

  const inviteUser = useCallback(async (email: string, role: EnterpriseRole, workspaceId?: string) => {
    if (!canManageUsers) {
      throw new Error('Permission denied');
    }

    const response = await fetch('/api/enterprise/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, workspaceId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to invite user');
    }

    await fetchUsers();
  }, [canManageUsers, fetchUsers]);

  const updateUserRole = useCallback(async (userId: string, role: EnterpriseRole) => {
    if (!canManageUsers) {
      throw new Error('Permission denied');
    }

    const response = await fetch(`/api/enterprise/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update user role');
    }

    await fetchUsers();
  }, [canManageUsers, fetchUsers]);

  const removeUser = useCallback(async (userId: string) => {
    if (!canManageUsers) {
      throw new Error('Permission denied');
    }

    const response = await fetch(`/api/enterprise/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to remove user');
    }

    await fetchUsers();
  }, [canManageUsers, fetchUsers]);

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    inviteUser,
    updateUserRole,
    removeUser,
    canManageUsers,
  };
}

// Hook for managing workspaces
export function useWorkspaces() {
  const { context, workspaces, currentWorkspace, switchWorkspace, canManageWorkspaces, refreshContext } = useEnterpriseContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkspace = useCallback(async (name: string, subVerticalId: string) => {
    if (!canManageWorkspaces) {
      throw new Error('Permission denied');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enterprise/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subVerticalId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create workspace');
      }

      await refreshContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [canManageWorkspaces, refreshContext]);

  const updateWorkspace = useCallback(async (workspaceId: string, updates: { name?: string }) => {
    if (!canManageWorkspaces) {
      throw new Error('Permission denied');
    }

    const response = await fetch(`/api/enterprise/workspaces/${workspaceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update workspace');
    }

    await refreshContext();
  }, [canManageWorkspaces, refreshContext]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
    if (!canManageWorkspaces) {
      throw new Error('Permission denied');
    }

    const response = await fetch(`/api/enterprise/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete workspace');
    }

    await refreshContext();
  }, [canManageWorkspaces, refreshContext]);

  return {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    isLoading,
    error,
    canManageWorkspaces,
  };
}

// Hook for enterprise settings
export function useEnterpriseSettings() {
  const { context, enterprise, canAccessSettings, refreshContext } = useEnterpriseContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEnterprise = useCallback(async (updates: { name?: string; domain?: string }) => {
    if (!canAccessSettings) {
      throw new Error('Permission denied');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enterprise/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      await refreshContext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [canAccessSettings, refreshContext]);

  return {
    enterprise,
    updateEnterprise,
    isLoading,
    error,
    canAccessSettings,
  };
}
