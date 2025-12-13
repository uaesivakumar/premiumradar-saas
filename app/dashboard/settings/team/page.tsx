/**
 * Team Settings Page
 * VS12.5: Wired to real API data
 *
 * Manage workspace team members and permissions.
 * Now fetches real data from /api/admin/users
 *
 * Authorization Code: VS12-FRONTEND-WIRING-20251213
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  WorkspaceSelector,
  TeamManager,
  InviteModal,
  PermissionsTable,
} from '@/components/workspace';
import {
  useWorkspaceStore,
  selectCurrentWorkspace,
  selectIsOwner,
} from '@/lib/workspace';
import type { TeamRole, TeamMember, Workspace } from '@/lib/workspace';

export default function TeamSettingsPage() {
  const currentWorkspace = useWorkspaceStore(selectCurrentWorkspace);
  const isOwner = useWorkspaceStore(selectIsOwner);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const setMembers = useWorkspaceStore((s) => s.setMembers);
  const setCurrentUserRole = useWorkspaceStore((s) => s.setCurrentUserRole);
  const addInvitation = useWorkspaceStore((s) => s.addInvitation);
  const removeMember = useWorkspaceStore((s) => s.removeMember);
  const updateMember = useWorkspaceStore((s) => s.updateMember);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // VS12.5: Fetch real team data from API
  const fetchTeamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch users from admin API
      const response = await fetch('/api/admin/users');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch team data');
      }

      // Transform API response to workspace format
      const users = result.data?.users || [];
      const tenantName = result.data?.tenant?.name || 'My Workspace';
      const tenantId = result.data?.tenant?.id || 'ws_default';

      // Create workspace from tenant data
      const workspace: Workspace = {
        id: tenantId,
        name: tenantName,
        slug: tenantName.toLowerCase().replace(/\s+/g, '-'),
        ownerId: users.find((u: { role?: string }) => u.role === 'owner')?.id || users[0]?.id || '',
        plan: 'professional',
        settings: {
          maxMembers: 10,
          allowInvites: true,
          defaultRole: 'viewer',
          requireApproval: false,
          features: {
            discovery: true,
            outreach: true,
            analytics: true,
            apiAccess: false,
            customBranding: false,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Transform users to team members
      const members: TeamMember[] = users.map((user: {
        id: string;
        email: string;
        name?: string;
        full_name?: string;
        role?: string;
        status?: string;
        created_at?: string;
        last_login?: string;
      }) => ({
        id: `mem_${user.id}`,
        userId: user.id,
        workspaceId: tenantId,
        role: (user.role as TeamRole) || 'viewer',
        name: user.name || user.full_name || user.email.split('@')[0],
        email: user.email,
        avatarUrl: undefined,
        status: user.status === 'active' ? 'active' : 'invited',
        joinedAt: user.created_at ? new Date(user.created_at) : new Date(),
        lastActiveAt: user.last_login ? new Date(user.last_login) : undefined,
      }));

      setWorkspaces([workspace]);
      setCurrentWorkspace(workspace);
      setMembers(members);
      // Set current user role based on first user (assumes logged-in user is first)
      setCurrentUserRole(members[0]?.role || 'viewer');

    } catch (err) {
      console.error('[Team Settings] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  }, [setWorkspaces, setCurrentWorkspace, setMembers, setCurrentUserRole]);

  // VS12.5: Fetch data on mount
  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInvite = async (email: string, role: TeamRole) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    addInvitation({
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      workspaceId: currentWorkspace?.id || '',
      email,
      role,
      invitedBy: 'user_1',
      token: Math.random().toString(36).substr(2, 20),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      createdAt: new Date(),
    });
  };

  const handleRemove = (member: TeamMember) => {
    if (confirm(`Remove ${member.name} from the workspace?`)) {
      removeMember(member.id);
    }
  };

  const handleRoleChange = (member: TeamMember, newRole: TeamRole) => {
    updateMember(member.id, { role: newRole });
  };

  // VS12.5: Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  // VS12.5: Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load team</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchTeamData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <WorkspaceSelector className="w-64" />
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="text-xl font-semibold text-gray-900">Team Settings</h1>
              <button
                onClick={fetchTeamData}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh team data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowPermissions(!showPermissions)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {showPermissions ? 'Hide' : 'View'} Permissions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Permissions Matrix */}
          {showPermissions && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Role Permissions Matrix
              </h3>
              <PermissionsTable />
            </div>
          )}

          {/* Team Manager */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <TeamManager
              onInvite={() => setIsInviteModalOpen(true)}
              onRemove={handleRemove}
              onRoleChange={handleRoleChange}
            />
          </div>

          {/* Workspace Settings */}
          {currentWorkspace && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Workspace Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Max Members</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {currentWorkspace.settings.maxMembers}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Default Role</div>
                  <div className="text-2xl font-semibold text-gray-900 capitalize">
                    {currentWorkspace.settings.defaultRole}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Invites</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {currentWorkspace.settings.allowInvites ? 'Allowed' : 'Disabled'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Approval Required</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {currentWorkspace.settings.requireApproval ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
