/**
 * Workspace & Multi-Tenant Types
 *
 * Core types for workspace management, team roles, and tenant isolation.
 */

// ============================================================
// WORKSPACE TYPES
// ============================================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: WorkspacePlan;
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspacePlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface WorkspaceSettings {
  defaultRole: TeamRole;
  allowInvites: boolean;
  requireApproval: boolean;
  maxMembers: number;
  features: WorkspaceFeatures;
}

export interface WorkspaceFeatures {
  discovery: boolean;
  outreach: boolean;
  analytics: boolean;
  apiAccess: boolean;
  customBranding: boolean;
}

// ============================================================
// TEAM & ROLE TYPES
// ============================================================

export type TeamRole = 'owner' | 'admin' | 'analyst' | 'viewer';

export interface TeamMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: TeamRole;
  email: string;
  name: string;
  avatarUrl?: string;
  status: MemberStatus;
  invitedBy?: string;
  joinedAt?: Date;
  lastActiveAt?: Date;
}

export type MemberStatus = 'active' | 'invited' | 'suspended' | 'removed';

export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  status: InvitationStatus;
  createdAt: Date;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

// ============================================================
// PERMISSION TYPES
// ============================================================

export type Permission =
  // Workspace permissions
  | 'workspace:read'
  | 'workspace:update'
  | 'workspace:delete'
  | 'workspace:billing'
  // Team permissions
  | 'team:read'
  | 'team:invite'
  | 'team:remove'
  | 'team:role:change'
  // Discovery permissions
  | 'discovery:read'
  | 'discovery:export'
  // Outreach permissions
  | 'outreach:read'
  | 'outreach:create'
  | 'outreach:send'
  // Analytics permissions
  | 'analytics:read'
  | 'analytics:export'
  // API permissions
  | 'api:read'
  | 'api:create'
  | 'api:revoke';

export type PermissionMatrix = Record<TeamRole, Permission[]>;

// ============================================================
// TENANT ISOLATION TYPES
// ============================================================

export interface Tenant {
  id: string;
  workspaceId: string;
  isolationLevel: IsolationLevel;
  dataRegion: DataRegion;
  encryptionKey?: string;
  quotas: TenantQuotas;
  status: TenantStatus;
}

export type IsolationLevel = 'shared' | 'dedicated' | 'isolated';
export type DataRegion = 'uae' | 'ksa' | 'gcc' | 'global';
export type TenantStatus = 'active' | 'suspended' | 'migrating' | 'deleted';

export interface TenantQuotas {
  maxUsers: number;
  maxApiCalls: number;
  maxStorage: number; // in MB
  maxExports: number;
}

// ============================================================
// API KEY TYPES
// ============================================================

export interface ApiKey {
  id: string;
  workspaceId: string;
  name: string;
  keyPrefix: string; // First 8 chars for identification
  keyHash: string; // Hashed full key
  permissions: Permission[];
  rateLimit: number; // Requests per minute
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdBy: string;
  createdAt: Date;
  status: ApiKeyStatus;
}

export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

// ============================================================
// ACTIVITY & AUDIT TYPES
// ============================================================

export interface ActivityLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: ActivityAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export type ActivityAction =
  | 'workspace:created'
  | 'workspace:updated'
  | 'workspace:deleted'
  | 'member:invited'
  | 'member:joined'
  | 'member:removed'
  | 'member:role_changed'
  | 'api_key:created'
  | 'api_key:revoked'
  | 'discovery:searched'
  | 'discovery:exported'
  | 'outreach:sent'
  | 'settings:updated';
