/**
 * Team Manager
 *
 * Displays and manages team members within a workspace.
 */

'use client';

import { useState } from 'react';
import {
  useWorkspaceStore,
  selectMembers,
  selectActiveMembers,
  selectIsAdmin,
  selectCanInvite,
  getRoleInfo,
  canManageRole,
} from '@/lib/workspace';
import type { TeamMember, TeamRole } from '@/lib/workspace';

interface TeamManagerProps {
  onInvite?: () => void;
  onRemove?: (member: TeamMember) => void;
  onRoleChange?: (member: TeamMember, newRole: TeamRole) => void;
}

export function TeamManager({ onInvite, onRemove, onRoleChange }: TeamManagerProps) {
  const members = useWorkspaceStore(selectMembers);
  const activeMembers = useWorkspaceStore(selectActiveMembers);
  const isAdmin = useWorkspaceStore(selectIsAdmin);
  const canInvite = useWorkspaceStore(selectCanInvite);
  const currentUserRole = useWorkspaceStore((s) => s.currentUserRole);

  const [filter, setFilter] = useState<'all' | 'active' | 'invited'>('all');
  const [search, setSearch] = useState('');

  const filteredMembers = members.filter((member) => {
    // Status filter
    if (filter === 'active' && member.status !== 'active') return false;
    if (filter === 'invited' && member.status !== 'invited') return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const getStatusBadge = (status: TeamMember['status']) => {
    const badges: Record<TeamMember['status'], { label: string; color: string }> = {
      active: { label: 'Active', color: 'bg-green-100 text-green-700' },
      invited: { label: 'Invited', color: 'bg-yellow-100 text-yellow-700' },
      suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
      removed: { label: 'Removed', color: 'bg-gray-100 text-gray-500' },
    };
    return badges[status];
  };

  const getRoleBadgeColor = (role: TeamRole) => {
    const colors: Record<TeamRole, string> = {
      owner: 'bg-purple-100 text-purple-700 border-purple-200',
      admin: 'bg-blue-100 text-blue-700 border-blue-200',
      analyst: 'bg-green-100 text-green-700 border-green-200',
      viewer: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return colors[role];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canInvite && (
          <button
            onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'active', 'invited'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? 'No members match your search' : 'No team members yet'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMembers.map((member) => {
                const roleInfo = getRoleInfo(member.role);
                const statusBadge = getStatusBadge(member.status);
                const canManage = currentUserRole && canManageRole(currentUserRole, member.role);

                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    {/* Member Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {member.lastActiveAt
                        ? new Date(member.lastActiveAt).toLocaleDateString()
                        : '—'}
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {canManage && member.status === 'active' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onRoleChange?.(member, 'viewer')}
                              className="text-sm text-gray-600 hover:text-gray-900"
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => onRemove?.(member)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
