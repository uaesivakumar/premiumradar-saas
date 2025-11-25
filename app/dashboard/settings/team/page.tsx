/**
 * Team Settings Page
 *
 * Manage workspace team members and permissions.
 */

'use client';

import { useState, useEffect } from 'react';
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
  createMockWorkspace,
  createMockMember,
} from '@/lib/workspace';
import type { TeamRole, TeamMember } from '@/lib/workspace';

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

  // Initialize with mock data for demo
  useEffect(() => {
    const mockWorkspace = createMockWorkspace({
      id: 'ws_demo',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'professional',
    });

    const mockMembers: TeamMember[] = [
      createMockMember({
        id: 'mem_1',
        userId: 'user_1',
        workspaceId: 'ws_demo',
        role: 'owner',
        name: 'Ahmed Al-Rashid',
        email: 'ahmed@acme.ae',
        status: 'active',
      }),
      createMockMember({
        id: 'mem_2',
        userId: 'user_2',
        workspaceId: 'ws_demo',
        role: 'admin',
        name: 'Sara Hassan',
        email: 'sara@acme.ae',
        status: 'active',
      }),
      createMockMember({
        id: 'mem_3',
        userId: 'user_3',
        workspaceId: 'ws_demo',
        role: 'analyst',
        name: 'Omar Khalid',
        email: 'omar@acme.ae',
        status: 'active',
      }),
      createMockMember({
        id: 'mem_4',
        userId: 'user_4',
        workspaceId: 'ws_demo',
        role: 'viewer',
        name: 'Fatima Noor',
        email: 'fatima@acme.ae',
        status: 'invited',
      }),
    ];

    setWorkspaces([mockWorkspace]);
    setCurrentWorkspace(mockWorkspace);
    setMembers(mockMembers);
    setCurrentUserRole('owner');
  }, [setWorkspaces, setCurrentWorkspace, setMembers, setCurrentUserRole]);

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
