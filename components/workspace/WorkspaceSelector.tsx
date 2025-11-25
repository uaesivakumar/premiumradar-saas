/**
 * Workspace Selector
 *
 * Dropdown for switching between workspaces.
 */

'use client';

import { useState } from 'react';
import {
  useWorkspaceStore,
  selectCurrentWorkspace,
  selectWorkspaces,
} from '@/lib/workspace';
import type { Workspace } from '@/lib/workspace';

interface WorkspaceSelectorProps {
  onSelect?: (workspace: Workspace) => void;
  className?: string;
}

export function WorkspaceSelector({ onSelect, className = '' }: WorkspaceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentWorkspace = useWorkspaceStore(selectCurrentWorkspace);
  const workspaces = useWorkspaceStore(selectWorkspaces);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  const handleSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    setIsOpen(false);
    onSelect?.(workspace);
  };

  const getPlanBadge = (plan: Workspace['plan']) => {
    const badges: Record<Workspace['plan'], { label: string; color: string }> = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-600' },
      starter: { label: 'Starter', color: 'bg-blue-100 text-blue-600' },
      professional: { label: 'Pro', color: 'bg-purple-100 text-purple-600' },
      enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-600' },
    };
    return badges[plan];
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors w-full"
      >
        {/* Workspace Icon */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {currentWorkspace?.name.charAt(0).toUpperCase() || 'W'}
        </div>

        {/* Workspace Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </div>
          {currentWorkspace && (
            <div className="text-xs text-gray-500">
              {getPlanBadge(currentWorkspace.plan).label} Plan
            </div>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
            {workspaces.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No workspaces available
              </div>
            ) : (
              workspaces.map((workspace) => {
                const badge = getPlanBadge(workspace.plan);
                const isSelected = workspace.id === currentWorkspace?.id;

                return (
                  <button
                    key={workspace.id}
                    onClick={() => handleSelect(workspace)}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {workspace.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        /{workspace.slug}
                      </div>
                    </div>

                    {/* Plan Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>

                    {/* Check */}
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}

            {/* Create New */}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Workspace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
