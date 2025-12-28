/**
 * S323: Enterprise Types
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Enterprise Service Layer
 */

// Re-export types from db layer
export type { Enterprise, CreateEnterpriseInput, UpdateEnterpriseInput, EnterpriseStatus, EnterpriseType, EnterprisePlan } from '@/lib/db/enterprises';
export type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput, WorkspaceStatus, WorkspaceWithSubVertical } from '@/lib/db/workspaces';

// Enterprise Role types (unified taxonomy)
export type EnterpriseRole =
  | 'SUPER_ADMIN'        // Platform-wide admin
  | 'ENTERPRISE_ADMIN'   // Enterprise-level admin
  | 'ENTERPRISE_USER'    // Regular enterprise user
  | 'INDIVIDUAL_USER';   // Solo user (no enterprise)

// Legacy role mapping
export const LEGACY_ROLE_MAP: Record<string, EnterpriseRole> = {
  'TENANT_ADMIN': 'ENTERPRISE_ADMIN',
  'TENANT_USER': 'ENTERPRISE_USER',
  'READ_ONLY': 'ENTERPRISE_USER',
};

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<EnterpriseRole, number> = {
  SUPER_ADMIN: 100,
  ENTERPRISE_ADMIN: 50,
  ENTERPRISE_USER: 25,
  INDIVIDUAL_USER: 10,
};

// Enterprise context for API calls
export interface EnterpriseContext {
  enterpriseId: string;
  enterpriseName?: string;
  workspaceId?: string;
  workspaceName?: string;
  role: EnterpriseRole;
  isDemo: boolean;
}

// User within enterprise context
export interface EnterpriseUser {
  id: string;
  email: string;
  name: string | null;
  role: EnterpriseRole;
  enterpriseId: string;
  workspaceId: string | null;
  isDemo: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// Workspace summary
export interface WorkspaceSummary {
  workspaceId: string;
  name: string;
  subVerticalKey: string;
  userCount: number;
  isDefault: boolean;
}

// Enterprise summary with stats
export interface EnterpriseSummary {
  enterpriseId: string;
  name: string;
  domain?: string;
  plan: string;
  userCount: number;
  workspaceCount: number;
  isAtUserLimit: boolean;
  isAtWorkspaceLimit: boolean;
}
