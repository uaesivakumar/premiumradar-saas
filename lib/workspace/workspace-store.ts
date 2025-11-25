/**
 * Workspace Store
 *
 * Zustand store for workspace and team state management.
 */

import { create } from 'zustand';
import type {
  Workspace,
  TeamMember,
  TeamRole,
  Invitation,
  WorkspacePlan,
} from './types';

interface WorkspaceState {
  // Current workspace
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];

  // Team
  members: TeamMember[];
  invitations: Invitation[];

  // Current user's role in current workspace
  currentUserRole: TeamRole | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions - Workspace
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;

  // Actions - Team
  setMembers: (members: TeamMember[]) => void;
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;

  // Actions - Invitations
  setInvitations: (invitations: Invitation[]) => void;
  addInvitation: (invitation: Invitation) => void;
  removeInvitation: (id: string) => void;

  // Actions - User role
  setCurrentUserRole: (role: TeamRole | null) => void;

  // Actions - Loading
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentWorkspace: null,
  workspaces: [],
  members: [],
  invitations: [],
  currentUserRole: null,
  isLoading: false,
  error: null,
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...initialState,

  // Workspace actions
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [...state.workspaces, workspace] })),

  updateWorkspace: (id, updates) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
      currentWorkspace:
        state.currentWorkspace?.id === id
          ? { ...state.currentWorkspace, ...updates }
          : state.currentWorkspace,
    })),

  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace:
        state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    })),

  // Team actions
  setMembers: (members) => set({ members }),

  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),

  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  removeMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),

  // Invitation actions
  setInvitations: (invitations) => set({ invitations }),

  addInvitation: (invitation) =>
    set((state) => ({ invitations: [...state.invitations, invitation] })),

  removeInvitation: (id) =>
    set((state) => ({
      invitations: state.invitations.filter((i) => i.id !== id),
    })),

  // Role actions
  setCurrentUserRole: (role) => set({ currentUserRole: role }),

  // Loading actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Reset
  reset: () => set(initialState),
}));

// ============================================================
// SELECTORS
// ============================================================

export const selectCurrentWorkspace = (state: WorkspaceState) =>
  state.currentWorkspace;

export const selectWorkspaces = (state: WorkspaceState) => state.workspaces;

export const selectMembers = (state: WorkspaceState) => state.members;

export const selectActiveMembers = (state: WorkspaceState) =>
  state.members.filter((m) => m.status === 'active');

export const selectInvitedMembers = (state: WorkspaceState) =>
  state.members.filter((m) => m.status === 'invited');

export const selectMembersByRole = (state: WorkspaceState, role: TeamRole) =>
  state.members.filter((m) => m.role === role);

export const selectIsOwner = (state: WorkspaceState) =>
  state.currentUserRole === 'owner';

export const selectIsAdmin = (state: WorkspaceState) =>
  state.currentUserRole === 'owner' || state.currentUserRole === 'admin';

export const selectCanInvite = (state: WorkspaceState) =>
  state.currentUserRole === 'owner' || state.currentUserRole === 'admin';

// ============================================================
// MOCK DATA HELPERS
// ============================================================

export function createMockWorkspace(overrides?: Partial<Workspace>): Workspace {
  return {
    id: 'ws_' + Math.random().toString(36).substr(2, 9),
    name: 'My Workspace',
    slug: 'my-workspace',
    ownerId: 'user_1',
    plan: 'professional',
    settings: {
      defaultRole: 'analyst',
      allowInvites: true,
      requireApproval: false,
      maxMembers: 10,
      features: {
        discovery: true,
        outreach: true,
        analytics: true,
        apiAccess: true,
        customBranding: false,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockMember(overrides?: Partial<TeamMember>): TeamMember {
  return {
    id: 'mem_' + Math.random().toString(36).substr(2, 9),
    userId: 'user_' + Math.random().toString(36).substr(2, 9),
    workspaceId: 'ws_1',
    role: 'analyst',
    email: 'member@example.com',
    name: 'Team Member',
    status: 'active',
    joinedAt: new Date(),
    lastActiveAt: new Date(),
    ...overrides,
  };
}
