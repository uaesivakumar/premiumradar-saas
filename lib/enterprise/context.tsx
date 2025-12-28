'use client';

/**
 * S323: Enterprise Context
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Enterprise Service Layer
 *
 * React context for enterprise-aware components.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { EnterpriseContext, EnterpriseRole, EnterpriseSummary, WorkspaceSummary } from './types';

// Context value type
interface EnterpriseContextValue {
  // Current enterprise context
  context: EnterpriseContext | null;
  isLoading: boolean;
  error: string | null;

  // Enterprise info
  enterprise: EnterpriseSummary | null;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;

  // Actions
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshContext: () => Promise<void>;

  // Permission checks
  hasRole: (requiredRole: EnterpriseRole) => boolean;
  canManageUsers: boolean;
  canManageWorkspaces: boolean;
  canAccessSettings: boolean;
  isDemo: boolean;
}

// Default context value
const defaultValue: EnterpriseContextValue = {
  context: null,
  isLoading: true,
  error: null,
  enterprise: null,
  workspaces: [],
  currentWorkspace: null,
  switchWorkspace: async () => {},
  refreshContext: async () => {},
  hasRole: () => false,
  canManageUsers: false,
  canManageWorkspaces: false,
  canAccessSettings: false,
  isDemo: false,
};

// Create context
const EnterpriseContextInstance = createContext<EnterpriseContextValue>(defaultValue);

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<EnterpriseRole, number> = {
  SUPER_ADMIN: 100,
  ENTERPRISE_ADMIN: 50,
  ENTERPRISE_USER: 25,
  INDIVIDUAL_USER: 10,
};

// Provider props
interface EnterpriseProviderProps {
  children: ReactNode;
}

// Provider component
export function EnterpriseProvider({ children }: EnterpriseProviderProps) {
  const [context, setContext] = useState<EnterpriseContext | null>(null);
  const [enterprise, setEnterprise] = useState<EnterpriseSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch enterprise context on mount
  const refreshContext = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch current session/context
      const response = await fetch('/api/enterprise/context');
      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in - clear context
          setContext(null);
          setEnterprise(null);
          setWorkspaces([]);
          setCurrentWorkspace(null);
          return;
        }
        throw new Error('Failed to fetch enterprise context');
      }

      const data = await response.json();

      setContext(data.context);
      setEnterprise(data.enterprise);
      setWorkspaces(data.workspaces || []);
      setCurrentWorkspace(data.currentWorkspace || null);
    } catch (err) {
      console.error('Failed to load enterprise context:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshContext();
  }, []);

  // Switch workspace
  const switchWorkspace = async (workspaceId: string) => {
    try {
      const response = await fetch('/api/enterprise/switch-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch workspace');
      }

      // Refresh context after switching
      await refreshContext();
    } catch (err) {
      console.error('Failed to switch workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch workspace');
    }
  };

  // Check if user has required role or higher
  const hasRole = (requiredRole: EnterpriseRole): boolean => {
    if (!context) return false;
    const userLevel = ROLE_HIERARCHY[context.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 100;
    return userLevel >= requiredLevel;
  };

  // Computed permissions
  const canManageUsers = hasRole('ENTERPRISE_ADMIN') && !context?.isDemo;
  const canManageWorkspaces = hasRole('ENTERPRISE_ADMIN') && !context?.isDemo;
  const canAccessSettings = hasRole('ENTERPRISE_ADMIN');
  const isDemo = context?.isDemo || false;

  const value: EnterpriseContextValue = {
    context,
    isLoading,
    error,
    enterprise,
    workspaces,
    currentWorkspace,
    switchWorkspace,
    refreshContext,
    hasRole,
    canManageUsers,
    canManageWorkspaces,
    canAccessSettings,
    isDemo,
  };

  return (
    <EnterpriseContextInstance.Provider value={value}>
      {children}
    </EnterpriseContextInstance.Provider>
  );
}

// Hook to use enterprise context
export function useEnterpriseContext(): EnterpriseContextValue {
  const context = useContext(EnterpriseContextInstance);
  if (!context) {
    throw new Error('useEnterpriseContext must be used within EnterpriseProvider');
  }
  return context;
}

// Named export for the context
export { EnterpriseContextInstance };
