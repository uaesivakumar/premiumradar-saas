'use client';

/**
 * S299: Enterprise Context Provider
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * React context for enterprise, workspace, and demo state.
 * Provides enterprise-aware context throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================
// TYPES
// ============================================================

export interface EnterpriseData {
  id: string;
  name: string;
  type?: string;
  plan?: string;
}

export interface WorkspaceData {
  id: string;
  name: string;
  sub_vertical_id?: string;
}

export interface DemoData {
  is_demo: boolean;
  demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
  expires_at: Date | null;
  days_remaining: number | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatar_url?: string;
}

export interface EnterpriseContextState {
  // User
  user: UserProfile | null;

  // Enterprise
  enterprise: EnterpriseData | null;
  isEnterpriseUser: boolean;

  // Workspace
  workspace: WorkspaceData | null;
  workspaces: WorkspaceData[];

  // Demo
  demo: DemoData;
  isDemoUser: boolean;
  isDemoExpired: boolean;

  // Permissions
  isEnterpriseAdmin: boolean;
  isSuperAdmin: boolean;
  canManageUsers: boolean;
  canManageWorkspaces: boolean;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshContext: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const defaultDemoData: DemoData = {
  is_demo: false,
  demo_type: null,
  expires_at: null,
  days_remaining: null,
};

const defaultContextState: EnterpriseContextState = {
  user: null,
  enterprise: null,
  isEnterpriseUser: false,
  workspace: null,
  workspaces: [],
  demo: defaultDemoData,
  isDemoUser: false,
  isDemoExpired: false,
  isEnterpriseAdmin: false,
  isSuperAdmin: false,
  canManageUsers: false,
  canManageWorkspaces: false,
  isLoading: true,
  error: null,
  refreshContext: async () => {},
  switchWorkspace: async () => {},
  updateProfile: async () => {},
};

// ============================================================
// CONTEXT
// ============================================================

const EnterpriseContext = createContext<EnterpriseContextState>(defaultContextState);

// ============================================================
// PROVIDER
// ============================================================

interface EnterpriseProviderProps {
  children: ReactNode;
}

export function EnterpriseProvider({ children }: EnterpriseProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [enterprise, setEnterprise] = useState<EnterpriseData | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [demo, setDemo] = useState<DemoData>(defaultDemoData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const isEnterpriseUser = !!enterprise;
  const isDemoUser = demo.is_demo;
  const isDemoExpired = demo.is_demo && demo.expires_at !== null && new Date() > new Date(demo.expires_at);

  const isEnterpriseAdmin = user?.role === 'ENTERPRISE_ADMIN' ||
    user?.role === 'TENANT_ADMIN' ||
    user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canManageUsers = isEnterpriseAdmin;
  const canManageWorkspaces = isEnterpriseAdmin;

  // Fetch context data
  const refreshContext = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch user profile
      const profileRes = await fetch('/api/me');
      const profileData = await profileRes.json();

      if (!profileData.success) {
        // User not authenticated
        setUser(null);
        setEnterprise(null);
        setWorkspace(null);
        setWorkspaces([]);
        setDemo(defaultDemoData);
        setIsLoading(false);
        return;
      }

      const profile = profileData.data.profile;

      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatar_url: profile.avatar_url,
      });

      // Set enterprise
      if (profile.enterprise) {
        setEnterprise({
          id: profile.enterprise.id,
          name: profile.enterprise.name,
          type: profile.enterprise.type,
          plan: profile.enterprise.plan,
        });

        // Fetch workspaces
        const workspacesRes = await fetch('/api/enterprise/workspaces');
        const workspacesData = await workspacesRes.json();

        if (workspacesData.success) {
          setWorkspaces(workspacesData.data.workspaces.map((ws: { id: string; name: string; sub_vertical_id?: string }) => ({
            id: ws.id,
            name: ws.name,
            sub_vertical_id: ws.sub_vertical_id,
          })));
        }
      } else {
        setEnterprise(null);
        setWorkspaces([]);
      }

      // Set workspace
      if (profile.workspace) {
        setWorkspace({
          id: profile.workspace.id,
          name: profile.workspace.name,
          sub_vertical_id: profile.workspace.sub_vertical_id,
        });
      } else {
        setWorkspace(null);
      }

      // Set demo
      if (profile.demo) {
        setDemo({
          is_demo: profile.demo.is_demo,
          demo_type: profile.demo.demo_type,
          expires_at: profile.demo.expires_at ? new Date(profile.demo.expires_at) : null,
          days_remaining: profile.demo.days_remaining,
        });
      } else {
        setDemo(defaultDemoData);
      }
    } catch (err) {
      console.error('Failed to load enterprise context:', err);
      setError('Failed to load user context');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch workspace
  const switchWorkspace = useCallback(async (workspaceId: string) => {
    try {
      const res = await fetch('/api/me/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (res.ok) {
        await refreshContext();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to switch workspace');
      }
    } catch (err) {
      console.error('Failed to switch workspace:', err);
      throw err;
    }
  }, [refreshContext]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await refreshContext();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  }, [refreshContext]);

  // Initial load
  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const value: EnterpriseContextState = {
    user,
    enterprise,
    isEnterpriseUser,
    workspace,
    workspaces,
    demo,
    isDemoUser,
    isDemoExpired,
    isEnterpriseAdmin,
    isSuperAdmin,
    canManageUsers,
    canManageWorkspaces,
    isLoading,
    error,
    refreshContext,
    switchWorkspace,
    updateProfile,
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Use enterprise context
 */
export function useEnterprise(): EnterpriseContextState {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
}

/**
 * Use user profile only
 */
export function useUser(): UserProfile | null {
  const { user } = useEnterprise();
  return user;
}

/**
 * Use workspace context
 */
export function useWorkspace() {
  const { workspace, workspaces, switchWorkspace } = useEnterprise();
  return { workspace, workspaces, switchWorkspace };
}

/**
 * Use demo context
 */
export function useDemo() {
  const { demo, isDemoUser, isDemoExpired } = useEnterprise();
  return { demo, isDemoUser, isDemoExpired };
}

/**
 * Use permissions
 */
export function usePermissions() {
  const { isEnterpriseAdmin, isSuperAdmin, canManageUsers, canManageWorkspaces } = useEnterprise();
  return { isEnterpriseAdmin, isSuperAdmin, canManageUsers, canManageWorkspaces };
}

export default EnterpriseProvider;
