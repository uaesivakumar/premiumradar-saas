/**
 * Permissions Table
 *
 * Visual display of role permissions matrix.
 */

'use client';

import { PERMISSION_MATRIX, ROLE_HIERARCHY, getRoleInfo } from '@/lib/workspace';
import type { TeamRole, Permission } from '@/lib/workspace';

interface PermissionsTableProps {
  highlightRole?: TeamRole;
  className?: string;
}

// Group permissions by category for better display
const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  workspace: {
    label: 'Workspace',
    permissions: ['workspace:read', 'workspace:update', 'workspace:delete', 'workspace:billing'],
  },
  team: {
    label: 'Team',
    permissions: ['team:read', 'team:invite', 'team:remove', 'team:role:change'],
  },
  discovery: {
    label: 'Discovery',
    permissions: ['discovery:read', 'discovery:export'],
  },
  outreach: {
    label: 'Outreach',
    permissions: ['outreach:read', 'outreach:create', 'outreach:send'],
  },
  analytics: {
    label: 'Analytics',
    permissions: ['analytics:read', 'analytics:export'],
  },
  api: {
    label: 'API',
    permissions: ['api:read', 'api:create', 'api:revoke'],
  },
};

const PERMISSION_LABELS: Record<Permission, string> = {
  'workspace:read': 'View workspace',
  'workspace:update': 'Edit settings',
  'workspace:delete': 'Delete workspace',
  'workspace:billing': 'Manage billing',
  'team:read': 'View members',
  'team:invite': 'Invite members',
  'team:remove': 'Remove members',
  'team:role:change': 'Change roles',
  'discovery:read': 'View companies',
  'discovery:export': 'Export data',
  'outreach:read': 'View outreach',
  'outreach:create': 'Create messages',
  'outreach:send': 'Send messages',
  'analytics:read': 'View analytics',
  'analytics:export': 'Export reports',
  'api:read': 'View API keys',
  'api:create': 'Create API keys',
  'api:revoke': 'Revoke API keys',
};

export function PermissionsTable({ highlightRole, className = '' }: PermissionsTableProps) {
  const hasPermission = (role: TeamRole, permission: Permission) => {
    return PERMISSION_MATRIX[role]?.includes(permission);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Permission
            </th>
            {ROLE_HIERARCHY.slice().reverse().map((role) => {
              const roleInfo = getRoleInfo(role);
              const isHighlighted = highlightRole === role;

              return (
                <th
                  key={role}
                  className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider border-b ${
                    isHighlighted
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {roleInfo.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Object.entries(PERMISSION_GROUPS).map(([groupKey, group], groupIndex) => (
            <>
              {/* Group Header */}
              <tr key={`group-${groupKey}`}>
                <td
                  colSpan={ROLE_HIERARCHY.length + 1}
                  className="bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {group.label}
                </td>
              </tr>

              {/* Permissions */}
              {group.permissions.map((permission, permIndex) => (
                <tr
                  key={permission}
                  className={permIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <td className="sticky left-0 bg-inherit px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    {PERMISSION_LABELS[permission]}
                  </td>
                  {ROLE_HIERARCHY.slice().reverse().map((role) => {
                    const hasAccess = hasPermission(role, permission);
                    const isHighlighted = highlightRole === role;

                    return (
                      <td
                        key={`${permission}-${role}`}
                        className={`px-4 py-2 text-center border-b border-gray-100 ${
                          isHighlighted ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        {hasAccess ? (
                          <svg
                            className={`w-5 h-5 mx-auto ${
                              isHighlighted ? 'text-blue-600' : 'text-green-500'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 mx-auto text-gray-300"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
