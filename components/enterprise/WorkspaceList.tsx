'use client';

/**
 * S301: Workspace List Component
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Frontend & UI
 *
 * Displays list of workspaces with management actions.
 */

import React, { useState, useEffect } from 'react';
import { useEnterprise } from '@/lib/providers/EnterpriseContextProvider';

interface Workspace {
  id: string;
  name: string;
  slug?: string;
  sub_vertical_id?: string;
  status: string;
  is_default: boolean;
  created_at: string;
}

interface WorkspaceListProps {
  onWorkspaceSelect?: (workspace: Workspace) => void;
  onCreateWorkspace?: () => void;
}

export function WorkspaceList({ onWorkspaceSelect, onCreateWorkspace }: WorkspaceListProps) {
  const { enterprise, workspace: currentWorkspace, isEnterpriseAdmin, switchWorkspace } = useEnterprise();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  useEffect(() => {
    if (enterprise) {
      fetchWorkspaces();
    }
  }, [enterprise]);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enterprise/workspaces');
      const data = await res.json();

      if (data.success) {
        setWorkspaces(data.data.workspaces);
        setCanCreate(data.data.can_create);
      } else {
        setError(data.error || 'Failed to load workspaces');
      }
    } catch (err) {
      setError('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = async (ws: Workspace) => {
    if (currentWorkspace?.id === ws.id) return;

    setSwitchingTo(ws.id);
    try {
      await switchWorkspace(ws.id);
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    } finally {
      setSwitchingTo(null);
    }
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
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Workspaces
        </h3>
        {isEnterpriseAdmin && canCreate && (
          <button
            onClick={onCreateWorkspace}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            + New Workspace
          </button>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {workspaces.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
            No workspaces found
          </div>
        ) : (
          workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                currentWorkspace?.id === ws.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => onWorkspaceSelect?.(ws)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white">{ws.name}</p>
                    {ws.is_default && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                        Default
                      </span>
                    )}
                    {currentWorkspace?.id === ws.id && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </div>
                  {ws.slug && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">/{ws.slug}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {currentWorkspace?.id !== ws.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitch(ws);
                    }}
                    disabled={switchingTo === ws.id}
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-50"
                  >
                    {switchingTo === ws.id ? 'Switching...' : 'Switch'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!canCreate && isEnterpriseAdmin && (
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
          Workspace limit reached. Upgrade your plan to add more.
        </div>
      )}
    </div>
  );
}

export default WorkspaceList;
