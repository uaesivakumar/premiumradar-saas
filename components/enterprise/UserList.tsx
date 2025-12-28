'use client';

/**
 * S302: User List Component
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * Displays list of enterprise users with management actions.
 */

import React, { useState, useEffect } from 'react';
import { useEnterprise } from '@/lib/providers/EnterpriseContextProvider';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  workspace_id: string | null;
  is_demo: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface UserListProps {
  onUserSelect?: (user: User) => void;
  onInviteUser?: () => void;
}

export function UserList({ onUserSelect, onInviteUser }: UserListProps) {
  const { enterprise, user: currentUser, isEnterpriseAdmin } = useEnterprise();
  const [users, setUsers] = useState<User[]>([]);
  const [hasCapacity, setHasCapacity] = useState(true);
  const [limit, setLimit] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enterprise) {
      fetchUsers();
    }
  }, [enterprise]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enterprise/users');
      const data = await res.json();

      if (data.success) {
        setUsers(data.data.users);
        setHasCapacity(data.data.has_capacity);
        setLimit(data.data.limit);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      case 'ENTERPRISE_ADMIN':
      case 'TENANT_ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'ENTERPRISE_USER':
      case 'TENANT_USER':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatRole = (role: string) => {
    return role
      .replace('ENTERPRISE_', '')
      .replace('TENANT_', '')
      .replace('_', ' ')
      .split(' ')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!enterprise) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">
          No enterprise associated with your account.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Team Members
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {users.length} of {limit} users
          </p>
        </div>
        {isEnterpriseAdmin && hasCapacity && (
          <button
            onClick={onInviteUser}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            + Invite User
          </button>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                currentUser?.id === user.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
              onClick={() => onUserSelect?.(user)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name || user.email}
                    </p>
                    {currentUser?.id === user.id && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                        You
                      </span>
                    )}
                    {user.is_demo && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`text-xs px-2 py-1 rounded ${getRoleBadgeColor(user.role)}`}>
                  {formatRole(user.role)}
                </span>
                {user.last_login_at && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                    Last seen {new Date(user.last_login_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!hasCapacity && isEnterpriseAdmin && (
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
          User limit reached. Upgrade your plan to add more team members.
        </div>
      )}
    </div>
  );
}

export default UserList;
